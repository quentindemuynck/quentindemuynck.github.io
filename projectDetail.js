
class ProjectDetail extends HTMLElement {
  static get observedAttributes() {
    return ['title','description','thumbnail','github','itch'];
  }
  constructor() {
    super();
    const tpl = document
      .getElementById('project-detail-template')
      .content.cloneNode(true);
    this.appendChild(tpl);
  }
  attributeChangedCallback(name, _, value) {
    const root = this;
    if (name === 'thumbnail')
      root.querySelector('img').src = value;
    if (name === 'title')
      root.querySelector('h1').textContent = value;
    if (name === 'description')
      root.querySelector('p').textContent = value;
    
     if (name === 'github') {
    const a = root.querySelector('#github-link');
    a.href = value;
    a.classList.toggle('hidden', !value);
  }

  if (name === 'itch') {
    const a = root.querySelector('#itch-link');
    a.href = value;
    a.classList.toggle('hidden', !value);
  }
  }
}

customElements.define('project-detail', ProjectDetail);
