(function () {
  function ready(callback) {
    if (document.readyState !== 'loading') {
      callback();
      return;
    }
    document.addEventListener('DOMContentLoaded', callback);
  }

  function text(value) {
    return (value || '').toString().toLowerCase().trim();
  }

  function setupNavigation() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.querySelector('[data-main-nav]');
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  function setupHero() {
    var slider = document.querySelector('[data-hero-slider]');
    if (!slider) {
      return;
    }
    var slides = Array.prototype.slice.call(slider.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
    var prev = slider.querySelector('[data-hero-prev]');
    var next = slider.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });
    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        start();
      });
    }
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function setupSearchRedirect() {
    document.querySelectorAll('[data-search-form]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var input = form.querySelector('input[name="q"]');
        var q = input ? input.value.trim() : '';
        var target = form.getAttribute('action') || 'search.html';
        window.location.href = target + (q ? '?q=' + encodeURIComponent(q) : '');
      });
    });
  }

  function setupDomFilter() {
    var input = document.querySelector('[data-filter-input]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.movie-card[data-search]'));
    if (!input || cards.length === 0) {
      return;
    }
    var selects = Array.prototype.slice.call(document.querySelectorAll('[data-filter-select]'));
    var count = document.querySelector('[data-filter-count]');

    function apply() {
      var query = text(input.value);
      var filters = {};
      selects.forEach(function (select) {
        filters[select.getAttribute('data-filter-select')] = select.value;
      });
      var visible = 0;
      cards.forEach(function (card) {
        var match = true;
        if (query && text(card.getAttribute('data-search')).indexOf(query) === -1) {
          match = false;
        }
        Object.keys(filters).forEach(function (key) {
          if (!filters[key]) {
            return;
          }
          if ((card.getAttribute('data-' + key) || '') !== filters[key]) {
            match = false;
          }
        });
        card.style.display = match ? '' : 'none';
        if (match) {
          visible += 1;
        }
      });
      if (count) {
        count.textContent = visible + ' 部';
      }
    }

    input.addEventListener('input', apply);
    selects.forEach(function (select) {
      select.addEventListener('change', apply);
    });
    apply();
  }

  function movieCardHtml(movie) {
    var badges = [movie.typeGroup, movie.regionGroup, movie.year].filter(Boolean).slice(0, 3).map(function (item) {
      return '<span>' + escapeHtml(item) + '</span>';
    }).join('');
    return [
      '<article class="movie-card" data-search="">',
      '  <a class="poster-frame" href="' + escapeAttr(movie.url) + '">',
      '    <img src="' + escapeAttr(movie.cover) + '" alt="' + escapeAttr(movie.title) + '" loading="lazy">',
      '    <span class="poster-play">播放</span>',
      '  </a>',
      '  <div class="movie-card-body">',
      '    <div class="badges">' + badges + '</div>',
      '    <h3><a href="' + escapeAttr(movie.url) + '">' + escapeHtml(movie.title) + '</a></h3>',
      '    <p class="movie-meta">' + escapeHtml(movie.region) + ' · ' + escapeHtml(movie.type) + ' · ' + escapeHtml(movie.year) + '</p>',
      '    <p class="movie-desc">' + escapeHtml(movie.oneLine || '') + '</p>',
      '  </div>',
      '</article>'
    ].join('\n');
  }

  function setupSearchPage() {
    var form = document.querySelector('[data-search-page-form]');
    var input = document.querySelector('[data-search-page-input]');
    var results = document.querySelector('[data-search-results]');
    var summary = document.querySelector('[data-search-summary]');
    if (!form || !input || !results || !window.MOVIES) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    input.value = params.get('q') || '';

    function render() {
      var query = text(input.value);
      var list = window.MOVIES.filter(function (movie) {
        if (!query) {
          return true;
        }
        return text(movie.search).indexOf(query) !== -1;
      });
      var display = list.slice(0, query ? 240 : 96);
      results.innerHTML = display.map(movieCardHtml).join('\n');
      if (summary) {
        summary.textContent = query
          ? '找到 ' + list.length + ' 部相关内容，当前显示前 ' + display.length + ' 部。'
          : '当前展示推荐内容 ' + display.length + ' 部，可输入关键词搜索全部片库。';
      }
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var q = input.value.trim();
      var url = q ? 'search.html?q=' + encodeURIComponent(q) : 'search.html';
      window.history.replaceState(null, '', url);
      render();
    });
    input.addEventListener('input', render);
    render();
  }

  function setupPlayers() {
    document.querySelectorAll('[data-video-src]').forEach(function (shell) {
      var video = shell.querySelector('video');
      var button = shell.querySelector('.play-layer');
      var message = shell.querySelector('[data-player-message]');
      var source = shell.getAttribute('data-video-src');
      var hlsInstance = null;

      function setMessage(value) {
        if (message) {
          message.textContent = value || '';
        }
      }

      function playVideo() {
        setMessage('');
        shell.classList.add('is-playing');
        if (!video || !source) {
          setMessage('未找到可用播放源。');
          return;
        }
        if (shell.getAttribute('data-loaded') === '1') {
          video.play().catch(function () {
            setMessage('浏览器阻止了自动播放，请再次点击视频播放按钮。');
          });
          return;
        }
        shell.setAttribute('data-loaded', '1');

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {
              setMessage('播放源已加载，请点击视频控件开始播放。');
            });
          });
          hlsInstance.on(window.Hls.Events.ERROR, function (_, data) {
            if (data && data.fatal) {
              setMessage('当前线路加载失败，请稍后重试或更换浏览器。');
              if (hlsInstance) {
                hlsInstance.destroy();
                hlsInstance = null;
              }
            }
          });
          return;
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          video.addEventListener('loadedmetadata', function () {
            video.play().catch(function () {
              setMessage('播放源已加载，请点击视频控件开始播放。');
            });
          }, { once: true });
          return;
        }

        setMessage('当前浏览器不支持此播放线路，请更换浏览器后重试。');
      }

      if (button) {
        button.addEventListener('click', playVideo);
      }
      video.addEventListener('play', function () {
        shell.classList.add('is-playing');
      });
    });
  }

  function escapeHtml(value) {
    return (value || '').toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
  }

  ready(function () {
    setupNavigation();
    setupHero();
    setupSearchRedirect();
    setupDomFilter();
    setupSearchPage();
    setupPlayers();
  });
})();
