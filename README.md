# Tagbox

Zero dependency Web Component single-line input field (no contenteditable) with ability to enter tags. 

TODO image or even gif

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

### `styling`

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
.input-group {
  zemke-tagbox::part(input) {
    height: inherit;
    box-sizing: border-box;
  }

  zemke-tagbox {
    flex: 1 1 0%;
    box-sizing: border-box;
    position: relative;
  }
}
```

### Spacings change

If
`marginLeft`, `borderLeftWidth`, `borderRightWidth`, `paddingLeft`, `paddingRight` or `width`
change without the input element itself changing its dimensions, the tags might be off.

