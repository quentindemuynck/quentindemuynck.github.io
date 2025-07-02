
class ProjectsSection extends HTMLElement {
  static get observedAttributes() { return ['title']; }

  constructor() {
    super();


    const tpl = document
      .getElementById('projects-section-template')
      .content.cloneNode(true);
      
    const wrapper = tpl.querySelector('div');
    const grid    = wrapper.querySelector('.grid');

    Array.from(this.children)
      .filter(n => n.tagName === 'PROJECT-CARD')
      .forEach(card => grid.appendChild(card));
    this.appendChild(wrapper);
  }

  attributeChangedCallback(name, _, value) {
    if (name === 'title') {
      this.querySelector('.section-title').textContent = value;
    }
  }
}

customElements.define('projects-section', ProjectsSection);
