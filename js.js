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

customElements.define('zemke-tag-box', TagBox);

customElements.define('zemke-tag-box-suggs', class Suggestions extends HTMLElement {
  constructor() {
    super();
  }
});

customElements.define('zemke-tag-box-sugg', class Suggestion extends HTMLElement {
  constructor() {
    super();
  }
});

