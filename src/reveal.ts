import * as THREE from "three";
import gsap from "gsap";

export default class Reveal {
  canvas: HTMLCanvasElement;

  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;

  ringGroup!: THREE.Group;
  ring!: THREE.Mesh;
  secondaryRing!: THREE.Mesh; 
  particles!: THREE.Points;   

  progress = 0;
  targetProgress = 0;
  
  clock = new THREE.Clock(); 

  percentElement: HTMLElement;

  background!: THREE.Mesh;
  backgroundMaterial!: THREE.ShaderMaterial;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    this.percentElement = document.querySelector(
      ".ts-loader-percent",
    ) as HTMLElement;

    this.scene = new THREE.Scene();

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    this.camera.position.z = 1;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.ringGroup = new THREE.Group();
    this.scene.add(this.ringGroup);

    this.createBackground();
    this.createRing();
    this.createSecondaryRing(); 
    this.createParticles();     

    // Make sure we resize properly right away
    this.resize();

    window.addEventListener("resize", this.resize);

    this.tick();
  }

  createRing() {
    const geometry = new THREE.RingGeometry(0.35, 0.45, 128, 1, 0, 0.001);

    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });

    this.ring = new THREE.Mesh(geometry, material);
    this.ringGroup.add(this.ring); 
  }

  createSecondaryRing() {
    const geometry = new THREE.RingGeometry(0.48, 0.485, 64);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3, 
    });

    this.secondaryRing = new THREE.Mesh(geometry, material);
    this.ringGroup.add(this.secondaryRing); 
  }

  createParticles() {
    const geometry = new THREE.BufferGeometry();
    const count = 150;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = 0.5 + Math.random() * 1.5; 
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = r * Math.cos(theta);     
      positions[i * 3 + 1] = r * Math.sin(theta); 
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1; 
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.015, // Base size, will be dynamically updated in resize()
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

 createBackground() {
    const geometry = new THREE.PlaneGeometry(2, 2);

    this.backgroundMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uColor: { value: new THREE.Color("#25af81") },
        uRadius: { value: 0.0 },
        uProgress: { value: 0 },
        uTime: { value: 0 }, 
        // uResolution is completely removed, we don't need it!
      },
      vertexShader: `
        varying vec2 vWorldPos;
        
        void main() {
          // Put the background mask in the exact same 3D coordinate space as the rings
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPosition.xy;
          
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uRadius;
        uniform float uTime;
        
        varying vec2 vWorldPos;

        void main() {
            // Because we use world position, 'dist' matches Three.js world units exactly!
            float dist = length(vWorldPos);

            // Add pulse, but multiply by clamp so it only pulses when the hole is open
            float pulse = sin(uTime * 2.0) * 0.05 * clamp(uRadius * 100.0, 0.0, 1.0);
            
            float alpha = 1.0 - step(dist, uRadius + pulse);
            vec3 finalColor = uColor - (dist * 0.1);

            gl_FragColor = vec4(finalColor, alpha);
        }
      `,
    });

    this.background = new THREE.Mesh(geometry, this.backgroundMaterial);
    this.background.position.z = -1;

    this.scene.add(this.background);
  }

  // --- RESPONSIVE OPTIMIZATION HEAVY LIFTING ---
 resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    const frustumSize = aspect < 1 ? 2 / aspect : 2; 

    this.camera.left = (-frustumSize * aspect) / 2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;

    this.camera.updateProjectionMatrix();

    // Dynamically stretch the background mesh to fill the camera view
    if (this.background) {
      this.background.scale.set(this.camera.right, this.camera.top, 1);
    }

    if (this.particles) {
      const pMaterial = this.particles.material as THREE.PointsMaterial;
      const isMobile = width < 768;
      pMaterial.size = isMobile ? 0.8 : 0.15;
    }

    this.renderer.setSize(width, height);
  };

  setProgress(progress: number) {
    this.targetProgress = progress;
  }

  updateRing() {
    this.ring.geometry.dispose();

    this.ring.geometry = new THREE.RingGeometry(
      0.35,
      0.45,
      128,
      1,
      0,
      Math.max(0.001, Math.PI * 2 * this.progress),
    );
  }

  tick = () => {
    requestAnimationFrame(this.tick);

    const elapsedTime = this.clock.getElapsedTime();

    if (this.secondaryRing) {
      this.secondaryRing.rotation.z = elapsedTime * 0.8; 
    }
    if (this.particles) {
      this.particles.rotation.z = elapsedTime * -0.1; 
    }

    this.progress += (this.targetProgress - this.progress) * 0.08;

    this.updateRing();

    this.percentElement.innerHTML = `${Math.round(this.progress * 100)}%`;
    this.backgroundMaterial.uniforms.uProgress.value = this.progress;
    this.backgroundMaterial.uniforms.uTime.value = elapsedTime; 

    this.renderer.render(this.scene, this.camera);
  };

  complete() {
    return new Promise<void>((resolve) => {
      const clickText = document.querySelector(".ts-loader-click") as HTMLElement;
      clickText.innerHTML = "click to start";

      gsap.to(clickText, { opacity: 1, duration: 0.5 });
      gsap.to(clickText, { y: -5, yoyo: true, repeat: -1, duration: 1, ease: "sine.inOut" });

      const startReveal = () => {
        window.removeEventListener("pointerdown", startReveal);
        gsap.killTweensOf(clickText); 
        gsap.to(this.percentElement, { opacity: 0, duration: 0.2 });

        const maxScale = 8.5;
        const innerRingRadius = 0.35; // Matches your RingGeometry inner radius

        gsap.timeline({
            onComplete: () => {
              this.canvas.remove();
              this.percentElement.remove();
              clickText.remove();
              resolve();
            },
          })
          .to(clickText, { opacity: 0, duration: 0.2 })
          
          .to(this.ringGroup.scale, { x: 0.01, y: 0.01, duration: 0.85, ease: "power2.out" })
          .to(this.particles.scale, { x: 0.01, y: 0.01, duration: 0.85, ease: "power2.out" }, "<")

          .to(this.ringGroup.scale, { x: maxScale, y: maxScale, duration: 3, ease: "power2.inOut" })
          .to(this.particles.scale, { x: 12, y: 12, duration: 3, ease: "power2.inOut" }, "<") 
          
          .to(
            this.backgroundMaterial.uniforms.uRadius,
            {
              // The hole will now EXACTLY match the inner edge of the ring on all devices!
              value: maxScale * innerRingRadius, 
              duration: 3,
              ease: "power2.inOut",
            },
            "<", 
          )
          .to(this.canvas, { opacity: 0, duration: 0.5 }, "-=0.8");
      };

      window.addEventListener("pointerdown", startReveal);
    });
  }
}