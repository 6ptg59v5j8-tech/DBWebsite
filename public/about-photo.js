(() => {
  'use strict';

  const frame = document.getElementById('about-photo-frame');
  const placeholder = document.getElementById('about-photo-placeholder');
  if (!frame) return;

  function showPlaceholder() {
    if (placeholder) placeholder.hidden = false;
    frame.classList.remove('has-photo');
  }

  function normaliseImageUrl(value) {
    if (typeof value !== 'string') return '';
    const raw = value.trim();
    if (!raw) return '';
    try {
      const url = new URL(raw, window.location.origin);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
      return url.href;
    } catch {
      return '';
    }
  }

  async function loadPhoto() {
    try {
      const response = await fetch('/api/content', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        credentials: 'same-origin'
      });

      if (!response.ok) throw new Error(`Content request failed (${response.status})`);

      const data = await response.json();
      const settings = data && data.settings ? data.settings : {};
      const imageUrl = normaliseImageUrl(
        settings.about_photo_url || settings.about_image_url || ''
      );

      if (!imageUrl) {
        showPlaceholder();
        return;
      }

      const image = new Image();
      image.className = 'about-photo';
      image.alt = 'Portrait of Daniel';
      image.decoding = 'async';
      image.loading = 'eager';

      image.addEventListener('load', () => {
        frame.querySelectorAll('img.about-photo').forEach(existing => {
          if (existing !== image) existing.remove();
        });
        frame.appendChild(image);
        frame.classList.add('has-photo');
        if (placeholder) placeholder.hidden = true;
      }, { once: true });

      image.addEventListener('error', () => {
        image.remove();
        showPlaceholder();
        console.error('About portrait could not be loaded:', imageUrl);
      }, { once: true });

      image.src = imageUrl;

      // decode() also handles cached images whose load event may already have fired.
      if (image.complete && image.naturalWidth > 0) {
        if (typeof image.decode === 'function') {
          try { await image.decode(); } catch {}
        }
        if (!frame.contains(image)) {
          frame.appendChild(image);
          frame.classList.add('has-photo');
          if (placeholder) placeholder.hidden = true;
        }
      }
    } catch (error) {
      showPlaceholder();
      console.error('Could not load About portrait:', error);
    }
  }

  loadPhoto();

  // Keep the portrait in sync if another script updates content without a full reload.
  window.addEventListener('pageshow', event => {
    if (event.persisted) loadPhoto();
  });
})();
