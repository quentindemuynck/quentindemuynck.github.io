

const TAG_META = {
  'C++':      { color: '#f34b7d', icon: './assets/icons/gdscript.png' },
  'GDScript': { color: '#355570', icon: './assets/icons/gdscript.png' },
  'Unity':    { color: '#000000', icon: './assets/icons/gdscript.png' },
  'C#':       { color: '#178600', icon: './assets/icons/gdscript.png' },
  'Python':   { color: '#3572A5', icon: './assets/icons/gdscript.png' },
  'JS':       { color: '#f1e05a', icon: './assets/icons/gdscript.png' },
};



class ProjectCard extends HTMLElement {
  static get observedAttributes() { return ['title','description','thumbnail','url', 'tags']; }
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

    //Adds tags
    if (name === 'tags') {
        const container = this.querySelector('.tag-list');
        container.innerHTML = '';

  value.split(',')
       .map(s => s.trim())
       .filter(Boolean)
       .forEach(tagText => {
         const { color = '#999999', icon = '' } = TAG_META[tagText] || {};
         const span = document.createElement('span');


         if (icon) {
          const img = document.createElement('img');           
          img.src = icon;
           img.alt = tagText + ' icon';
           img.className = 'w-4 h-4 mr-1 flex-shrink-0';
           span.appendChild(img);
         }
        span.appendChild(document.createTextNode(tagText));

         const hex = color.replace('#','');
         const r   = parseInt(hex.slice(0,2), 16);
         const g   = parseInt(hex.slice(2,4), 16);
         const b   = parseInt(hex.slice(4,6), 16);

         span.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
         span.style.backdropFilter   = 'blur(4px)';  

         // pill styling
         span.className = [
           'text-xs', 'font-medium',
           'px-2', 'py-1',
           'rounded-full',
           'flex', 'items-center',
         ].join(' ');

         container.appendChild(span);
       });
}

  }
}
customElements.define('project-card', ProjectCard);
