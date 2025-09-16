# MediaLoader - Lazy-Loading Image Component

A lightweight, cross-browser compatible custom element for lazy-loading images with smooth animations and loading states.

## Features

- Lazy loads images as they enter the viewport
- Smooth loading animations with CSS transitions
- Error state handling
- Safari compatibility with fallback implementation
- Responsive image support with `srcset`
- Methods for dynamically updating and reloading images
- Small footprint and zero dependencies

## Installation

1. Download the two required files:
   - `media-loader.js` - The component implementation
   - `styles.css` - The styling for animations and layout

2. Include them in your HTML:

```html
<link rel="stylesheet" href="styles.css">
<script src="media-loader.js"></script>
```

## Basic Usage

Simply add the `is="media-loader"` attribute to your image tags, and use `data-src` instead of `src` for the actual image URL:

```html
<img is="media-loader"
     src="placeholder.svg"
     data-src="actual-image.jpg"
     alt="My lazy loaded image">
```

## Setting Up Animations

The component automatically adds CSS classes to images during different loading states:

1. `.loading` - Applied while the image is loading
2. `.loaded` - Applied when the image has successfully loaded
3. `.error` - Applied if the image fails to load

### Animation Example

You can customize the animations by modifying these CSS classes in your stylesheet:

```css
/* Base transition for all states */
img[is="media-loader"] {
  transition: all 0.3s ease;
}

/* Loading state animation */
img[is="media-loader"].loading {
  opacity: 0.7;
  filter: blur(2px);
  transform: scale(1.02);
}

/* Loaded state animation */
img[is="media-loader"].loaded {
  opacity: 1;
  filter: none;
  transform: scale(1);
}

/* Error state styling */
img[is="media-loader"].error {
  opacity: 0.5;
  filter: grayscale(100%);
}
```

### Animation Customization

You can create more elaborate animations by modifying these classes. Some examples:

#### Fade-in Animation

```css
img[is="media-loader"] {
  transition: opacity 0.5s ease;
}

img[is="media-loader"].loading {
  opacity: 0;
}

img[is="media-loader"].loaded {
  opacity: 1;
}
```

#### Zoom-out Animation

```css
img[is="media-loader"] {
  transition: all 0.5s ease-out;
}

img[is="media-loader"].loading {
  opacity: 0.7;
  transform: scale(1.1);
}

img[is="media-loader"].loaded {
  opacity: 1;
  transform: scale(1);
}
```

#### Slide-in Animation

```css
img[is="media-loader"] {
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

img[is="media-loader"].loading {
  opacity: 0;
  transform: translateY(20px);
}

img[is="media-loader"].loaded {
  opacity: 1;
  transform: translateY(0);
}
```

## Dynamic Image Management

The component provides methods for dynamically managing images:

### Change Image Source

```javascript
// Get the image element
const img = document.querySelector('img[is="media-loader"]');

// Update the source
img.updateSrc('new-image-url.jpg');
```

### Reload Image

```javascript
// Get the image element
const img = document.querySelector('img[is="media-loader"]');

// Reload the image
img.reload();
```

## Browser Compatibility

MediaLoader works in all modern browsers. For Safari, which doesn't support extending built-in elements, a fallback implementation is automatically applied.

## Performance Tips

- Use appropriately sized placeholder images (SVGs are recommended)
- Specify image dimensions to prevent layout shifts
- Use WebP format when possible for better performance
- Combine with `srcset` and `sizes` attributes for responsive images

## License

MIT License