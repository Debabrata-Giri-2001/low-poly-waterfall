export const CheapDOFShader = {
  name: "CheapDOFShader",
  
  uniforms: {
    tDiffuse: { value: null },   // Automatically provided by EffectComposer (Color pass)
    tDepth: { value: null },     // We will manually pass your depthTexture here
    uFocus: { value: 3.5 },      // Distance from camera that stays perfectly sharp
    uAperture: { value: 0.1 },   // Blur strength scaling factor
    uMaxBlur: { value: 0.015 },  // Caps the blur size so it stays clean and cheap
    uNear: { value: 0.1 },       // Camera near plane
    uFar: { value: 1000.0 },      // Camera far plane
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    
    uniform float uFocus;
    uniform float uAperture;
    uniform float uMaxBlur;
    uniform float uNear;
    uniform float uFar;

    varying vec2 vUv;

    // Linearize the non-linear depth buffer value into world units
    float getLinearDepth(vec2 uv) {
      float z = texture2D(tDepth, uv).r;
      return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear));
    }

    void main() {
      float linearDepth = getLinearDepth(vUv);

      // Compute Circle of Confusion (blur factor) based on distance from focal plane
      float coc = abs(linearDepth - uFocus) * uAperture;
      coc = min(coc, uMaxBlur);

      // Early exit if the pixel is perfectly in focus to save processing power
      if (coc < 0.0002) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }

      // Perform an optimized 9-tap rotation blur using the computed blur radius (coc)
      vec4 colorSum = texture2D(tDiffuse, vUv);
      float totalWeight = 1.0;

      // Direct sampling offsets surrounding the pixel
      vec2 offsets[8];
      offsets[0] = vec2(-0.7, -0.7);
      offsets[1] = vec2( 0.0, -1.0);
      offsets[2] = vec2( 0.7, -0.7);
      offsets[3] = vec2(-1.0,  0.0);
      offsets[4] = vec2( 1.0,  0.0);
      offsets[5] = vec2(-0.7,  0.7);
      offsets[6] = vec2( 0.0,  1.0);
      offsets[7] = vec2( 0.7,  0.7);

      for (int i = 0; i < 8; i++) {
        vec2 sampleUv = vUv + offsets[i] * coc;
        colorSum += texture2D(tDiffuse, sampleUv);
        totalWeight += 1.0;
      }

      gl_FragColor = colorSum / totalWeight;
      gl_FragColor = vec4(vec3(texture2D(tDepth, vUv).r), 1.0);
    }
  `
};