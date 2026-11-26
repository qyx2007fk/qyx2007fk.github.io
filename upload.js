/* ============================================================
   照片上传
   用一枚细粒度 GitHub token，在浏览器里把照片提交到仓库。
   token 只保存在本机浏览器，不会写进网站。
   ============================================================ */
(function () {
  'use strict';

  var API = 'https://api.github.com';
  var OWNER = 'qyx2007fk';
  var REPO = 'qyx2007fk.github.io';
  var BRANCH = 'main';
  var TOKEN_KEY = 'qyx-gallery-token';
  var MAX_FILES = 20;
  var MAX_DIM = 2200;
  var MAX_BYTES = 30 * 1024 * 1024;
  var QUALITY = 0.86;

  var els = {
    tokenInput: document.getElementById('tokenInput'),
    remember: document.getElementById('rememberToken'),
    saveToken: document.getElementById('saveToken'),
    tokenState: document.getElementById('tokenState'),
    tokenError: document.getElementById('tokenError'),
    tokenConnected: document.getElementById('tokenConnected'),
    tokenRepo: document.getElementById('tokenRepo'),
    clearToken: document.getElementById('clearToken'),
    dropzone: document.getElementById('dropzone'),
    fileInput: document.getElementById('fileInput'),
    fileCount: document.getElementById('fileCount'),
    previewGrid: document.getElementById('previewGrid'),
    uploadBtn: document.getElementById('uploadBtn'),
    clearBtn: document.getElementById('clearBtn'),
    uploadHint: document.getElementById('uploadHint'),
    uploadError: document.getElementById('uploadError'),
    progressWrap: document.getElementById('progressWrap'),
    progressTrack: document.getElementById('progressTrack'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    successPanel: document.getElementById('successPanel'),
    successText: document.getElementById('successText'),
    successLink: document.getElementById('successLink'),
    againBtn: document.getElementById('againBtn'),
    manageLocked: document.getElementById('manageLocked'),
    manageBody: document.getElementById('manageBody'),
    manageCount: document.getElementById('manageCount'),
    manageGrid: document.getElementById('manageGrid'),
    manageEmpty: document.getElementById('manageEmpty'),
    manageError: document.getElementById('manageError'),
    manageSelected: document.getElementById('manageSelected'),
    manageDelete: document.getElementById('manageDelete'),
    manageHint: document.getElementById('manageHint'),
    manageStatus: document.getElementById('manageStatus'),
    manageSelectAll: document.getElementById('manageSelectAll'),
    manageClear: document.getElementById('manageClear'),
    manageRefresh: document.getElementById('manageRefresh'),
    manageConnect: document.getElementById('manageConnect')
  };

  if (!els.uploadBtn) return;

  var token = '';
  var files = [];
  var managePhotos = [];
  var busy = false;
  var uid = 0;

  /* ---------- 小工具 ---------- */
  function pad(n) { return String(n).padStart(2, '0'); }

  function localDate() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function fileStamp() {
    var d = new Date();
    return '' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' +
      pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + '-' +
      Math.random().toString(36).slice(2, 6);
  }

  function authHeaders(value) {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + value
    };
  }

  function gh(path, options, value) {
    options = options || {};
    var headers = authHeaders(value || token);
    if (options.body) headers['Content-Type'] = 'application/json';

    return fetch(API + path, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (data) {
        if (!res.ok) {
          var err = new Error((data && data.message) || ('GitHub API ' + res.status));
          err.status = res.status;
          throw err;
        }
        return data;
      });
    });
  }

  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var result = String(reader.result || '');
        resolve(result.slice(result.indexOf(',') + 1));
      };
      reader.onerror = function () { reject(new Error('照片读取出错了。')); };
      reader.readAsDataURL(blob);
    });
  }

  function utf8ToBase64(text) {
    var bytes = new TextEncoder().encode(text);
    var binary = '';
    var chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function decodeBase64Utf8(base64) {
    var clean = String(base64 || '').replace(/\s/g, '');
    var binary = atob(clean);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function showError(el, text) {
    if (!el) return;
    el.textContent = text;
    el.hidden = false;
  }

  function hideError(el) {
    if (el) el.hidden = true;
  }

  function messageFor(err) {
    if (!err) return '出了点问题，再试一次。';
    if (err.status === 401) return 'token 无效或过期了，重新生成一枚再试。';
    if (err.status === 403) return 'GitHub 拒绝了这次操作：token 可能没有 Contents 写权限，或者触发了频率限制。';
    if (err.status === 404) return '找不到这个仓库，确认 token 的 Repository access 里有 qyx2007fk.github.io。';
    if (err.status === 422) return '仓库刚刚有更新，再试一次就好。';
    if (err instanceof TypeError) return '网络好像断了，或者浏览器拦住了请求。检查网络后再试。';
    return err.message || '出了点问题，再试一次。';
  }

  /* ---------- token ---------- */
  function getStoredToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function wasRemembered() {
    try {
      return Boolean(localStorage.getItem(TOKEN_KEY));
    } catch (e) {
      return false;
    }
  }

  function storeToken(value, remember) {
    try {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      if (!value) return;
      if (remember) localStorage.setItem(TOKEN_KEY, value);
      else sessionStorage.setItem(TOKEN_KEY, value);
    } catch (e) { /* 隐私模式下就不存 */ }
  }

  function forgetToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    } catch (e) { /* ignore */ }
  }

  function setTokenState(text, cls) {
    els.tokenState.textContent = text;
    els.tokenState.classList.remove('is-ok', 'is-bad', 'is-wait');
    if (cls) els.tokenState.classList.add(cls);
  }

  function updateReady() {
    var hasToken = Boolean(token);
    var hasFiles = files.length > 0;
    els.fileCount.textContent = files.length + ' / ' + MAX_FILES;
    els.uploadBtn.disabled = busy || !hasToken || !hasFiles;
    els.clearBtn.disabled = busy || !hasFiles;
    els.dropzone.disabled = busy;
    els.tokenInput.disabled = busy;
    els.saveToken.disabled = busy;
    els.remember.disabled = busy;
    els.clearToken.disabled = busy;

    if (busy) {
      els.uploadHint.textContent = '正在上传…';
    } else if (!hasToken) {
      els.uploadHint.textContent = '先连接 GitHub，再上传。';
    } else if (!hasFiles) {
      els.uploadHint.textContent = '先选照片，再点上传。';
    } else {
      els.uploadHint.textContent = '选好照片后，点上传。';
    }
    updateManageUI();
  }

  function verifyToken(silent) {
    var value = els.tokenInput.value.trim();
    if (!value) {
      showError(els.tokenError, '先粘贴一枚 token。');
      setTokenState('未连接', '');
      els.tokenInput.focus();
      return Promise.resolve(false);
    }

    setTokenState('验证中…', 'is-wait');
    hideError(els.tokenError);

    return gh('/repos/' + OWNER + '/' + REPO, {}, value)
      .then(function (repo) {
        if (repo && repo.permissions && repo.permissions.push === false) {
          var err = new Error('这个 token 没有 Contents 写权限，需要选 Read and write。');
          err.status = 403;
          throw err;
        }
        token = value;
        storeToken(value, els.remember.checked);
        els.tokenConnected.hidden = false;
        els.tokenRepo.textContent = REPO;
        setTokenState('已连接', 'is-ok');
        hideError(els.tokenError);
        updateReady();
        loadManage();
        return true;
      })
      .catch(function (err) {
        setTokenState('连接失败', 'is-bad');
        showError(els.tokenError, messageFor(err));
        els.tokenConnected.hidden = true;
        if (err.status === 401 || err.status === 403) {
          token = '';
          forgetToken();
        }
        updateReady();
        resetManage();
        if (!silent) console.warn('[token]', err.message);
        return false;
      });
  }

  els.saveToken.addEventListener('click', function () { verifyToken(false); });
  els.tokenInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      verifyToken(false);
    }
  });
  els.tokenInput.addEventListener('input', function () {
    if (!token) return;
    token = '';
    els.tokenConnected.hidden = true;
    setTokenState('未保存', 'is-wait');
    hideError(els.tokenError);
    updateReady();
    resetManage();
  });
  els.remember.addEventListener('change', function () {
    if (token) storeToken(token, els.remember.checked);
  });
  els.clearToken.addEventListener('click', function () {
    token = '';
    els.tokenInput.value = '';
    forgetToken();
    els.tokenConnected.hidden = true;
    setTokenState('未连接', '');
    hideError(els.tokenError);
    updateReady();
    resetManage();
    els.tokenInput.focus();
  });

  /* ---------- 选照片 ---------- */
  function isImage(file) {
    if (!file) return false;
    if (file.type && file.type.indexOf('image/') === 0) return true;
    return /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name || '');
  }

  function setItemStatus(item, text, state) {
    item.status = text;
    if (item.statusEl) item.statusEl.textContent = text;
    if (!item.card) return;
    item.card.classList.remove('is-busy', 'is-done', 'is-error');
    if (state) item.card.classList.add(state);
  }

  function renderPreview(item) {
    var card = document.createElement('figure');
    card.className = 'preview-card';

    var img = document.createElement('img');
    img.src = item.url;
    img.alt = '待上传的照片';
    img.decoding = 'async';

    var remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'preview-remove';
    remove.setAttribute('aria-label', '移除这张照片');
    remove.textContent = '×';
    remove.addEventListener('click', function () { removeItem(item.id); });

    var body = document.createElement('div');
    body.className = 'preview-body';

    var caption = document.createElement('input');
    caption.type = 'text';
    caption.className = 'preview-caption';
    caption.maxLength = 80;
    caption.placeholder = '写一句说明（可选）';
    caption.setAttribute('aria-label', '照片说明');
    caption.addEventListener('input', function () { item.caption = caption.value; });

    var status = document.createElement('span');
    status.className = 'preview-status';
    status.textContent = item.status;

    body.appendChild(caption);
    body.appendChild(status);
    card.appendChild(img);
    card.appendChild(remove);
    card.appendChild(body);
    els.previewGrid.appendChild(card);

    item.card = card;
    item.statusEl = status;
  }

  function addFiles(list) {
    if (busy) return;
    hideError(els.uploadError);
    els.successPanel.hidden = true;

    var incoming = Array.prototype.slice.call(list || []);
    if (!incoming.length) return;
    var room = MAX_FILES - files.length;
    if (room <= 0) {
      showError(els.uploadError, '一次最多 20 张，先上传这一组，或者清空重选。');
      return;
    }

    var accepted = [];
    var skipped = 0;
    var tooBig = 0;
    for (var i = 0; i < incoming.length && accepted.length < room; i++) {
      if (!isImage(incoming[i])) { skipped++; continue; }
      if (incoming[i].size > MAX_BYTES) { tooBig++; continue; }
      accepted.push(incoming[i]);
    }
    if (accepted.length === 0) {
      showError(els.uploadError, '这些文件不是照片，换 JPG / PNG / WebP 试试。');
      return;
    }

    accepted.forEach(function (file) {
      var item = {
        id: ++uid,
        file: file,
        url: URL.createObjectURL(file),
        caption: '',
        status: '待上传',
        card: null,
        statusEl: null
      };
      files.push(item);
      renderPreview(item);
    });

    if (accepted.length < incoming.length) {
      var notes = [];
      if (files.length + accepted.length >= MAX_FILES && incoming.length > accepted.length) {
        notes.push('一次最多 20 张');
      }
      if (skipped) notes.push('跳过了 ' + skipped + ' 个不是照片的文件');
      if (tooBig) notes.push(tooBig + ' 张超过 30MB 没加进来');
      if (notes.length) showError(els.uploadError, notes.join('；') + '。');
    }

    els.previewGrid.hidden = files.length === 0;
    updateReady();
  }

  function removeItem(id) {
    if (busy) return;
    var index = files.findIndex(function (item) { return item.id === id; });
    if (index < 0) return;
    var item = files[index];
    URL.revokeObjectURL(item.url);
    if (item.card) item.card.remove();
    files.splice(index, 1);
    els.previewGrid.hidden = files.length === 0;
    updateReady();
  }

  function clearFiles() {
    if (busy) return;
    files.forEach(function (item) {
      URL.revokeObjectURL(item.url);
      if (item.card) item.card.remove();
    });
    files = [];
    els.previewGrid.innerHTML = '';
    els.previewGrid.hidden = true;
    els.successPanel.hidden = true;
    els.progressWrap.hidden = true;
    hideError(els.uploadError);
    updateReady();
  }

  els.dropzone.addEventListener('click', function () {
    if (!busy) els.fileInput.click();
  });
  els.fileInput.addEventListener('change', function () {
    addFiles(els.fileInput.files);
    els.fileInput.value = '';
  });
  els.clearBtn.addEventListener('click', clearFiles);
  els.againBtn.addEventListener('click', function () {
    clearFiles();
    els.dropzone.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'center' });
  });

  ['dragenter', 'dragover'].forEach(function (ev) {
    els.dropzone.addEventListener(ev, function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (!busy) els.dropzone.classList.add('is-dragover');
    });
  });
  ['dragleave', 'dragend'].forEach(function (ev) {
    els.dropzone.addEventListener(ev, function () {
      els.dropzone.classList.remove('is-dragover');
    });
  });
  els.dropzone.addEventListener('drop', function (e) {
    e.preventDefault();
    e.stopPropagation();
    els.dropzone.classList.remove('is-dragover');
    if (!busy && e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
  });
  window.addEventListener('dragover', function (e) { e.preventDefault(); });
  window.addEventListener('drop', function (e) { e.preventDefault(); });
  window.addEventListener('beforeunload', function () {
    files.forEach(function (item) { URL.revokeObjectURL(item.url); });
  });

  /* ---------- 压缩 ---------- */
  function prepareImage(file) {
    return new Promise(function (resolve, reject) {
      var source = null;
      var objectUrl = null;

      function fallback() {
        objectUrl = URL.createObjectURL(file);
        var img = new Image();
        img.src = objectUrl;
        img.decode().then(function () {
          source = img;
          draw();
        }).catch(function () {
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
          reject(new Error('这张照片浏览器打不开，试试 JPG / PNG。'));
        });
      }

      function draw() {
        try {
          var sw = source.width || source.naturalWidth;
          var sh = source.height || source.naturalHeight;
          if (!sw || !sh) throw new Error('这张照片读不出尺寸。');

          var scale = Math.min(1, MAX_DIM / Math.max(sw, sh));
          var w = Math.max(1, Math.round(sw * scale));
          var h = Math.max(1, Math.round(sh * scale));

          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(source, 0, 0, w, h);

          if (source.close) source.close();
          if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }

          canvas.toBlob(function (blob) {
            if (!blob) {
              reject(new Error('这张照片压缩失败了，换一张试试。'));
              return;
            }
            resolve({
              blob: blob,
              w: w,
              h: h,
              name: 'photo-' + fileStamp() + '.jpg',
              caption: '',
              date: localDate()
            });
          }, 'image/jpeg', QUALITY);
        } catch (err) {
          if (source && source.close) source.close();
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          reject(err);
        }
      }

      if ('createImageBitmap' in window) {
        createImageBitmap(file, { imageOrientation: 'from-image' })
          .then(function (bitmap) { source = bitmap; draw(); })
          .catch(function () {
            createImageBitmap(file)
              .then(function (bitmap) { source = bitmap; draw(); })
              .catch(fallback);
          });
      } else {
        fallback();
      }
    });
  }

  /* ---------- 上传 ---------- */
  function setProgress(percent, text) {
    els.progressWrap.hidden = false;
    els.progressBar.style.width = Math.max(0, Math.min(100, percent)) + '%';
    els.progressTrack.setAttribute('aria-valuenow', String(Math.round(percent)));
    els.progressText.textContent = text;
  }

  function prefersReduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function upload() {
    if (busy) return;
    if (!token) {
      showError(els.uploadError, '先在上面的「连接 GitHub」里保存 token。');
      els.tokenInput.focus();
      return;
    }
    if (!files.length) {
      showError(els.uploadError, '先选几张照片。');
      return;
    }

    busy = true;
    hideError(els.uploadError);
    els.successPanel.hidden = true;
    updateReady();
    files.forEach(function (item) { setItemStatus(item, '排队中…', 'busy'); });
    setProgress(2, '准备压缩照片…');

    var prepared = [];

    var compressChain = Promise.resolve();
    files.forEach(function (item, index) {
      compressChain = compressChain.then(function () {
        setItemStatus(item, '压缩中…', 'busy');
        setProgress(4 + (index / files.length) * 28, '压缩第 ' + (index + 1) + ' / ' + files.length + ' 张…');
        return prepareImage(item.file).then(function (image) {
          image.caption = (item.caption || '').trim();
          image.origin = item;
          prepared.push(image);
          setItemStatus(item, '压缩好了', '');
        }).catch(function (err) {
          setItemStatus(item, err.message || '压缩失败', 'error');
        });
      });
    });

    compressChain
      .then(function () {
        if (!prepared.length) {
          throw new Error('这一组照片都没能压缩成功，换几张再试。');
        }
        setProgress(36, '正在打开 GitHub 仓库…');
        return gh('/repos/' + OWNER + '/' + REPO + '/git/ref/heads/' + BRANCH);
      })
      .then(function (ref) {
        var headSha = ref.object.sha;
        return gh('/repos/' + OWNER + '/' + REPO + '/git/commits/' + headSha)
          .then(function (commit) {
            return {
              headSha: headSha,
              baseTree: commit.tree.sha
            };
          });
      })
      .then(function (base) {
        var manifest = { photos: [] };
        return gh('/repos/' + OWNER + '/' + REPO + '/contents/gallery/index.json?ref=' + encodeURIComponent(BRANCH))
          .then(function (file) {
            if (file && file.content) {
              try {
                var parsed = JSON.parse(decodeBase64Utf8(file.content));
                if (parsed && Array.isArray(parsed.photos)) manifest = parsed;
              } catch (e) {
                // manifest 坏了就重新写一份，不让上传卡住
              }
            }
            return { base: base, manifest: manifest };
          })
          .catch(function (err) {
            if (err.status === 404) return { base: base, manifest: manifest };
            throw err;
          });
      })
      .then(function (state) {
        var treeEntries = [];
        var newPhotos = [];

        var blobChain = Promise.resolve();
        prepared.forEach(function (image, index) {
          blobChain = blobChain.then(function () {
            setItemStatus(image.origin, '上传中…', 'busy');
            setProgress(40 + (index / prepared.length) * 32, '上传第 ' + (index + 1) + ' / ' + prepared.length + ' 张…');
            return blobToBase64(image.blob).then(function (base64) {
              return gh('/repos/' + OWNER + '/' + REPO + '/git/blobs', {
                method: 'POST',
                body: JSON.stringify({ content: base64, encoding: 'base64' })
              }).then(function (blob) {
                treeEntries.push({
                  path: 'gallery/' + image.name,
                  mode: '100644',
                  type: 'blob',
                  sha: blob.sha
                });
                newPhotos.push({
                  file: image.name,
                  caption: image.caption,
                  date: image.date,
                  w: image.w,
                  h: image.h
                });
                setItemStatus(image.origin, '已上传，等待提交', '');
              });
            });
          });
        });

        return blobChain.then(function () {
          state.manifest.photos = newPhotos.concat(state.manifest.photos || []);
          state.manifest.updated = new Date().toISOString();
          var manifestText = JSON.stringify(state.manifest, null, 2) + '\n';
          return gh('/repos/' + OWNER + '/' + REPO + '/git/blobs', {
            method: 'POST',
            body: JSON.stringify({ content: utf8ToBase64(manifestText), encoding: 'base64' })
          }).then(function (manifestBlob) {
            treeEntries.push({
              path: 'gallery/index.json',
              mode: '100644',
              type: 'blob',
              sha: manifestBlob.sha
            });
            return { base: state.base, treeEntries: treeEntries, newPhotos: newPhotos };
          });
        });
      })
      .then(function (state) {
        setProgress(78, '正在把照片挂上墙…');
        return gh('/repos/' + OWNER + '/' + REPO + '/git/trees', {
          method: 'POST',
          body: JSON.stringify({ base_tree: state.base.baseTree, tree: state.treeEntries })
        }).then(function (tree) {
          return { base: state.base, tree: tree, newPhotos: state.newPhotos };
        });
      })
      .then(function (state) {
        return gh('/repos/' + OWNER + '/' + REPO + '/git/commits', {
          method: 'POST',
          body: JSON.stringify({
            message: '照片墙：新增 ' + state.newPhotos.length + ' 张照片',
            tree: state.tree.sha,
            parents: [state.base.headSha]
          })
        });
      })
      .then(function (commit) {
        return gh('/repos/' + OWNER + '/' + REPO + '/git/refs/heads/' + BRANCH, {
          method: 'PATCH',
          body: JSON.stringify({ sha: commit.sha, force: false })
        });
      })
      .then(function () {
        setProgress(100, '完成，等 GitHub Pages 更新…');
        var uploaded = prepared.length;
        prepared.forEach(function (image) {
          setItemStatus(image.origin, '已上墙', 'done');
        });

        // 成功的从待传列表里移走，失败的留着可以重试
        prepared.forEach(function (image) {
          var item = image.origin;
          var index = files.indexOf(item);
          if (index >= 0) files.splice(index, 1);
          URL.revokeObjectURL(item.url);
          if (item.card) item.card.remove();
        });

        var failedCount = files.length;
        els.successText.textContent = '已经提交 ' + uploaded + ' 张照片到 GitHub。' +
          (failedCount ? '还有 ' + failedCount + ' 张没成功，留在待传列表里可以再试。' : '') +
          ' GitHub Pages 大概需要 1 分钟构建，稍等一下照片墙就会更新。';
        els.successLink.href = 'gallery.html?v=' + Date.now();
        els.successPanel.hidden = false;
        els.previewGrid.hidden = files.length === 0;
        busy = false;
        updateReady();
        els.successPanel.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'center' });
      })
      .catch(function (err) {
        busy = false;
        setProgress(0, '');
        els.progressWrap.hidden = true;
        prepared.forEach(function (image) {
          setItemStatus(image.origin, '失败，可以重试', 'error');
        });
        showError(els.uploadError, messageFor(err));
        updateReady();
        console.warn('[upload]', err.message);
      });
  }


  /* ---------- 管理照片（删除） ---------- */
  function manageDateTime(photo) {
    var m = String((photo && photo.file) || '').match(/photo-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/);
    if (m) return m[1] + '.' + m[2] + '.' + m[3] + ' ' + m[4] + ':' + m[5];
    var date = String((photo && photo.date) || '');
    return date ? date.replace(/-/g, '.') : '';
  }

  function updateManageUI() {
    if (!els.manageDelete) return;
    var selected = managePhotos.filter(function (p) { return p.selected; }).length;
    els.manageSelected.textContent = '已选 ' + selected + ' 张';
    els.manageDelete.disabled = busy || selected === 0 || !token;
    els.manageDelete.textContent = selected ? '删除所选（' + selected + '）' : '删除所选';
    els.manageHint.textContent = selected ? '确认后提交到 GitHub。' : '选中照片后点删除。';
    els.manageGrid.querySelectorAll('input').forEach(function (cb) { cb.disabled = busy; });
    els.manageSelectAll.disabled = busy || !managePhotos.length;
    els.manageClear.disabled = busy || !managePhotos.length;
    els.manageRefresh.disabled = busy || !token;
  }

  function resetManage() {
    managePhotos = [];
    if (!els.manageBody) return;
    els.manageBody.hidden = true;
    els.manageLocked.hidden = false;
    els.manageCount.textContent = '—';
    els.manageGrid.innerHTML = '';
    els.manageEmpty.hidden = true;
    els.manageError.hidden = true;
    els.manageStatus.textContent = '';
    els.manageStatus.classList.remove('is-error');
    els.manageSelected.textContent = '已选 0 张';
    els.manageDelete.disabled = true;
    updateManageUI();
  }

  function renderManage() {
    managePhotos.forEach(function (photo) { photo.selected = false; });
    els.manageGrid.innerHTML = '';
    els.manageCount.textContent = managePhotos.length + ' 张';
    els.manageEmpty.hidden = managePhotos.length > 0;

    managePhotos.forEach(function (photo) {
      var label = document.createElement('label');
      label.className = 'manage-item';

      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.setAttribute('aria-label', '选择照片：' + (manageDateTime(photo) || photo.file));

      var img = document.createElement('img');
      img.src = 'gallery/' + encodeURIComponent(photo.file);
      img.alt = photo.caption || '照片缩略图';
      img.loading = 'lazy';
      img.decoding = 'async';

      var meta = document.createElement('span');
      meta.className = 'manage-meta';
      var time = document.createElement('time');
      time.textContent = manageDateTime(photo);
      var cap = document.createElement('span');
      cap.textContent = photo.caption || '（没有说明）';
      meta.appendChild(time);
      meta.appendChild(cap);

      label.appendChild(cb);
      label.appendChild(img);
      label.appendChild(meta);
      cb.addEventListener('change', function () {
        photo.selected = cb.checked;
        label.classList.toggle('is-selected', cb.checked);
        updateManageUI();
      });
      els.manageGrid.appendChild(label);
    });

    updateManageUI();
  }

  function loadManage() {
    if (!token) { resetManage(); return; }
    if (busy) return;
    els.manageLocked.hidden = true;
    els.manageBody.hidden = false;
    els.manageCount.textContent = '读取中…';
    els.manageError.hidden = true;
    els.manageEmpty.hidden = true;
    els.manageStatus.textContent = '正在读取照片墙…';
    els.manageStatus.classList.remove('is-error');
    els.manageGrid.innerHTML = '';
    els.manageSelected.textContent = '已选 0 张';
    els.manageDelete.disabled = true;

    gh('/repos/' + OWNER + '/' + REPO + '/contents/gallery/index.json?ref=' + encodeURIComponent(BRANCH))
      .then(function (file) {
        if (!file || !file.content) return { photos: [] };
        return JSON.parse(decodeBase64Utf8(file.content));
      })
      .then(function (data) {
        managePhotos = (Array.isArray(data && data.photos) ? data.photos : []).filter(function (p) {
          return p && typeof p.file === 'string' && p.file;
        });
        managePhotos.sort(function (a, b) {
          return String(b.file || '').localeCompare(String(a.file || ''));
        });
        renderManage();
        els.manageStatus.textContent = '';
        els.manageStatus.classList.remove('is-error');
      })
      .catch(function (err) {
        if (err.status === 404) {
          managePhotos = [];
          renderManage();
          els.manageStatus.textContent = '';
          return;
        }
        els.manageStatus.textContent = '';
        els.manageCount.textContent = '—';
        showError(els.manageError, '照片列表没加载出来：' + messageFor(err));
        console.warn('[manage]', err.message);
      });
  }

  function deleteSelected() {
    if (busy || !token) return;
    var chosen = managePhotos.filter(function (p) { return p.selected; });
    if (!chosen.length) return;
    if (!window.confirm('确定从照片墙删除这 ' + chosen.length + ' 张照片吗？\n\n会同时从仓库移除照片文件并提交到 GitHub。')) return;

    var chosenFiles = {};
    chosen.forEach(function (p) { chosenFiles[p.file] = true; });

    busy = true;
    updateReady();
    updateManageUI();
    els.manageError.hidden = true;
    els.manageStatus.textContent = '正在提交删除…';
    els.manageStatus.classList.remove('is-error');

    var headSha = '';
    var baseTree = '';

    gh('/repos/' + OWNER + '/' + REPO + '/git/ref/heads/' + BRANCH)
      .then(function (ref) {
        headSha = ref.object.sha;
        return gh('/repos/' + OWNER + '/' + REPO + '/git/commits/' + headSha);
      })
      .then(function (commit) {
        baseTree = commit.tree.sha;
        return gh('/repos/' + OWNER + '/' + REPO + '/contents/gallery/index.json?ref=' + encodeURIComponent(BRANCH));
      })
      .then(function (file) {
        if (!file || !file.content) throw new Error('照片清单读取失败，稍后再试。');
        var manifest = JSON.parse(decodeBase64Utf8(file.content));
        if (!manifest || !Array.isArray(manifest.photos)) throw new Error('照片清单格式不对。');
        manifest.photos = manifest.photos.filter(function (p) { return !chosenFiles[p.file]; });
        manifest.updated = new Date().toISOString();
        var manifestText = JSON.stringify(manifest, null, 2) + '\n';
        return gh('/repos/' + OWNER + '/' + REPO + '/git/blobs', {
          method: 'POST',
          body: JSON.stringify({ content: utf8ToBase64(manifestText), encoding: 'base64' })
        }).then(function (blob) {
          var entries = [{
            path: 'gallery/index.json',
            mode: '100644',
            type: 'blob',
            sha: blob.sha
          }];
          chosen.forEach(function (p) {
            entries.push({
              path: 'gallery/' + p.file,
              mode: '100644',
              type: 'blob',
              sha: null
            });
          });
          return gh('/repos/' + OWNER + '/' + REPO + '/git/trees', {
            method: 'POST',
            body: JSON.stringify({ base_tree: baseTree, tree: entries })
          });
        });
      })
      .then(function (tree) {
        return gh('/repos/' + OWNER + '/' + REPO + '/git/commits', {
          method: 'POST',
          body: JSON.stringify({
            message: '照片墙：删除 ' + chosen.length + ' 张照片',
            tree: tree.sha,
            parents: [headSha]
          })
        });
      })
      .then(function (commit) {
        return gh('/repos/' + OWNER + '/' + REPO + '/git/refs/heads/' + BRANCH, {
          method: 'PATCH',
          body: JSON.stringify({ sha: commit.sha, force: false })
        });
      })
      .then(function () {
        managePhotos = managePhotos.filter(function (p) { return !chosenFiles[p.file]; });
        busy = false;
        updateReady();
        renderManage();
        els.manageStatus.textContent = '已删除 ' + chosen.length + ' 张照片。GitHub Pages 大约 1 分钟后更新，稍后刷新照片墙就能看到。';
        els.manageStatus.classList.remove('is-error');
        els.manageError.hidden = true;
      })
      .catch(function (err) {
        busy = false;
        updateReady();
        updateManageUI();
        els.manageStatus.textContent = '删除失败：' + messageFor(err);
        els.manageStatus.classList.add('is-error');
        console.warn('[manage]', err.message);
      });
  }

  els.manageSelectAll.addEventListener('click', function () {
    if (busy) return;
    managePhotos.forEach(function (p) { p.selected = true; });
    els.manageGrid.querySelectorAll('.manage-item').forEach(function (label) {
      label.classList.add('is-selected');
      var cb = label.querySelector('input');
      if (cb) cb.checked = true;
    });
    updateManageUI();
  });

  els.manageClear.addEventListener('click', function () {
    if (busy) return;
    managePhotos.forEach(function (p) { p.selected = false; });
    els.manageGrid.querySelectorAll('.manage-item').forEach(function (label) {
      label.classList.remove('is-selected');
      var cb = label.querySelector('input');
      if (cb) cb.checked = false;
    });
    updateManageUI();
  });

  els.manageRefresh.addEventListener('click', function () {
    if (!busy) loadManage();
  });

  els.manageConnect.addEventListener('click', function () {
    els.tokenInput.focus();
    els.tokenInput.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'center' });
  });

  els.manageDelete.addEventListener('click', deleteSelected);

  els.uploadBtn.addEventListener('click', upload);

  /* ---------- 初始化 ---------- */
  (function initToken() {
    var stored = getStoredToken();
    if (!stored) {
      setTokenState('未连接', '');
      els.remember.checked = false;
      resetManage();
      updateReady();
      return;
    }
    els.tokenInput.value = stored;
    els.remember.checked = wasRemembered();
    setTokenState('验证中…', 'is-wait');
    verifyToken(true);
    updateReady();
  })();
})();
