class TagBox extends HTMLElement {

  static DELIMITER = /^[a-z0-9-_]*$/i;
  static DEFAULT_SLICE = 4;

  scrollLeft = 0;
  documentClickListener = e => {
    e.target === this.chatInputEl || e.target === this
      ? this.suggest()
      : (this.suggestions = null);
  };

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
          margin: .125rem 0 0;
          font-size: 1rem;
          color: #212529;
          text-align: left;
          list-style: none;
          background-color: #fff;
          background-clip: padding-box;
          overflow: hidden;
          border-radius: .25rem;
          min-width: auto;
          background-clip: border-box;
          box-shadow: 0rem 0.3rem 0.8rem rgba(0, 0, 0, .5);
        }
        #dropdown small {
          padding: .25rem .4rem;
        }
        #dropdown.show {
          display: block;
        }
        #dropdown button {
          display: block;
          width: 100%;
          padding: .25rem .4rem;
          clear: both;
          font-weight: 400;
          color: #212529;
          text-align: inherit;
          white-space: nowrap;
          background-color: transparent;
          border: 0;
        }
        #dropdown:not(:hover) button.active,
        #dropdown button:hover {
          text-decoration: none;
          background-color: #ccc;
          cursor: pointer;
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
    `;

    shadow.getElementById('chatInput').addEventListener('keydown', e => { this.onKeydown(e); });
    shadow.getElementById('chatInput').addEventListener('keyup', e => { this.onKeyup(e); });
    shadow.getElementById('chatInput').addEventListener('input', e => { this.onInput(e); });
  }

  get chatInputEl() {
    return this.getEl('chatInput');
  }

  get offsetsEl() {
    return this.getEl('offsets');
  }

  get dropdownEl() {
    return this.getEl('dropdown');
  }

  get dummyEl() {
    return this.getEl('dummy');
  }

  get suggsEl() {
    const elems = this.getElementsByTagName('select');
    if (elems.length !== 1) {
      throw new Error('One and only one HTMLSelectElement in zemke-tag-box required');
    }
    return elems[0];
  }

  get valueEl() {
    const elems = this.getElementsByTagName('input');
    if (elems.length !== 1) {
      throw new Error('One and only one HTMLInputElement in zemke-tag-box required');
    }
    return elems[0];
  }

  get suggestions() {
    return Array.from(this.suggsEl.children).map(child => ({
      label: child.textContent,
      value: child.getAttribute('value'),
    }));
  }

  set suggestions(suggs) {
    this.dropdownEl.innerHTML = '';
    if (suggs == null) {
      this.dropdownEl.classList.remove('show');
    } else {
      for (const sugg of suggs) {
        const child = document.createElement('button');
        child.setAttribute('type', 'button');
        child.setAttribute('value', sugg.value);
        child.textContent = sugg.label;
        child.addEventListener('click', e => {
          this.complete(sugg, true);
        });
        this.dropdownEl.appendChild(child);
      }
      this.dropdownEl.classList.add('show');
      if (!this.dropdownEl.children.length) {
        this.dropdownEl.innerHTML =
          `<small>${this.getAttribute('nothing') || 'Nothing found.'}</small>`;
      } else {
        this.dropdownEl.children[0].classList.add('active');
      }
    }
  }

  get tags() {
    return Array.from(this.offsetsEl.children).map(child => ({
      style: '',
      user: this.allSuggestions.find(s => s.value === child.dataset.value),
    }));
  }

  set tags(tags) {
    let html = '';
    for (const tag of tags) {
      const style = Object.keys(tag.style).map(k => k + `: ${tag.style[k]}`).join('; ');
      html += `<div class="offset" style="${style}" data-value="${tag.user.value}"></div>`;
    }
    this.offsetsEl.innerHTML = html;
    for (const opt of this.suggsEl.options) {
      opt.selected = this.tags.map(t => String(t.user.value)).indexOf(String(opt.value)) !== -1;
    }
  }

  getEl(id) {
    return this.shadowRoot.getElementById(id);
  }

  connectedCallback() {
    setTimeout(() => {
      this.suggestionsSlice = parseInt(this.getAttribute('length')) || TagBox.DEFAULT_SLICE;
      this.allSuggestions = [...this.suggestions];
      this.styleOffsetsEl();
      this.styleDummyEl();

      document.addEventListener('click', this.documentClickListener);

      this.resizeObserver = new ResizeObserver(() => {
        window.requestAnimationFrame(() => {
          this.updateRecipients();
          this.styleOffsetsEl();
          this.styleDummyEl();
          this.styleDropdownEl();
        });
      });
      this.resizeObserver.observe(this.chatInputEl);

      setInterval(() => {
        const scrollLeft = this.chatInputEl.scrollLeft;
        if (scrollLeft === this.scrollLeft) return;
        window.requestAnimationFrame(() => {
          this.updateRecipients();
          this.scrollLeft = scrollLeft;
        });
      });

      this.valueEl.addEventListener('input', e => {
        this.chatInputEl.value = e.target.value;
        this.onInput();
      })
    });
  }

  disconnectedCallback() {
    this.resizeObserver.disconnect();
    document.removeEventListener('click', this.documentClickListener);
  }

  styleOffsetsEl() {
    const {width, height} = this.chatInputEl.getBoundingClientRect();
    const {paddingLeft, paddingRight} = window.getComputedStyle(this.chatInputEl);
    this.paddingLeft = parseFloat(paddingLeft);
    this.offsetsEl.style.width =
      width - this.paddingLeft - parseFloat(paddingRight) + 'px';
    this.offsetsEl.style.marginLeft = paddingLeft;
    this.offsetsEl.style.marginRight = paddingRight;
    this.offsetsEl.style.height = height + 'px';
  }

  styleDummyEl() {
    const {fontSize, fontFamily} = window.getComputedStyle(this.chatInputEl);
    this.dummyEl.style.fontSize = fontSize;
    this.dummyEl.style.fontFamily = fontFamily;
  }

  styleDropdownEl(q = null, v = null) {
    if (this.dropdownEl == null) return;
    if (q == null || v == null) {
      [q, v] = this.getProc();
    }
    if (q == null || v == null) return;
    this.dropdownEl.style.left = Math.min(
      this.getOffset(v.substring(0, v.length-q.length)) - this.chatInputEl.scrollLeft,
      window.innerWidth - 200) + 'px';
  }

  complete(user, fromClick = false) {
    const inpElem = this.chatInputEl;
    const [q, v, caret] = this.getProc();
    inpElem.value =
      v.substring(0, caret - q.length)
      + user.label
      + inpElem.value.substring(caret);
    this.suggestions = null;
    fromClick && inpElem.focus();
    inpElem.selectionStart = caret - q.length + user.label.length;
    inpElem.selectionEnd = inpElem.selectionStart;
    this.updateRecipients();
  }

  onKeydown(e) {
    const key = e.key === 'Unidentified' ? String.fromCharCode(e.which) : e.key;
    if (this.suggestions?.length && ['ArrowDown', 'ArrowUp', 'Tab', 'Enter'].includes(key)) {
      e.preventDefault();
      const buttons = Array.from(this.dropdownEl.querySelectorAll('button'));
      let active;
      for (let i = 0; i < buttons.length; i++) {
        if (buttons[i].classList.contains('active')) {
          active = i;
          break;
        }
      }
      if (key === 'Enter') {
        const user = this.suggestions.find(x => x.value == buttons[active]?.value);
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
    this.valueEl.value = this.chatInputEl.value;
    this.suggest();
    setTimeout(() => this.updateRecipients());
  }

  updateRecipients() {
    const {value, scrollLeft} = this.chatInputEl;
    const matchAll = Array.from(value.matchAll(/(?:^|[^a-z0-9-_])@([a-z0-9-_]+)/ig));
    const matches = [];
    for (const m of matchAll) {
      const user = this.allSuggestions.find(u => u.label.toLowerCase() === m[1].toLowerCase());
      if (user != null) {
        matches.push({ index: m.index + m[0].indexOf('@'), user });
      }
    }
    this.tags = matches.map(m => ({
      user: m.user,
      style: {
        width: this.getOffset(value.substring(m.index, m.index + m.user.label.length + 1)) + 'px',
        left: (this.getOffset(value.substring(0, m.index)) - scrollLeft) + 'px',
      }
    }));
  }

  getOffset(v) {
    this.dummyEl.textContent = v;
    this.dummyEl.style.paddingLeft = `${this.paddingLeft}px`;
    // scrollLeft is subtracted in the result, it's done here just for visual reasons when debugging
    this.dummyEl.style.marginLeft = `-${this.chatInputEl.scrollLeft}px`;
    const res = this.dummyEl.getBoundingClientRect().width;
    this.dummyEl.innerHTML = '';
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
      .filter(({label}) => label.toLowerCase().startsWith(q.toLowerCase()))
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
    const {selectionStart, value} = this.chatInputEl;
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

