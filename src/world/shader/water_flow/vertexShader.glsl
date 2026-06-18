varying vec3 vPos;
varying vec2 vUv;

float PI = 3.14159265;



void main() {
    vUv = uv;
    vec3 pos = position;
    vPos = pos;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}