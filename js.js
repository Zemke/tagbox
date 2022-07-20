class TagBox extends HTMLElement {

    static DELIMITER = /^[a-z0-9-_]*$/i;

    /*
    message = new EventEmitter();
    messages = null;
    */

    /*
    chatInputEl = null;
    dummyEl = null;
    offsetsEl = null;
    dropdownEl = null;
    suggestionsEl = null;
    */

    // suggestions = null; has getter
    recipients = [];
    tags = [];
    disabled = false;
    suggestionsSlice = 4;

    authUser = null;
    allSuggestions = null;
    lazyLoadedSuggestions = false;
    lazyLoadingSuggestions = false;
    lazySuggestionsResolver = null;
    lazySuggestionsPromise = null;
    paddingLeft = null;
    resizeObserver = null;
    scrollLeft = 0;
    documentClickListener = e => {
        e.target === this.chatInputEl.nativeElement
            ? this.suggest()
            : (this.suggestions = null);
    }

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
<style>
  .dummy {
    position: absolute;
    visibility: hidden;
    pointer-events: none;
    white-space: pre;
  }
  .chat-container {
    position: relative;
  }
  .suggestions {
    min-width: auto;
    background-clip: border-box;
    box-shadow: .4rem .9rem 1.5rem #000;
  }
  .suggestions img {
    height: 1rem;
  }
  .offsets {
    position: absolute;
    pointer-events: none;
    overflow: hidden;
    top: 0;
  }
  .offset {
    background-color: rgba(99, 1, 45, 0.35);
    pointer-events: none;
    position: absolute;
    top: .5rem;
    bottom: .5rem;
    z-index: 99;
    border-top-left-radius: 1rem;
    border-bottom-left-radius: 1rem;
    border-top-right-radius: .5rem;
    border-bottom-right-radius: .5rem;
  }
</style>

<div class="chat-container">
  <input type="text"
         name="chat-input"
         id="chatInput">
  <div id="offsets" class="offsets">
    <div #recipients
         class="offset"
         [ngStyle]="tag.style"
         [attr.data-id]="tag.user.id"
         [attr.data-username]="tag.user.username">
    </div>
  </div>
  <div #dummy class="dummy d-inline"></div>
  <div class="dropdown-menu suggestions p-0 overflow-hidden"
       #dropdown [class.show]="suggestions">
    <small class="form-text text-muted mx-2"
           *ngIf="!suggestions?.length && !lazyLoadingSuggestions">No such user.</small>
    <button *ngFor="let sugg of suggestions; let first = first;"
            #suggestions
            class="dropdown-item px-2" [class.active]="first"
            type="button" [value]="sugg.id" (click)="complete(sugg, true)">
      {{ sugg.username }}
    </button>
    <img *ngIf="lazyLoadingSuggestions && suggestions?.length < suggestionsSlice"
         class="mx-2"
         src="../../img/loading.gif"/>
  </div>
</div>
`

    shadow.getElementById('chatInput').addEventListener('keydown', e => {
      console.log(e.type);
      this.onKeydown(e);
    });

    shadow.getElementById('chatInput').addEventListener('keyup', e => {
      console.log(e.type);
      this.onKeyup(e);
    });

    shadow.getElementById('chatInput').addEventListener('input', e => {
      console.log(e.type);
      this.onInput(e);
    });
  }

  get chatInputElem() {
    return this.wrap('chatInput');
  }

  get offsetsElem() {
    return this.wrap('offsets');
  }

  get suggestions() {
    const elems = this.getElementsByTagName('zemke-tag-box-suggs');
    if (elems > 0) throw new Error('more than one zemke-tag-box-suggs');
    return Array.from(elems[0].children).map(child => ({
      label: child.textContent,
      value: child.getAttribute('value'),
    }));
  }

  wrap(id) {
    return { 'nativeElement': this.shadowRoot.getElementById(id) };
  }

  connectedCallback() {
    setTimeout(() => {
      console.log(this.suggestions);
    });
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

