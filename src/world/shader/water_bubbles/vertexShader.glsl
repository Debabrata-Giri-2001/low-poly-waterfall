attribute vec3 aPosition;
attribute float aSize;
attribute float aSpeed;
attribute float aOffset;
attribute vec3 aScale;

uniform float uTime;
uniform float uBoxHeight;

varying float vLife;

void main() {
    float boxHeight = uBoxHeight;

    float life = fract(uTime * aSpeed * 0.25 + aOffset);

    vLife = life;

    float y = -boxHeight * 0.5 +life * boxHeight;

    float wobbleX = sin(uTime * 2.0 + aOffset * 50.0) * 0.03;
    float wobbleZ = cos(uTime * 1.5 + aOffset * 40.0) * 0.03;
    float shrink = 1.0 - smoothstep(0.8, 1.0, life);

    float scale = aSize * shrink;

    float deform = 1.0 + sin(uTime * 5.0 + aOffset * 20.0) * 0.15;

    vec3 pos = position * scale;
    // vec3 pos = position * (aScale * scale);

    // pos.x *= deform;
    // pos.z *= deform;
    // pos.y *= 2.0 - deform;

    pos += vec3(aPosition.x + wobbleX, y, aPosition.z + wobbleZ);
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    gl_Position = projectionMatrix * mvPosition;
}