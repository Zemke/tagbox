# Tagbox

Zero dependency Web Component single-line input field (no contenteditable) with ability to enter tags. 

TODO JSFiddle or something would be nice.
[DEMO](https://store.zemke.io/tagbox.html)

## Usage

```html
<zemke-tagbox>
  <input type="text" name="message">
  <select multiple name="tags">
    <option value="1">James</option>
    <option value="2">Robert</option>
    <option value="3">John</option>
    <option value="4">Michael</option>
    <option value="5">David</option>
    <option value="6">William</option>
  </select>
</zemke-tagbox>
```

### Options

**search** - start (default), infix, levenshtein \
How to filter the suggestions.
Match from start, anywhere (infix) or fuzzy matching using Levenshtein algorithm.
When using Levenshtein you can provide the match boundary followed by a comma.
I.e. `search="levenshtein,60"` filter by string similarity at least 60% (default is 80%).

**ci** \
Add this value to make the search case-insensitive.

**nothing** \
The message to show when no match has been found. Default is "Nothing found."

**length** \
The number of suggestions to show. Default is 4.

Here's an example of all attributes in use:

```html
<zemke-tagbox length="6"
              ci
              nothing="No such entry."
              search="infix">
...
```

### Styling

There are three parts of this Web Component that can be styled using CSS:

* tag
* input
* dropdown-container
* dropdown-item

Use CSS's
[`::part`](https://developer.mozilla.org/en-US/docs/Web/CSS/::part)
pseudo-element i.e. `zemke-tagbox::part(tag)`.

The demo includes a individually styled version of the Web Component.

## Caveats

### attributes

The input field that the user types in is in a Shadow DOM.
Therefore you can't add attributes it like you're used to.
At the end of the day `zemke-tagbox` is not an input field.
You could do so if you're willing to do it with JavaScript like this:

```js
document.querySelector('zemke-tagbox')
  .chatInputEl.setAttribute('placeholder', "Enter your message here")
```

### Styling

If you have CSS rules for input fields they won't apply to this element.
You'll have to hand-write CSS to copy your rules over to `zemke-tagbox` element.

If you're using Bootstrap with SCSS this could be as easy as:

```css
zemke-tagbox::part(input) {
  @extend .form-control;
}       
```

Bonus tip if you're using it within a Bootstrap `.input-group` I found this to work:

```css
.input-group zemke-tagbox::part(input) {
  height: inherit;
  box-sizing: border-box;
}

.input-group zemke-tagbox {
  flex: 1 1 0%;
  box-sizing: border-box;
  position: relative;
}
```

### Box Model change

If
`marginLeft`, `borderLeftWidth`, `borderRightWidth`, `paddingLeft`, `paddingRight` or `width`
change without the input element itself changing its dimensions, the tags might be off.

