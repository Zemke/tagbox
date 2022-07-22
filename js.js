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
    disabled = false;
    suggestionsSlice = 4;

    authUser = null;
    allSuggestions = null;
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
          display: inline;
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
          top: .2rem;
          bottom: .2rem;
          z-index: 99;
          border-top-left-radius: 1rem;
          border-bottom-left-radius: 1rem;
          border-top-right-radius: .5rem;
          border-bottom-right-radius: .5rem;
        }
        #dropdown {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 1000;
          display: none;
          float: left;
          min-width: 10rem;
          padding: .5rem 0;
          margin: .125rem 0 0;
          font-size: 1rem;
          color: #212529;
          text-align: left;
          list-style: none;
          background-color: #fff;
          background-clip: padding-box;
          border: 1px solid rgba(0,0,0,.15);
          border-radius: .25rem;
          min-width: auto;
          background-clip: border-box;
          box-shadow: .4rem .9rem 1.5rem #000;
        }
        #dropdown.show {
          display: block;
        }
        .dropdown-item {
          display: block;
          width: 100%;
          padding: .25rem 1.5rem;
          padding-right: 1.5rem;
          padding-left: 1.5rem;
          clear: both;
          font-weight: 400;
          color: #212529;
          text-align: inherit;
          white-space: nowrap;
          background-color: transparent;
          border: 0;
        }
        .dropdown-item.active {
          color: #fff;
          text-decoration: none;
          background-color: #322a21;
        }
      </style>

      <div class="chat-container">
        <input type="text"
               name="chat-input"
               id="chatInput">
        <div id="offsets" class="offsets">
        </div>
        <div id="dummy" class="dummy">
        </div>
        <div id="dropdown">
        </div>
      </div>
      `

    shadow.getElementById('chatInput').addEventListener('keydown', e => { this.onKeydown(e); });
    shadow.getElementById('chatInput').addEventListener('keyup', e => { this.onKeyup(e); });
    shadow.getElementById('chatInput').addEventListener('input', e => { this.onInput(e); });
  }

  get chatInputEl() {
    return this.wrap('chatInput');
  }

  get offsetsEl() {
    return this.wrap('offsets');
  }

  get dropdownEl() {
    return this.wrap('dropdown');
  }

  get dummyEl() {
    return this.wrap('dummy');
  }

  get suggestions() {
    return Array.from(this.suggsEl.children).map(child => ({
      // TODO rename to label and value
      username: child.textContent,
      id: child.getAttribute('value'),
    }));
  }

  get suggsEl() {
    const elems = this.getElementsByTagName('zemke-tag-box-suggs');
    if (elems > 0) throw new Error('more than one zemke-tag-box-suggs');
    return elems[0];
  }

  set suggestions(suggs) {
    const {nativeElement: dropdownEl} = this.dropdownEl;
    let html = '';
    if (suggs == null) {
      dropdownEl.classList.remove('show');
    } else {
      for (const sugg of suggs) {
        // TODO onclick="complete()"
        html += `
          <button class="dropdown-item"
                  type="button"
                  value="${sugg.id}">
            ${sugg.username}
          </button>
        `;
      }
      dropdownEl.classList.add('show');
    }
    if (html === '') {
      html = '<small>No such user.</small>';
    }
    dropdownEl.innerHTML = html;
  }

  get tags() {
    return Array.from(this.offsetsEl.nativeElement.children).map(child => ({
      style: '',
      user: this.allSuggestions.find(s => s.id === child.dataset.id),
    }));
  }

  set tags(tags) {
    let html = '';
    for (const tag of tags) {
      const style = Object.keys(tag.style).map(k => k + `: ${tag.style[k]}`).join('; ');
      html += `<div class="offset" style="${style}" data-id="${tag.user.id}"></div>`;
    }
    this.offsetsEl.nativeElement.innerHTML = html;
  }

  // TODO get rid of this (Angular relict)
  wrap(id) {
    return { 'nativeElement': this.shadowRoot.getElementById(id) };
  }

  connectedCallback() {
    setTimeout(() => {
      this.allSuggestions = [...this.suggestions];
      this.styleOffsetsEl();
      this.styleDummyEl();

      // TODO remove on destroy
      document.addEventListener('click', this.documentClickListener);

      this.resizeObserver = new ResizeObserver(() => {
        window.requestAnimationFrame(() => {
          this.updateRecipients();
          this.styleOffsetsEl();
          this.styleDummyEl();
          this.styleDropdownEl();
        });
      });
      this.resizeObserver.observe(this.chatInputEl.nativeElement);
      // TODO remove ResizeObserver on destroy

      setInterval(() => {
        const scrollLeft = this.chatInputEl.nativeElement.scrollLeft;
        if (scrollLeft === this.scrollLeft) return;
        window.requestAnimationFrame(() => {
          this.updateRecipients();
          this.scrollLeft = scrollLeft;
        });
      });
    });
  }

  submit() {
      this.disabled = true;
      const message = {
          body: this.chatInputEl.nativeElement.value,
          recipients: this.recipients,
          category: this.recipients?.length ? 'PRIVATE' : 'SHOUTBOX',
      };
      this.message.emit([message, (success) => {
          this.disabled = false;
          if (success) {
              this.recipients = [];
              this.tags = [];
              this.suggestions = null;
              this.chatInputEl.nativeElement.value = '';
          }
          setTimeout(() => this.chatInputEl.nativeElement.focus());
      }]);
  }

  styleOffsetsEl() {
    const {width, height} = this.chatInputEl.nativeElement.getBoundingClientRect();
    const {paddingLeft, paddingRight} = window.getComputedStyle(this.chatInputEl.nativeElement);
    this.paddingLeft = parseFloat(paddingLeft);
    this.offsetsEl.nativeElement.style.width =
      width - this.paddingLeft - parseFloat(paddingRight) + 'px';
    this.offsetsEl.nativeElement.style.marginLeft = paddingLeft;
    this.offsetsEl.nativeElement.style.marginRight = paddingRight;
    this.offsetsEl.nativeElement.style.height = height + 'px';
  }

  styleDummyEl() {
    const {fontSize, fontFamily} = window.getComputedStyle(this.chatInputEl.nativeElement);
    this.dummyEl.nativeElement.style.fontSize = fontSize;
    this.dummyEl.nativeElement.style.fontFamily = fontFamily;
  }

  styleDropdownEl(q = null, v = null) {
    if (this.dropdownEl?.nativeElement == null) return;
    if (q == null || v == null) {
      [q, v] = this.getProc();
    }
    if (q == null || v == null) return;
    this.dropdownEl.nativeElement.style.left = Math.min(
      this.getOffset(v.substring(0, v.length-q.length)) - this.chatInputEl.nativeElement.scrollLeft,
      window.innerWidth - 200) + 'px';
  }

  complete(user, fromClick = false) {
    const inpElem = this.chatInputEl.nativeElement;
    const [q, v, caret] = this.getProc();
    inpElem.value =
      v.substring(0, caret - q.length)
      + user.username
      + inpElem.value.substring(caret);
    this.suggestions = null;
    fromClick && inpElem.focus();
    inpElem.selectionStart = caret - q.length + user.username.length;
    inpElem.selectionEnd = inpElem.selectionStart;
    this.updateRecipients();
  }

  onKeydown(e) {
      const key = e.key === 'Unidentified' ? String.fromCharCode(e.which) : e.key;
      if (this.suggestions?.length && ['ArrowDown', 'ArrowUp', 'Tab', 'Enter'].includes(key)) {
          e.preventDefault();
          const buttons = Array.from(this.suggestionsEl).map(el => el.nativeElement);
          let active;
          for (let i = 0; i < buttons.length; i++) {
              if (buttons[i].classList.contains('active')) {
                  active = i;
                  break;
              }
          }
          if (key === 'Enter') {
              const user = this.suggestions.find(x => x.id == buttons[active].value);
              if (user == null) return;
              this.complete(user);
          } else {
              if (active == null) {
                  buttons[0].classList.add('active');
              } else {
                  const up = key === 'ArrowUp' || (e.shiftKey && key === 'Tab')
                  buttons[active].classList.remove('active');
                  if (up && active == 0) {
                      buttons[buttons.length-1].classList.add('active');
                  } else {
                      buttons[(active + (up ? -1 : +1)) % buttons.length].classList.add('active');
                  }
              }
          }
      }
  }

  onKeyup(e) {
    const key = e.key === 'Unidentified' ? String.fromCharCode(e.which) : e.key;
    if (key.length > 1 && !['ArrowDown', 'ArrowUp', 'Tab', 'Enter', 'Backspace', 'Delete'].includes(key)) {
      this.suggest();
    }
  }

  onInput() {
    this.suggest();
    setTimeout(() => this.updateRecipients());
  }

  updateRecipients() {
    const {value, scrollLeft} = this.chatInputEl.nativeElement;
    const matchAll = Array.from(value.matchAll(/(?:^|[^a-z0-9-_])@([a-z0-9-_]+)/ig));
    const matches = [];
    for (const m of matchAll) {
       const user = this.allSuggestions.find(u => u.username.toLowerCase() === m[1].toLowerCase());
       if (user != null) {
         matches.push({ index: m.index + m[0].indexOf('@'), user });
       }
    }
    this.recipients = matches.map(({user}) => user).filter((v,i,a) => a.indexOf(v) === i);
    this.tags = matches.map(m => ({
      user: m.user,
      style: {
        width: this.getOffset(value.substring(m.index, m.index + m.user.username.length + 1)) + 'px',
        left: (this.getOffset(value.substring(0, m.index)) - scrollLeft) + 'px',
      }
    }));
  }

  getOffset(v) {
    this.dummyEl.nativeElement.textContent = v;
    this.dummyEl.nativeElement.style.paddingLeft = `${this.paddingLeft}px`;
    // scrollLeft is subtracted in the result, it's done here just for visual reasons when debugging
    this.dummyEl.nativeElement.style.marginLeft = `-${this.chatInputEl.nativeElement.scrollLeft}px`;
    const res = this.dummyEl.nativeElement.getBoundingClientRect().width;
    this.dummyEl.nativeElement.innerHTML = '';
    return res;
  }

  suggest() {
    const [q, v,] = this.getProc();
    if (q == null) {
      this.suggestions = null;
      return;
    }
    this.styleDropdownEl(q,v);
    this.suggestions = this.allSuggestions
      .filter(({username}) => username.toLowerCase().startsWith(q.toLowerCase()))
      .slice(0, this.suggestionsSlice);
  }

  /**
   * Get current input typeahead process information.
   *
   * @param {string} Char just typed that's not yet part of the inputs
   *   value at the moment of calling this method.
   * @returns {Array} The current typeahead string and the string
   *   until associated @ sign and the caret index.
   */
  getProc() {
    const {selectionStart, value} = this.chatInputEl.nativeElement;
    const v = value.substring(0, selectionStart);
    if (v.indexOf('@') === -1) return [null, v, selectionStart];
    const rev = v.split("").reverse()
    const qRev = rev.slice(0, rev.indexOf("@"))
    const charBefAt = rev.slice(0, rev.indexOf("@")+2).pop();
    if (charBefAt != null && TagBox.DELIMITER.test(charBefAt)) {
      return [null, v, selectionStart];
    }
    const q = qRev.reverse().join('')
    if (!TagBox.DELIMITER.test(q)) return [null, v, selectionStart]
    return [q, v, selectionStart];
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

