class TagBox extends HTMLElement {
  constructor() {
    super();
    console.log(this);
    const shadow = this.attachShadow({ mode: 'closed' });
    const span = document.createElement('span');
    span.textContent = 'hello world';
    shadow.appendChild(span);
  }
}

customElements.define('tag-box', TagBox);

