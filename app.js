/* ============================================================
   qyx的妙妙屋 — interactions
   原生 JS，没有依赖。
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  function prefersReduced() { return reduceQuery.matches; }

  /* ---------------------------------------------------------
     主题：开灯 / 关灯
     --------------------------------------------------------- */
  var themeToggle = document.getElementById('themeToggle');
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  function syncThemeUI() {
    var isDay = root.dataset.theme === 'day';
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', isDay ? '切换到夜间模式' : '切换到日间模式');
      themeToggle.title = isDay ? '关灯，回到夜晚' : '开灯，看看白天';
    }
    if (themeMeta) themeMeta.setAttribute('content', isDay ? '#fbf2e2' : '#0b0716');
    if (window.__miaomiaoSky) window.__miaomiaoSky.refresh();
  }

  function setTheme(theme, remember) {
    var apply = function () {
      root.dataset.theme = theme;
      syncThemeUI();
    };
    if (remember !== false && document.startViewTransition && !prefersReduced()) {
      document.startViewTransition(apply);
    } else {
      apply();
    }
    if (remember !== false) {
      try { localStorage.setItem('qyx-theme', theme); } catch (e) { /* 隐身模式下也无所谓 */ }
    }
  }

  syncThemeUI();

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      setTheme(root.dataset.theme === 'day' ? 'night' : 'day', true);
    });
  }

  /* ---------------------------------------------------------
     星空背景
     --------------------------------------------------------- */
  (function sky() {
    var canvas = document.getElementById('sky');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var dpr = 1, width = 0, height = 0;
    var stars = [];
    var shooting = null;
    var nextShotAt = 0;
    var pointer = { x: 0, y: 0 };
    var target = { x: 0, y: 0 };
    var rafId = 0;
    var running = false;
    var startTime = 0;

    function isDay() { return root.dataset.theme === 'day'; }

    function palette() {
      return isDay()
        ? ['#ffc233', '#ff8fb4', '#6fd3e7', '#b79bff']
        : ['#fff8e1', '#ffd84f', '#ff9fc4', '#bfe9ff'];
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.max(42, Math.min(210, Math.round((width * height) / 12000)));
      stars = [];
      for (var i = 0; i < count; i++) {
        var z = Math.random();
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.45 + Math.random() * 1.5 * (0.45 + z * 0.8),
          z: z,
          color: i % 4,
          base: 0.22 + Math.random() * 0.58,
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 1.5
        });
      }
      if (prefersReduced() || !running) drawStatic();
    }

    function drawStatic() {
      ctx.clearRect(0, 0, width, height);
      var colors = palette();
      var day = isDay();
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        ctx.globalAlpha = s.base * (day ? 0.5 : 0.85);
        ctx.fillStyle = colors[s.color];
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function draw(t) {
      ctx.clearRect(0, 0, width, height);
      var colors = palette();
      var day = isDay();

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var twinkle = 0.55 + 0.45 * Math.sin(t * 0.001 * s.speed + s.phase);
        var alpha = s.base * (day ? 0.55 : 0.95) * twinkle;
        var x = s.x + pointer.x * (8 + s.z * 20);
        var y = s.y + pointer.y * (6 + s.z * 16);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = colors[s.color];
        if (s.r > 1.55) {
          ctx.shadowBlur = day ? 4 : 9;
          ctx.shadowColor = colors[s.color];
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      if (!day) drawShootingStar(t);
    }

    function drawShootingStar(t) {
      if (!shooting && t > nextShotAt) {
        shooting = {
          x: width * (0.15 + Math.random() * 0.7),
          y: height * (0.05 + Math.random() * 0.3),
          vx: -(3 + Math.random() * 2.4),
          vy: 1.1 + Math.random() * 0.9,
          life: 1
        };
        nextShotAt = t + 6500 + Math.random() * 7000;
      }
      if (!shooting) return;

      var s = shooting;
      s.x += s.vx * 1.7;
      s.y += s.vy * 1.7;
      s.life -= 0.012;

      if (s.life <= 0 || s.x < -120 || s.y > height + 80) {
        shooting = null;
        return;
      }

      var tailX = s.x - s.vx * 24;
      var tailY = s.y - s.vy * 24;
      var grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
      grad.addColorStop(0, 'rgba(255,248,225,' + (s.life * 0.9) + ')');
      grad.addColorStop(1, 'rgba(255,216,79,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
    }

    function frame(t) {
      if (!running) return;
      if (!startTime) startTime = t;
      pointer.x += (target.x - pointer.x) * 0.045;
      pointer.y += (target.y - pointer.y) * 0.045;
      draw(t);
      rafId = window.requestAnimationFrame(frame);
    }

    function start() {
      if (running || prefersReduced()) {
        drawStatic();
        return;
      }
      running = true;
      startTime = 0;
      rafId = window.requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
    }

    var resizeTimer = 0;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 140);
    }, { passive: true });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else start();
    });

    reduceQuery.addEventListener('change', function () {
      stop();
      start();
    });

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      window.addEventListener('pointermove', function (e) {
        target.x = (e.clientX / window.innerWidth - 0.5) * 2;
        target.y = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });
    }

    resize();
    start();

    window.__miaomiaoSky = {
      refresh: function () {
        if (!running) drawStatic();
      }
    };
  })();

  /* ---------------------------------------------------------
     滚动进度 + 顶栏状态
     --------------------------------------------------------- */
  (function scrollUI() {
    var header = document.querySelector('.site-head');
    var progress = document.getElementById('progress');
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY || document.documentElement.scrollTop;
      if (header) header.classList.toggle('is-scrolled', y > 12);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  })();

  /* ---------------------------------------------------------
     进场动画
     --------------------------------------------------------- */
  (function reveals() {
    var groups = document.querySelectorAll('[data-stagger]');
    for (var g = 0; g < groups.length; g++) {
      var kids = groups[g].children;
      for (var k = 0; k < kids.length; k++) {
        kids[k].style.setProperty('--d', (k * 85) + 'ms');
      }
    }

    var targets = document.querySelectorAll('.reveal, [data-stagger]');
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < targets.length; i++) targets[i].classList.add('is-in');
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    for (var j = 0; j < targets.length; j++) observer.observe(targets[j]);
  })();

  /* ---------------------------------------------------------
     游戏卡片跟随鼠标倾斜
     --------------------------------------------------------- */
  (function cardTilt() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || prefersReduced()) return;

    var cards = document.querySelectorAll('.game-card');
    var maxTilt = 3.2;

    cards.forEach(function (card) {
      var pending = false;
      var latest = null;

      card.addEventListener('pointermove', function (e) {
        latest = e;
        if (pending) return;
        pending = true;
        window.requestAnimationFrame(function () {
          pending = false;
          if (!latest) return;
          var rect = card.getBoundingClientRect();
          var px = (latest.clientX - rect.left) / rect.width;
          var py = (latest.clientY - rect.top) / rect.height;
          card.style.setProperty('--ry', ((px - 0.5) * 2 * maxTilt).toFixed(2) + 'deg');
          card.style.setProperty('--rx', ((0.5 - py) * 2 * maxTilt).toFixed(2) + 'deg');
          card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
          card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        });
      });

      card.addEventListener('pointerleave', function () {
        latest = null;
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  })();

  /* ---------------------------------------------------------
     提示条
     --------------------------------------------------------- */
  var toastEl = document.getElementById('toast');
  var toastTimer = 0;

  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove('show');
    }, 2800);
  }

  /* ---------------------------------------------------------
     复制链接
     --------------------------------------------------------- */
  function fallbackCopy(text) {
    return new Promise(function (resolve, reject) {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try {
        var ok = document.execCommand('copy');
        document.body.removeChild(area);
        if (ok) resolve();
        else reject(new Error('copy failed'));
      } catch (err) {
        document.body.removeChild(area);
        reject(err);
      }
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return fallbackCopy(text);
      });
    }
    return fallbackCopy(text);
  }

  function copyWithToast(text, message) {
    copyText(text).then(function () {
      toast(message);
    }).catch(function () {
      toast('复制失败，手动选一下吧');
    });
  }

  var copyBtn = document.getElementById('copyLink');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      copyWithToast(window.location.href.split('#')[0], '链接已复制，去分享给朋友吧 ✦');
    });
  }

  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      if (!text) return;
      copyWithToast(text, btn.getAttribute('data-copy-msg') || '已复制');
    });
  });

  /* ---------------------------------------------------------
     点按小星星 + 彩蛋
     --------------------------------------------------------- */
  function burst(x, y) {
    if (prefersReduced()) return;
    for (var i = 0; i < 8; i++) {
      var el = document.createElement('span');
      var angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
      var distance = 26 + Math.random() * 38;
      el.className = 'burst';
      el.textContent = '✦';
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.color = i % 2 ? 'var(--pink)' : 'var(--yellow)';
      el.style.setProperty('--dx', (Math.cos(angle) * distance).toFixed(1) + 'px');
      el.style.setProperty('--dy', (Math.sin(angle) * distance).toFixed(1) + 'px');
      document.body.appendChild(el);
      el.addEventListener('animationend', function () { this.remove(); }, { once: true });
    }
  }

  document.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    var hit = e.target.closest('.btn, .game-card, .soon-link, .brand, .room-card');
    if (hit) burst(e.clientX, e.clientY);
  }, { passive: true });

  function starRain() {
    if (prefersReduced()) {
      toast('✦ 彩蛋收到！不过你开启了「减少动态效果」，星星就安静地待着。');
      return;
    }
    var colors = ['#ffd84f', '#ff8fb4', '#6fe7ff', '#bda8ff'];
    for (var i = 0; i < 36; i++) {
      var el = document.createElement('span');
      el.className = 'rain';
      el.textContent = Math.random() > 0.55 ? '✦' : '·';
      el.style.left = (Math.random() * 100) + 'vw';
      el.style.fontSize = (9 + Math.random() * 17) + 'px';
      el.style.color = colors[i % colors.length];
      el.style.setProperty('--drift', (Math.random() * 140 - 70).toFixed(0) + 'px');
      el.style.animationDuration = (1.7 + Math.random() * 1.7).toFixed(2) + 's';
      el.style.animationDelay = (Math.random() * 0.7).toFixed(2) + 's';
      document.body.appendChild(el);
      (function (node) {
        window.setTimeout(function () { node.remove(); }, 4200);
      })(el);
    }
    toast('✦ 你找到了妙妙屋的隐藏彩蛋，今晚的星星都归你。');
  }

  var keyBuffer = '';
  window.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (!/^[a-z]$/i.test(e.key)) return;
    keyBuffer = (keyBuffer + e.key.toLowerCase()).slice(-3);
    if (keyBuffer === 'qyx') {
      keyBuffer = '';
      starRain();
    }
  });

  /* ---------------------------------------------------------
     给爱翻控制台的人留句话
     --------------------------------------------------------- */
  try {
    console.log('%c妙妙屋 ✦ 欢迎来到控制台', 'background:#ffd84f;color:#171029;padding:6px 12px;border-radius:6px;font-weight:700;font-family:sans-serif');
    console.log('%c输入 qyx 有惊喜。', 'color:#a78bfa;font-family:monospace');
  } catch (e) { /* ignore */ }
})();
