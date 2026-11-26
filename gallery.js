/* ============================================================
   照片墙
   读取 gallery/index.json，渲染瀑布流和灯箱。
   ============================================================ */
(function () {
  'use strict';

  var MANIFEST = 'gallery/index.json';

  var grid = document.getElementById('galleryGrid');
  var empty = document.getElementById('galleryEmpty');
  var errorBox = document.getElementById('galleryError');
  var count = document.getElementById('galleryCount');
  var retry = document.getElementById('retryGallery');
  var sortWrap = document.getElementById('gallerySort');
  var sortBtns = sortWrap ? Array.prototype.slice.call(sortWrap.querySelectorAll('.sort-btn')) : [];

  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxCaption = document.getElementById('lightboxCaption');
  var lightboxMeta = document.getElementById('lightboxMeta');
  var closeBtn = document.getElementById('lightboxClose');
  var prevBtn = document.getElementById('lightboxPrev');
  var nextBtn = document.getElementById('lightboxNext');

  if (!grid || !lightbox) return;

  var photos = [];
  var current = 0;
  var isOpen = false;
  var lastFocus = null;
  var sortOrder = readSortOrder();

  function photoUrl(file) {
    return 'gallery/' + encodeURIComponent(file);
  }

  function formatDate(value) {
    if (!value) return '';
    var parts = String(value).slice(0, 10).split('-');
    if (parts.length !== 3) return '';
    return parts[0] + '.' + parts[1] + '.' + parts[2];
  }

  function fileDateTime(photo) {
    var name = String((photo && photo.file) || '');
    var m = name.match(/photo-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/);
    if (m) {
      return {
        date: m[1] + '.' + m[2] + '.' + m[3],
        time: m[4] + ':' + m[5],
        stamp: m[1] + m[2] + m[3] + m[4] + m[5] + m[6]
      };
    }
    var date = formatDate(photo && photo.date);
    var digits = String((photo && photo.date) || '').replace(/\D/g, '');
    return { date: date, time: '', stamp: digits ? digits + '000000' : '' };
  }

  function photoStamp(photo) {
    return fileDateTime(photo).stamp.padEnd(14, '0');
  }

  function readSortOrder() {
    var value = '';
    try {
      var fromUrl = new URLSearchParams(window.location.search).get('sort');
      if (fromUrl === 'asc' || fromUrl === 'desc') value = fromUrl;
      if (!value) value = localStorage.getItem('qyx-gallery-sort') || '';
    } catch (e) { /* 隐私模式下忽略 */ }
    return value === 'asc' ? 'asc' : 'desc';
  }

  function updateSortButtons() {
    sortBtns.forEach(function (btn) {
      var active = btn.getAttribute('data-sort') === sortOrder;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function saveSortOrder() {
    try { localStorage.setItem('qyx-gallery-sort', sortOrder); } catch (e) { /* ignore */ }
    try {
      var url = new URL(window.location.href);
      url.searchParams.set('sort', sortOrder);
      window.history.replaceState(null, '', url);
    } catch (e) { /* ignore */ }
  }

  function sortPhotos() {
    photos.sort(function (a, b) {
      var ak = photoStamp(a);
      var bk = photoStamp(b);
      var cmp = ak < bk ? -1 : ak > bk ? 1 : 0;
      if (cmp !== 0) return sortOrder === 'asc' ? cmp : -cmp;
      var af = String(a.file || '');
      var bf = String(b.file || '');
      return sortOrder === 'asc' ? af.localeCompare(bf) : bf.localeCompare(af);
    });
  }

  function setCount(text) {
    if (count) count.textContent = text;
  }

  function showSkeletons() {
    empty.hidden = true;
    errorBox.hidden = true;
    grid.hidden = false;
    grid.innerHTML = '';
    grid.setAttribute('aria-busy', 'true');
    for (var i = 0; i < 6; i++) {
      var block = document.createElement('div');
      block.className = 'skeleton';
      grid.appendChild(block);
    }
    setCount('正在数照片…');
    if (sortWrap) sortWrap.hidden = true;
  }

  function showEmpty() {
    grid.hidden = true;
    empty.hidden = false;
    errorBox.hidden = true;
    grid.setAttribute('aria-busy', 'false');
    setCount('0 张照片');
    if (sortWrap) sortWrap.hidden = true;
  }

  function showError() {
    grid.hidden = true;
    empty.hidden = true;
    errorBox.hidden = false;
    grid.setAttribute('aria-busy', 'false');
    setCount('照片墙暂时不可用');
    if (sortWrap) sortWrap.hidden = true;
  }

  function render() {
    if (!photos.length) {
      showEmpty();
      return;
    }
    empty.hidden = true;
    errorBox.hidden = true;
    grid.hidden = false;
    grid.innerHTML = '';
    grid.setAttribute('aria-busy', 'false');
    setCount('共 ' + photos.length + ' 张照片');
    if (sortWrap) sortWrap.hidden = false;

    photos.forEach(function (photo, index) {
      var fig = document.createElement('figure');
      fig.className = 'gallery-item';
      fig.style.setProperty('--i', String(index));

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gallery-open';
      btn.setAttribute('aria-label', '查看照片' + (photo.caption ? '：' + photo.caption : ' ' + (index + 1)));

      var img = document.createElement('img');
      img.src = photoUrl(photo.file);
      img.alt = photo.caption || '照片墙照片 ' + (index + 1);
      img.loading = 'lazy';
      img.decoding = 'async';
      if (photo.w && photo.h) {
        img.width = photo.w;
        img.height = photo.h;
      }

      var shade = document.createElement('span');
      shade.className = 'gallery-shade';

      var meta = document.createElement('span');
      meta.className = 'gallery-meta';
      if (photo.caption) {
        var cap = document.createElement('span');
        cap.className = 'gallery-cap';
        cap.textContent = photo.caption;
        meta.appendChild(cap);
      }
      var when = fileDateTime(photo);
      if (when.date) {
        var dateEl = document.createElement('span');
        dateEl.className = 'gallery-date';
        dateEl.textContent = when.date + (when.time ? ' ' + when.time : '');
        meta.appendChild(dateEl);
      }

      btn.appendChild(img);
      btn.appendChild(shade);
      btn.appendChild(meta);
      btn.addEventListener('click', function () { openLightbox(index, btn); });

      fig.appendChild(btn);
      grid.appendChild(fig);
    });
  }

  function load() {
    showSkeletons();
    fetch(MANIFEST + '?v=' + Date.now(), { cache: 'no-store' })
      .then(function (res) {
        if (res.status === 404) return { photos: [] };
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        photos = (Array.isArray(data && data.photos) ? data.photos : []).filter(function (p) {
          return p && typeof p.file === 'string' && p.file;
        });
        sortPhotos();
        render();
      })
      .catch(function (err) {
        console.warn('[gallery]', err);
        showError();
      });
  }

  /* ---------- 灯箱 ---------- */
  function showPhoto(index) {
    if (!photos.length) return;
    current = (index + photos.length) % photos.length;
    var photo = photos[current];

    lightboxImg.src = photoUrl(photo.file);
    lightboxImg.alt = photo.caption || '照片墙照片 ' + (current + 1);
    lightboxCaption.textContent = photo.caption || '';

    var when = fileDateTime(photo);
    var meta = (when.date ? when.date + (when.time ? ' ' + when.time : '') + ' · ' : '') +
      (current + 1) + ' / ' + photos.length;
    lightboxMeta.textContent = meta;

    var many = photos.length > 1;
    prevBtn.hidden = !many;
    nextBtn.hidden = !many;

    if (many) {
      [current - 1, current + 1].forEach(function (i) {
        var p = photos[(i + photos.length) % photos.length];
        if (p) {
          var pre = new Image();
          pre.src = photoUrl(p.file);
        }
      });
    }
  }

  function onKeydown(e) {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeLightbox();
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      showPhoto(current - 1);
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      showPhoto(current + 1);
      return;
    }
    if (e.key === 'Tab') {
      var focusables = [closeBtn, prevBtn, nextBtn].filter(function (el) { return !el.hidden; });
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && (document.activeElement === first || !lightbox.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !lightbox.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function openLightbox(index, trigger) {
    if (!photos.length) return;
    lastFocus = trigger || document.activeElement;
    showPhoto(index);
    lightbox.hidden = false;
    document.body.classList.add('is-locked');
    isOpen = true;
    document.addEventListener('keydown', onKeydown);
    window.setTimeout(function () { closeBtn.focus(); }, 0);
  }

  function closeLightbox() {
    if (!isOpen) return;
    isOpen = false;
    lightbox.hidden = true;
    document.body.classList.remove('is-locked');
    document.removeEventListener('keydown', onKeydown);
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  sortBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = btn.getAttribute('data-sort');
      if (!next || next === sortOrder || !photos.length) return;
      sortOrder = next;
      updateSortButtons();
      saveSortOrder();
      sortPhotos();
      render();
    });
  });

  updateSortButtons();

  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', function () { showPhoto(current - 1); });
  nextBtn.addEventListener('click', function () { showPhoto(current + 1); });
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  var startX = 0;
  var startY = 0;
  var tracking = false;
  lightbox.addEventListener('pointerdown', function (e) {
    if (e.target.closest('button')) return;
    tracking = true;
    startX = e.clientX;
    startY = e.clientY;
  }, { passive: true });
  lightbox.addEventListener('pointerup', function (e) {
    if (!tracking) return;
    tracking = false;
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      showPhoto(current + (dx < 0 ? 1 : -1));
    }
  }, { passive: true });

  if (retry) retry.addEventListener('click', load);

  load();
})();
