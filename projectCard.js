

const TAG_META = {
  'C++':      { color: '#659AD2', icon: './icons/cpp.png' },
  'GDScript': { color: '#6f97b8'},
  'Godot':    { color: '#6f97b8', icon: './icons/godot.png' },
  'Unity':    { color: '#131313', icon: './icons/unity.png' },
  'C#':       { color: '#5E438F', icon: './icons/csharp.png' },
  'Python':   { color: '#1d692d', icon: './icons/python.png' },
  'JS':       { color: '#f1e05a'},
  'AI':       { color: '#373f50'},
  'Custom Interface': { color: '#373f50'},
  'Provided Interface': { color: '#373f50'},
  'Custom Engine': { color: '#373f50'},
  'Provided Engine': { color: '#373f50'},
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
