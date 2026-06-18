varying float vLife;

void main() {
  
  float alpha = 1.0 - smoothstep(0.8, 1.0, vLife);
  gl_FragColor = vec4(0.85, 0.95, 1.0, alpha);
}