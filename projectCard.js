class ProjectCard extends HTMLElement {
  static get observedAttributes() { return ['title','description','thumbnail','url']; }
  constructor() {
    super();
    const tpl = document.getElementById('project-card-template').content.cloneNode(true);
    this.appendChild(tpl);
  }
  attributeChangedCallback(name, _, value) {
    const root = this;
    if (name === 'thumbnail')   root.querySelector('.card-thumb').src        = value;
    if (name === 'title')       root.querySelector('.card-title').textContent = value;
    if (name === 'description') root.querySelector('.card-desc').textContent  = value;
    if (name === 'url')         root.querySelector('.card-link').href         = value;
  }
}
customElements.define('project-card', ProjectCard);
