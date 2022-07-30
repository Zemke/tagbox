# Tagbox

Zero dependency Web Component single-line input field (no contenteditable) with ability to enter tags. 

TODO image or even gif

## Caveats

### attributes

The input field that the user types in is in a Shadow DOM.
Therefore you can't add attributes it like you're used to.
You could do so if you're willing to do it with JavaScript.
At the end of the day `zemke-tagbox` is not an input field.

#### `disabled`

If you want to disable the input element, I suggest to toggle show and hide with another disabled placeholder input field.
To be extra sure you might also want to disable the backing `input` and `select` fields.
That you can do as you're used to, though.
Here's an example with Angular:

TODO example from CWT with Angular

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

