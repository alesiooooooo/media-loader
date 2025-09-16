class MediaLoader extends HTMLImageElement {
  constructor() {
    super();
    this._mutObserver = null;
  }

  connectedCallback() {
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

  _activate() {
    if (this.dataset.src) this.src = this.dataset.src;
    if (this.dataset.srcset) this.srcset = this.dataset.srcset;
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

if (window.customElements) {
  try {
    customElements.define("media-loader", MediaLoader, { extends: "img" });
  } catch (error) {
    console.error('MediaLoader registration failed:', error);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  if (isSafari) {
    const images = document.querySelectorAll('img[is="media-loader"]');

    images.forEach(function (img) {
      img._mutObserver = null;
      img._activate = MediaLoader.prototype._activate.bind(img);
      img._markLoading = MediaLoader.prototype._markLoading.bind(img);
      img.connectedCallback = MediaLoader.prototype.connectedCallback.bind(img);
      img.disconnectedCallback = MediaLoader.prototype.disconnectedCallback.bind(img);
      img.reload = MediaLoader.prototype.reload.bind(img);
      img.updateSrc = MediaLoader.prototype.updateSrc.bind(img);

      if (!MediaLoader._observer) {
        MediaLoader._observer = new IntersectionObserver(entries => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const el = entry.target;
              if (el._activate) {
                el._activate();
                MediaLoader._observer.unobserve(el);
              }
            }
          }
        }, {
          rootMargin: "150px",
          threshold: 0.01
        });
      }

      try {
        img.connectedCallback();
      } catch (error) {
        console.error('Safari initialization failed:', error);
      }
    });
  }
});