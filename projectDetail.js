import { TAG_META } from './tagMeta.js';

class ProjectDetail extends HTMLElement {
  static get observedAttributes() {
    return ['title','description','thumbnail','github','itch','markdown','video','tags','year'];
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
      const container = root.querySelector('#video-container');
      if (value) {
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
        container.classList.remove('hidden');
      } else {
        iframe.classList.add('hidden');
        container.classList.add('hidden');
      }
    }

    if (name === 'tags') {
      const container = root.querySelector('.tag-list-detail');
      container.innerHTML = '';
      value
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
        .forEach(tagText => {
          const { color = '#999', icon = '' } = TAG_META[tagText] || {};
          const span = document.createElement('span');

          if (icon) {
            const img = document.createElement('img');
            img.src = icon;
            img.alt = tagText;
            img.className = 'w-4 h-4 inline-block mr-1 align-text-bottom';
            span.appendChild(img);
          }

          span.appendChild(document.createTextNode(tagText));
          span.style.backgroundColor = color + '33'; // 20% opacity
          span.className = 'text-xs font-medium px-2 py-1 rounded-full';
          container.appendChild(span);
        });
    }

    if (name === 'year') {
      root.querySelector('.project-year').textContent = value;
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
