class MediaLoader extends HTMLImageElement {
  constructor() {
    super();
    this._mutObserver = null;

    // Attempt to initialize immediately in constructor if possible
    if (this.isConnected) {
      this._initializeElement();
    }
  }

  connectedCallback() {
    this._initializeElement();
  }

  _initializeElement() {
    if (!MediaLoader._observer) {
      MediaLoader._observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target;
            el._activate();
            MediaLoader._observer.unobserve(el);
          }
        }
      }, {
        rootMargin: "150px",
        threshold: 0.01
      });
    }

    MediaLoader._observer.observe(this);

    this._mutObserver = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "src" || mutation.attributeName === "srcset") {
          this._markLoading();
        }
      }
    });
    this._mutObserver.observe(this, {
      attributes: true,
      attributeFilter: ["src", "srcset"]
    });

    // Check if image is already in viewport and load immediately if needed
    if (this.isInViewport()) {
      this._activate();
      MediaLoader._observer.unobserve(this);
    }
  }

  disconnectedCallback() {
    if (MediaLoader._observer) {
      MediaLoader._observer.unobserve(this);
    }
    if (this._mutObserver) {
      this._mutObserver.disconnect();
      this._mutObserver = null;
    }
  }

  isInViewport() {
    // Simple viewport check that works even before layout is complete
    try {
      const rect = this.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const windowWidth = window.innerWidth || document.documentElement.clientWidth;

      // Extended margin (same as IntersectionObserver rootMargin)
      const margin = 150;

      // Element is considered in viewport if any part of it is within viewport + margin
      return (
        rect.bottom + margin > 0 &&
        rect.right + margin > 0 &&
        rect.top - margin < windowHeight &&
        rect.left - margin < windowWidth
      );
    } catch (error) {
      // If we can't determine position, assume not in viewport
      return false;
    }
  }

  _activate() {
    // Check if already activated by early parser
    const isEarlyLoaded = this.src === this.dataset.src;

    if (this.dataset.src && !isEarlyLoaded) this.src = this.dataset.src;
    if (this.dataset.srcset && !isEarlyLoaded) this.srcset = this.dataset.srcset;

    this._markLoading();
  }

  _markLoading() {
    const finalize = () => {
      this.classList.add("loaded");
      this.classList.remove("loading");
    };

    const handleError = () => {
      this.classList.remove("loading");
      this.classList.add("error");
    };

    if (this.complete && this.naturalWidth > 0) {
      finalize();
    } else {
      this.classList.add("loading");

      const handleLoad = () => {
        this.removeEventListener("load", handleLoad);
        this.removeEventListener("error", handleErrorEvent);

        if (window.requestIdleCallback) {
          requestIdleCallback(finalize);
        } else if (window.requestAnimationFrame) {
          requestAnimationFrame(finalize);
        } else {
          setTimeout(finalize, 16);
        }
      };

      const handleErrorEvent = () => {
        this.removeEventListener("load", handleLoad);
        this.removeEventListener("error", handleErrorEvent);
        handleError();
      };

      this.addEventListener("load", handleLoad);
      this.addEventListener("error", handleErrorEvent);
    }
  }

  reload() {
    if (this.dataset.originalSrc) {
      this.dataset.src = this.dataset.originalSrc;
      this.classList.remove("loaded", "error");
      this._activate();
    }
  }

  updateSrc(newSrc) {
    this.dataset.originalSrc = this.dataset.src || this.src;
    this.dataset.src = newSrc;
    this.classList.remove("loaded", "error");
    this._activate();
  }
}

MediaLoader._observer = null;

// Expose a global function to manually initialize all media-loader elements
window.initAllMediaLoaders = function (container = document) {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const images = container.querySelectorAll('img[is="media-loader"]');

  images.forEach(function (img) {
    if (isSafari) {
      img._mutObserver = null;
      img._activate = MediaLoader.prototype._activate.bind(img);
      img._markLoading = MediaLoader.prototype._markLoading.bind(img);
      img.isInViewport = MediaLoader.prototype.isInViewport.bind(img);
      img.connectedCallback = MediaLoader.prototype.connectedCallback.bind(img);
      img._initializeElement = MediaLoader.prototype._initializeElement.bind(img);
      img.disconnectedCallback = MediaLoader.prototype.disconnectedCallback.bind(img);
      img.reload = MediaLoader.prototype.reload.bind(img);
      img.updateSrc = MediaLoader.prototype.updateSrc.bind(img);

      try {
        img._initializeElement();
      } catch (error) {
        console.error('Safari initialization failed:', error);

        // Fallback direct loading for Safari if all else fails
        if (img.dataset.src && img.isInViewport()) {
          img.src = img.dataset.src;
          if (img.dataset.srcset) img.srcset = img.dataset.srcset;
        }
      }
    } else if (img._initializeElement && typeof img._initializeElement === 'function') {
      // For browsers with proper custom element support
      img._initializeElement();
    }
  });
};

if (window.customElements) {
  try {
    customElements.define("media-loader", MediaLoader, { extends: "img" });
  } catch (error) {
    console.error('MediaLoader registration failed:', error);
  }
}

// Initialize Safari fallback immediately
(function initMediaLoaderImmediately() {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  if (isSafari) {
    // Initialize existing images
    const initExistingImages = function () {
      window.initAllMediaLoaders();
    };

    // Process any elements that might already be in the DOM
    initExistingImages();

    // Try to initialize again when document becomes interactive
    if (document.readyState === 'loading') {
      document.addEventListener('readystatechange', function () {
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
          initExistingImages();
        }
      });
    }

    // Set up a MutationObserver to catch dynamically added elements
    const bodyObserver = new MutationObserver(function (mutations) {
      let needsInit = false;

      mutations.forEach(function (mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) { // Element node
              if (node.matches && node.matches('img[is="media-loader"]')) {
                needsInit = true;
              }

              if (node.querySelectorAll) {
                const childImages = node.querySelectorAll('img[is="media-loader"]');
                if (childImages.length > 0) {
                  needsInit = true;
                }
              }
            }
          });
        }
      });

      if (needsInit) {
        initExistingImages();
      }
    });

    // Try to start observing as early as possible
    const startBodyObservation = function () {
      if (document.body) {
        bodyObserver.observe(document.body, { childList: true, subtree: true });
        return true;
      }
      return false;
    };

    // If we can't observe body right now, keep trying
    if (!startBodyObservation()) {
      // If document is still loading, try on DOMContentLoaded
      document.addEventListener('DOMContentLoaded', startBodyObservation);

      // Also set up a short interval as a fallback
      const checkBodyInterval = setInterval(function () {
        if (startBodyObservation()) {
          clearInterval(checkBodyInterval);
        }
      }, 10);
    }

    // Also initialize on load as a final fallback
    window.addEventListener('load', initExistingImages);
  } else {
    // For non-Safari browsers, just call once to initialize any images already in view
    window.addEventListener('DOMContentLoaded', function () {
      // Find any images that might be in the viewport already and initialize them
      const images = document.querySelectorAll('img[is="media-loader"]');
      images.forEach(function (img) {
        if (img.isInViewport && img.isInViewport()) {
          img._activate();
        }
      });
    });
  }
})();

// Legacy event listener for backwards compatibility
document.addEventListener('DOMContentLoaded', function () {
  // This is kept empty intentionally as initialization now happens earlier
});