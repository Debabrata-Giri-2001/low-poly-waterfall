import { World } from "../World";

export class HtmlContent {
  world: World;
  container: HTMLElement;

  constructor() {
    this.world = World.getInstance();

    // Select the container
    this.container = document.querySelector(".ui-layer")!;

    // Run the injection
    this.injectContent();
  }

  injectContent() {
    this.container.innerHTML = `
      <header class="ui-top">
        <h1 class="project-title">Low Poly Waterfall</h1>
        <p class="project-author">by Debabrata GIRI</p>
      </header>

      <footer class="ui-bottom">
        <div class="social-links ">
            <a class="tk-tenon" href="https://deev-g.vercel.app/" target="_blank">DEEV-G</a>
            <a class="tk-tenon" href="https://github.com/Debabrata-Giri-2001/low-poly-waterfall" target="_blank">Source Code</a>
            <a class="tk-tenon" href="https://www.linkedin.com/in/debabrata-giri-587b6b233/" target="_blank">LinkedIn</a>
            <a class="tk-tenon" href="https://x.com/debabrata__giri" target="_blank">X</a>
        </div>
      </footer>
    `;
  }
}
