
// ─────────────────────────────────────────────────────────────────────────────
//  WaterFlowMap  —  Flowmap-driven stylised river shader
//  Now includes lily pad foam in addition to rock foam.
// ─────────────────────────────────────────────────────────────────────────────

export const vertexHeaderWaterFlowMap = `
  varying vec3 vPos;
  varying vec2 vUv;
  varying vec3 vWorldPos;
`;

export const vertexMainWaterFlowMap = `
  vPos      = position;
  vUv       = uv;
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
`;

// ─── Fragment header ──────────────────────────────────────────────────────────
export const fragmentHeaderWaterFlowMap = `
  varying vec3 vPos;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  uniform float uTime;
  uniform sampler2D tDudv;
  uniform float cameraNear;
  uniform float cameraFar;
  uniform vec2  resolution;

  // Colors
  uniform vec3 uColorDeep;
  uniform vec3 uColorShallow;
  uniform vec3 uColorFoam;

  // Flow
  uniform float flowSpeed;
  uniform float flowScale;
  uniform float flowStrength;
  uniform float flowContrast;

  // Dual-scroll blend
  uniform float noiseScale;
  uniform float noiseStrength;

  // Shore foam
  uniform float shoreFoamWidth;
  uniform float shoreFoamSharp;

  // ── Rock foam ─────────────────────────────────────────────────────────────
  #define MAX_ROCKS 50
  uniform vec3  rockPositions[MAX_ROCKS];
  uniform float rockRadii[MAX_ROCKS];
  uniform int   numRocks;
  uniform float rockFoamStrength;
  uniform float rockFoamRadius;
  uniform float rockFoamScale;
  uniform float rockFoamSpeed;
  uniform float rockFoamThreshold;
  uniform float rockRadiusMultiplier;
  uniform float enableRockFoam;

  // ── Lily pad foam ─────────────────────────────────────────────────────────
  #define MAX_LILYPADS 20
  uniform vec3  lilyPadPositions[MAX_LILYPADS];
  uniform int   numLilyPads;
  uniform float lilyPadFoamStrength;
  uniform float lilyPadFoamRadius;   // how far foam extends from pad edge
  uniform float lilyPadRadius;       // approximate world-space radius of a pad
  uniform float lilyPadFoamScale;
  uniform float lilyPadFoamSpeed;
  uniform float lilyPadFoamThreshold;
  uniform float enableLilyPadFoam;

  #include <packing>

  // ── Perlin noise helpers ──────────────────────────────────────────────────
  vec3 mod289v3(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 mod289v4(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute4(vec4 x) { return mod289v4(((x*34.0)+10.0)*x); }
  vec4 taylorInvSqrt4(vec4 r) { return 1.79284291400159 - 0.85373472095314*r; }
  vec3 fade3(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

  float cnoise(vec3 P) {
    vec3 Pi0=floor(P), Pi1=Pi0+1.0;
    Pi0=mod289v3(Pi0); Pi1=mod289v3(Pi1);
    vec3 Pf0=fract(P), Pf1=Pf0-1.0;
    vec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x);
    vec4 iy=vec4(Pi0.y,Pi0.y,Pi1.y,Pi1.y);
    vec4 iz0=vec4(Pi0.z), iz1=vec4(Pi1.z);
    vec4 ixy=permute4(permute4(ix)+iy);
    vec4 ixy0=permute4(ixy+iz0), ixy1=permute4(ixy+iz1);
    vec4 gx0=ixy0/7.0, gy0=fract(floor(gx0)/7.0)-0.5; gx0=fract(gx0);
    vec4 gz0=0.5-abs(gx0)-abs(gy0); vec4 sz0=step(gz0,vec4(0.0));
    gx0-=sz0*(step(0.0,gx0)-0.5); gy0-=sz0*(step(0.0,gy0)-0.5);
    vec4 gx1=ixy1/7.0, gy1=fract(floor(gx1)/7.0)-0.5; gx1=fract(gx1);
    vec4 gz1=0.5-abs(gx1)-abs(gy1); vec4 sz1=step(gz1,vec4(0.0));
    gx1-=sz1*(step(0.0,gx1)-0.5); gy1-=sz1*(step(0.0,gy1)-0.5);
    vec3 g000=vec3(gx0.x,gy0.x,gz0.x),g100=vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010=vec3(gx0.z,gy0.z,gz0.z),g110=vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001=vec3(gx1.x,gy1.x,gz1.x),g101=vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011=vec3(gx1.z,gy1.z,gz1.z),g111=vec3(gx1.w,gy1.w,gz1.w);
    vec4 norm0=taylorInvSqrt4(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
    g000*=norm0.x; g010*=norm0.y; g100*=norm0.z; g110*=norm0.w;
    vec4 norm1=taylorInvSqrt4(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
    g001*=norm1.x; g011*=norm1.y; g101*=norm1.z; g111*=norm1.w;
    float n000=dot(g000,Pf0), n100=dot(g100,vec3(Pf1.x,Pf0.yz));
    float n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z)), n110=dot(g110,vec3(Pf1.xy,Pf0.z));
    float n001=dot(g001,vec3(Pf0.xy,Pf1.z)), n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));
    float n011=dot(g011,vec3(Pf0.x,Pf1.yz)), n111=dot(g111,Pf1);
    vec3 fxyz=fade3(Pf0);
    vec4 nz=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fxyz.z);
    vec2 nyz=mix(nz.xy,nz.zw,fxyz.y);
    return 2.2*mix(nyz.x,nyz.y,fxyz.x);
  }

  vec3 curl_noise(vec3 p) {
    const float e = 0.01;
    float dx = cnoise(p+vec3(e,0,0)) - cnoise(p-vec3(e,0,0));
    float dy = cnoise(p+vec3(0,e,0)) - cnoise(p-vec3(0,e,0));
    float dz = cnoise(p+vec3(0,0,e)) - cnoise(p-vec3(0,0,e));
    return vec3(dy-dz, dz-dx, dx-dy) / (2.0*e);
  }

  float getViewZ(float d) { return perspectiveDepthToViewZ(d, cameraNear, cameraFar); }

  float streamNoise(vec2 uv, float t) {
    vec2 stretched = vec2(uv.x * 3.0, uv.y * 0.6);
    float phaseA = fract(t * flowSpeed);
    vec2  uvA    = stretched + vec2(0.0, phaseA);
    float nA     = cnoise(vec3(uvA, 0.0)) * 0.5 + 0.5;
    float phaseB = fract(t * flowSpeed * 0.5 + 0.5);
    vec2  uvB    = stretched + vec2(0.0, phaseB);
    float nB     = cnoise(vec3(uvB, 1.7)) * 0.5 + 0.5;
    float w = abs(fract(t * flowSpeed) * 2.0 - 1.0);
    return mix(nA, nB, w);
  }
`;

// ─── Fragment main ────────────────────────────────────────────────────────────
export const fragmentMainWaterFlowMap = `
  float waterViewZ      = getViewZ(gl_FragCoord.z);
  float depthDifference = abs(waterViewZ);

  // ── 1. FLOWMAP UV WARP ───────────────────────────────────────────────────
  vec2 baseUv  = vPos.xz * flowScale;
  vec2 flowDir = texture2D(tDudv, baseUv * 0.25).rg * 2.0 - 1.0;
  flowDir      = mix(vec2(0.0, 1.0), flowDir, flowStrength);

  float timeA = fract(uTime * flowSpeed);
  float timeB = fract(uTime * flowSpeed + 0.5);
  float blend  = abs(timeA * 2.0 - 1.0);

  vec2 uvA = baseUv - flowDir * timeA;
  vec2 uvB = baseUv - flowDir * timeB;

  // ── 2. DIRECTIONAL STREAK HIGHLIGHTS ────────────────────────────────────
  float streakA   = streamNoise(uvA * noiseScale, uTime);
  float streakB   = streamNoise(uvB * noiseScale, uTime + 0.5);
  float streaks   = mix(streakA, streakB, blend);
  streaks         = pow(clamp(streaks, 0.0, 1.0), flowContrast);

  float broadA    = cnoise(vec3(uvA * noiseScale * 0.4, 0.0)) * 0.5 + 0.5;
  float broadB    = cnoise(vec3(uvB * noiseScale * 0.4, 0.9)) * 0.5 + 0.5;
  float broad     = mix(broadA, broadB, blend);
  broad           = smoothstep(0.3, 0.7, broad);

  float surfaceMask = clamp(broad * noiseStrength + streaks * (1.0 - noiseStrength), 0.0, 1.0);

// ── 3. ROCK FOAM (OPTIMIZED) ─────────────────────────────────────────────
  float totalRockFoam = 0.0;
  if (enableRockFoam > 0.5) {
    for (int i = 0; i < MAX_ROCKS; i++) {
      if (i >= numRocks) break;
      float dist         = distance(vWorldPos.xz, rockPositions[i].xz);
      float foamRadius   = rockRadii[i] * rockRadiusMultiplier;
      float distFromEdge = dist - foamRadius;

      if (distFromEdge > 0.0 && distFromEdge < rockFoamRadius) {
        float t = distFromEdge / rockFoamRadius;
        
        // OPTIMIZATION: Replaced expensive curl_noise with fast trigonometric wobble
        vec2 p = vWorldPos.xz * rockFoamScale * 0.5;
        float wobble = sin(p.x + uTime * rockFoamSpeed) * cos(p.y + uTime * rockFoamSpeed) * 0.5 + 0.5;
        
        float falloff = pow(1.0 - t, 2.0);
        float noiseAmt= cnoise(vec3(vWorldPos.xz * rockFoamScale, uTime * rockFoamSpeed)) * 0.5 + 0.5;
        float foamShape = smoothstep(rockFoamThreshold, rockFoamThreshold + 0.2, noiseAmt * falloff * wobble);
        totalRockFoam += foamShape * rockFoamStrength;
      }
    }
    totalRockFoam = clamp(totalRockFoam, 0.0, 1.0);
  }

  // ── 4. LILY PAD FOAM (OPTIMIZED) ─────────────────────────────────────────
  float totalLilyFoam = 0.0;
  if (enableLilyPadFoam > 0.5) {
    for (int i = 0; i < MAX_LILYPADS; i++) {
      if (i >= numLilyPads) break;

      float dist         = distance(vWorldPos.xz, lilyPadPositions[i].xz);
      float distFromEdge = dist - lilyPadRadius;

      if (distFromEdge > 0.0 && distFromEdge < lilyPadFoamRadius) {
        float t = distFromEdge / lilyPadFoamRadius;

        // OPTIMIZATION: Fast trigonometric wobble instead of curl_noise
        vec2 p = vWorldPos.xz * lilyPadFoamScale * 0.5;
        float wobble = sin(p.x + uTime * lilyPadFoamSpeed) * cos(p.y + uTime * lilyPadFoamSpeed) * 0.5 + 0.5;

        float falloff   = pow(1.0 - t, 2.5);
        float noiseAmt  = cnoise(vec3(vWorldPos.xz * lilyPadFoamScale, uTime * lilyPadFoamSpeed)) * 0.5 + 0.5;
        float foamShape = smoothstep(lilyPadFoamThreshold, lilyPadFoamThreshold + 0.2, noiseAmt * falloff * wobble);

        totalLilyFoam += foamShape * lilyPadFoamStrength;
      }
    }
    totalLilyFoam = clamp(totalLilyFoam, 0.0, 1.0);
  }

  // ── 5. SHORE FOAM ───────────────────────────────────────────────────────
  float shoreMask   = 1.0 - smoothstep(0.0, shoreFoamWidth, depthDifference);
  float shoreRipple = sin(depthDifference * 60.0 - uTime * 4.0);
  shoreRipple       = smoothstep(shoreFoamSharp, 1.0, shoreRipple);
  float shoreFoam   = clamp(shoreMask + shoreMask * shoreRipple, 0.0, 1.0);

  // ── 6. COMPOSITE ─────────────────────────────────────────────────────────
  vec3 finalColor = mix(uColorDeep, uColorShallow, surfaceMask);
  finalColor      = mix(finalColor, uColorFoam, totalRockFoam);
  finalColor      = mix(finalColor, uColorFoam, totalLilyFoam);
  finalColor      = mix(finalColor, uColorFoam, shoreFoam);

  diffuseColor    = vec4(finalColor, diffuseColor.a);
`;

// -------------------------------- WaterFlow Shader ---------------------------------------------------------------------------
export const vertexHeaderWaterFlowExtra = `
  varying vec3 vPos;
  varying vec2 vUv;
  varying vec3 vWorldPos; // 👈 Add this
`;

export const vertexMainWaterFlowExtra = `
  vPos = position; 
  vUv = uv; 
  // 👈 Calculate world position
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
`;

export const fragmentHeaderWaterFlowExtra = `
    varying vec3 vPos;
    varying vec2 vUv;
    varying vec3 vWorldPos;

    uniform float uTime;
    uniform float uProgress1;
    uniform float uProgress2;
    uniform sampler2D tDudv;
    uniform float cameraNear;
    uniform float cameraFar;
    uniform vec2 resolution;
    uniform float threshold;

    #define MAX_ROCKS 50

    uniform vec3 rockPositions[MAX_ROCKS];
    uniform float rockRadii[MAX_ROCKS];
    uniform int numRocks;
    
    // Rock wave parameters
    uniform float rockWaveAmplitude;
    uniform float rockWaveFrequency;
    uniform float rockWaveSpeed;
    uniform float rockInfluenceRadius;
    uniform float rockInfluenceAmount;
    uniform float suppressWaveDistance;
    uniform float enableRockWaves;

    #include <packing>

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    vec3 fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

    float cnoise(vec3 P) {
      vec3 Pi0 = floor(P); vec3 Pi1 = Pi0 + vec3(1.0);
      Pi0 = mod289(Pi0); Pi1 = mod289(Pi1);
      vec3 Pf0 = fract(P); vec3 Pf1 = Pf0 - vec3(1.0);
      vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x); vec4 iy = vec4(Pi0.yy, Pi1.yy);
      vec4 iz0 = Pi0.zzzz; vec4 iz1 = Pi1.zzzz;
      vec4 ixy = permute(permute(ix) + iy); vec4 ixy0 = permute(ixy + iz0); vec4 ixy1 = permute(ixy + iz1);
      vec4 gx0 = ixy0 * (1.0 / 7.0); vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5; gx0 = fract(gx0);
      vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0); vec4 sz0 = step(gz0, vec4(0.0));
      gx0 -= sz0 * (step(0.0, gx0) - 0.5); gy0 -= sz0 * (step(0.0, gy0) - 0.5);
      vec4 gx1 = ixy1 * (1.0 / 7.0); vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5; gx1 = fract(gx1);
      vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1); vec4 sz1 = step(gz1, vec4(0.0));
      gx1 -= sz1 * (step(0.0, gx1) - 0.5); gy1 -= sz1 * (step(0.0, gy1) - 0.5);
      vec3 g000 = vec3(gx0.x, gy0.x, gz0.x); vec3 g100 = vec3(gx0.y, gy0.y, gz0.y); vec3 g010 = vec3(gx0.z, gy0.z, gz0.z); vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
      vec3 g001 = vec3(gx1.x, gy1.x, gz1.x); vec3 g101 = vec3(gx1.y, gy1.y, gz1.y); vec3 g011 = vec3(gx1.z, gy1.z, gz1.z); vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);
      vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110))); g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
      vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111))); g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
      float n000 = dot(g000, Pf0); float n100 = dot(g100, vec3(Pf1.x, Pf0.yz)); float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z)); float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
      float n001 = dot(g001, vec3(Pf0.xy, Pf1.z)); float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z)); float n011 = dot(g011, vec3(Pf0.x, Pf1.yz)); float n111 = dot(g111, Pf1);
      vec3 fade_xyz = fade(Pf0);
      vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
      vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
      float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
      return 2.2 * n_xyz;
    }

    vec3 curl_noise(vec3 p) {
      const float step = 0.01;
      float ddx = cnoise(p + vec3(step, 0.0, 0.0)) - cnoise(p - vec3(step, 0.0, 0.0));
      float ddy = cnoise(p + vec3(0.0, step, 0.0)) - cnoise(p - vec3(0.0, step, 0.0));
      float ddz = cnoise(p + vec3(0.0, 0.0, step)) - cnoise(p - vec3(0.0, 0.0, step));
      const float divisor = 1.0 / (2.0 * step);
      return (vec3(ddy - ddz, ddz - ddx, ddx - ddy) * divisor);
    }

    float roundValue(float a) { return floor(a + 0.5); }
    float getViewZ(float depth) { return perspectiveDepthToViewZ(depth, cameraNear, cameraFar); }
  `;

export const fragmentMainWaterFlowExtra = `
    vec2 screenUV = gl_FragCoord.xy / resolution;
    float waterViewZ = getViewZ(gl_FragCoord.z);
    float depthDifference = abs(waterViewZ);

    vec2 flowUv = vPos.xz * 0.5 + 0.5;
    flowUv.y -= uTime * 0.5;

    vec3 curl = curl_noise(vec3(flowUv * 3.0 * 2.65, uTime * 0.2));
    flowUv += curl.xy * 0.08 * 0.85;

    float n = cnoise(vec3(flowUv.x * 0.0, flowUv.y * 7.0, 0.0));
    float water = smoothstep(0.0, 0.2, n);
    water = roundValue(water * 10.0) / 10.0;

    // ===== ROCK WAVE INTERACTION =====
    float rockInfluence = 0.0;
    float distToClosestRock = 1000.0;

    if(enableRockWaves > 0.5) {
        for(int i = 0; i < MAX_ROCKS; i++) {
            if(i >= numRocks) break;
            
            vec3 rockPos = rockPositions[i];
            float rockRadius = rockRadii[i];
            
            // XZ distance only (ignore height)
            // float dist = distance(vPos.xz, rockPos.xz);
            // distToClosestRock = min(distToClosestRock, dist - rockRadius);
            
            float dist = distance(vWorldPos.xz, rockPos.xz);
            distToClosestRock = min(distToClosestRock, dist - rockRadius);

            float influenceRange = rockRadius * rockInfluenceRadius;
            
            if(dist < influenceRange) {
                float waveDistance = dist - rockRadius;
                float rockWave = sin(waveDistance * rockWaveFrequency - uTime * rockWaveSpeed) * rockWaveAmplitude;
                
                float falloffStart = influenceRange;
                float falloffEnd = rockRadius * 0.3;
                float influence = (falloffStart - dist) / (falloffStart - falloffEnd);
                influence = max(0.0, min(1.0, influence));
                
                rockInfluence += influence * rockWave;
            }
        }
        
        float suppressRange = suppressWaveDistance;
        float waveStrength = distToClosestRock < suppressRange ? 0.2 : 1.0;
        // water += rockInfluence * waveStrength * rockInfluenceAmount;

        // Optional stylistic tweak in fragmentMainWaterFlow:
        float cleanWave = smoothstep(0.1, 0.2, rockInfluence); 
      water += cleanWave * waveStrength * rockInfluenceAmount;
    }

    // ===== NORMAL WATER RENDERING =====
    vec3 lightBlue = vec3(0.0, 0.75, 1.0);
    vec3 white = vec3(1.0, 1.0, 1.0);

    float rippleMask = 1.0 - smoothstep(0.0, threshold, depthDifference);
    float ripple = sin(depthDifference * 120.0 * 0.8 - uTime * 8.0);
    float curlRippleNoice = curl_noise(vec3(vUv + 10.0, uTime * 0.5)).z * 0.5 + 0.5;

    ripple = smoothstep(0.4, 1.0, ripple * curlRippleNoice);
    ripple *= rippleMask;

    vec3 col = mix(lightBlue, white, water);
    col = mix(col, vec3(0.85), rippleMask);
    col += n * rippleMask * uProgress1 * 0.25;
    col += ripple * 0.25;

    diffuseColor = vec4(col, diffuseColor.a);
  `;

// WaterBubbles.ts
// -------------------------------- WaterBubbles Shader ---------------------------------------------------------------------------
export const vertexHeaderWaterBubbles = `
  // Note: Three.js automatically provides 'position', 'uv', and 'normal'
  attribute vec3 aPosition;
  attribute float aSize;
  attribute float aSpeed;
  attribute float aOffset;
  attribute vec3 aScale;      

  uniform float uTime;
  uniform float uBoxHeight;     

  varying float vLife;
`;

export const vertexMainWaterBubbles = `
  float boxHeight = uBoxHeight;
  float life = fract(uTime * aSpeed * 0.25 + aOffset);
  
  vLife = life;

  float y = -boxHeight * 0.5 + life * boxHeight;
  float wobbleX = sin(uTime * 2.0 + aOffset * 50.0) * 0.03;
  float wobbleZ = cos(uTime * 1.5 + aOffset * 40.0) * 0.03;
  float shrink = 1.0 - smoothstep(0.8, 1.0, life);
  float scale = aSize * shrink;

  // In Three.js <begin_vertex> chunk, a vec3 called 'transformed' is created.
  // We modify 'transformed' instead of creating a new 'pos' variable.
  
  // 1. Apply your custom scale
  transformed *= scale;

  // 2. Add your custom instanced positions and wobble
  transformed += vec3(aPosition.x + wobbleX, y, aPosition.z + wobbleZ);

  // Note: We DO NOT multiply by modelViewMatrix or set gl_Position.
  // Three.js handles all the camera and matrix math automatically below this chunk!
`;

export const fragmentHeaderWaterBubbles = `
  varying float vLife;
`;

export const fragmentMainWaterBubbles = `
  float alpha = 1.0 - smoothstep(0.8, 1.0, vLife);
  
  // In Three.js <color_fragment> chunk, we override the diffuseColor variable.
  // This allows Three.js to apply lighting, shadows, and fog OVER your base color!
  // diffuseColor = vec4(0.85, 0.95, 1.0, alpha);
  diffuseColor = vec4(1.0, 1.0, 1.0, alpha);
`;
