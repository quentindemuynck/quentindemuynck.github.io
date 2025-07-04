
class ProjectDetail extends HTMLElement {
  static get observedAttributes() {
    return ['title','description','thumbnail','github','itch', 'markdown', 'video'];
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

    if (name === 'video') {
  const iframe = root.querySelector('#video-iframe');
  if (value) {
    // extract ID from various URL formats
    let id;
    if (value.includes('youtu.be/')) {
      id = value.split('youtu.be/')[1].split(/[?&]/)[0];
    } else if (value.includes('watch?v=')) {
      id = value.split('watch?v=')[1].split('&')[0];
    } else {
      id = value;
    }
    iframe.src = `https://www.youtube.com/embed/${id}`;
    iframe.classList.remove('hidden');
  } else {
    iframe.classList.add('hidden');
  }
}

    
    if (name === 'markdown') {
      const mdContainer = root.querySelector('#markdown-content');
      if (value) {
        fetch(value)
          .then(res => res.text())
          .then(md => {

            marked.setOptions({
              langPrefix: 'language-',
              highlight: (code, lang) => {
                if (lang && hljs.getLanguage(lang)) {
                  return hljs.highlight(code, { language: lang }).value;
                }
                return hljs.highlightAuto(code).value;
              }
            });


            mdContainer.innerHTML = marked.parse(md);

            hljs.highlightAll();

          })
          .catch(err => console.error('Could not load markdown:', err));
      }
    }

  }
}

customElements.define('project-detail', ProjectDetail);
