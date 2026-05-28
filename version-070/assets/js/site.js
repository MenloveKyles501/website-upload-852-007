(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function initMobileMenu() {
    var button = document.querySelector('[data-mobile-toggle]');
    var menu = document.querySelector('[data-mobile-menu]');
    if (!button || !menu) {
      return;
    }
    button.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  function initCurrentYear() {
    var nodes = document.querySelectorAll('[data-current-year]');
    var year = new Date().getFullYear();
    nodes.forEach(function (node) {
      node.textContent = String(year);
    });
  }

  function initHeroCarousel() {
    var root = document.querySelector('[data-hero-carousel]');
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-hero-dot]'));
    if (slides.length <= 1) {
      return;
    }
    var current = 0;
    var timer = null;

    function activate(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        activate(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        activate(index);
        start();
      });
    });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    activate(0);
    start();
  }

  function initFilters() {
    var scopes = document.querySelectorAll('[data-filter-scope]');
    var params = new URLSearchParams(window.location.search);
    scopes.forEach(function (scope) {
      var search = scope.querySelector('[data-filter-search]');
      if (search && !search.value && params.get('q')) {
        search.value = params.get('q');
      }
      var year = scope.querySelector('[data-filter-year]');
      var kind = scope.querySelector('[data-filter-kind]');
      var genre = scope.querySelector('[data-filter-genre]');
      var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-movie-card]'));
      var count = scope.querySelector('[data-result-count]');
      var empty = scope.querySelector('[data-empty-state]');

      function apply() {
        var query = search ? search.value.trim().toLowerCase() : '';
        var selectedYear = year ? year.value : '';
        var selectedKind = kind ? kind.value : '';
        var selectedGenre = genre ? genre.value : '';
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = [
            card.dataset.title,
            card.dataset.region,
            card.dataset.type,
            card.dataset.kind,
            card.dataset.year,
            card.dataset.genre,
            card.dataset.tags
          ].join(' ').toLowerCase();
          var matchesQuery = !query || haystack.indexOf(query) !== -1;
          var matchesYear = !selectedYear || card.dataset.year === selectedYear;
          var matchesKind = !selectedKind || card.dataset.kind === selectedKind;
          var matchesGenre = !selectedGenre || (card.dataset.genre || '').indexOf(selectedGenre) !== -1;
          var show = matchesQuery && matchesYear && matchesKind && matchesGenre;
          card.classList.toggle('is-hidden', !show);
          if (show) {
            visible += 1;
          }
        });

        if (count) {
          count.textContent = String(visible);
        }
        if (empty) {
          empty.hidden = visible !== 0;
        }
      }

      [search, year, kind, genre].forEach(function (control) {
        if (control) {
          control.addEventListener('input', apply);
          control.addEventListener('change', apply);
        }
      });
      apply();
    });
  }

  function attachHls(video, src, errorNode) {
    if (!src) {
      if (errorNode) {
        errorNode.hidden = false;
        errorNode.textContent = '播放源暂时不可用';
      }
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.ERROR, function (event, data) {
        if (!data || !data.fatal) {
          return;
        }
        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          hls.destroy();
          if (errorNode) {
            errorNode.hidden = false;
            errorNode.textContent = '视频加载失败，请刷新页面后重试';
          }
        }
      });
      video._hlsInstance = hls;
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return;
    }

    if (errorNode) {
      errorNode.hidden = false;
      errorNode.textContent = '当前浏览器不支持 HLS 播放';
    }
  }

  function initPlayers() {
    var players = document.querySelectorAll('[data-video-player]');
    players.forEach(function (player) {
      var video = player.querySelector('video');
      var bigButton = player.querySelector('[data-player-toggle]');
      var playButton = player.querySelector('[data-player-play]');
      var muteButton = player.querySelector('[data-player-mute]');
      var fullscreenButton = player.querySelector('[data-player-fullscreen]');
      var errorNode = player.querySelector('[data-player-error]');
      var src = player.getAttribute('data-hls-src');

      if (!video) {
        return;
      }

      attachHls(video, src, errorNode);

      function updateState() {
        var isPlaying = !video.paused && !video.ended;
        player.classList.toggle('is-playing', isPlaying);
        if (playButton) {
          playButton.textContent = isPlaying ? '暂停' : '播放';
        }
        if (bigButton) {
          bigButton.textContent = isPlaying ? '❚❚' : '▶';
        }
        if (muteButton) {
          muteButton.textContent = video.muted ? '取消静音' : '静音';
        }
      }

      function togglePlay() {
        if (video.paused || video.ended) {
          var promise = video.play();
          if (promise && typeof promise.catch === 'function') {
            promise.catch(function () {
              if (errorNode) {
                errorNode.hidden = false;
                errorNode.textContent = '浏览器阻止了自动播放，请再次点击播放';
              }
            });
          }
        } else {
          video.pause();
        }
      }

      if (bigButton) {
        bigButton.addEventListener('click', togglePlay);
      }
      if (playButton) {
        playButton.addEventListener('click', togglePlay);
      }
      if (muteButton) {
        muteButton.addEventListener('click', function () {
          video.muted = !video.muted;
          updateState();
        });
      }
      if (fullscreenButton) {
        fullscreenButton.addEventListener('click', function () {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else if (player.requestFullscreen) {
            player.requestFullscreen();
          }
        });
      }

      video.addEventListener('click', togglePlay);
      video.addEventListener('play', updateState);
      video.addEventListener('pause', updateState);
      video.addEventListener('ended', updateState);
      video.addEventListener('volumechange', updateState);
      updateState();
    });
  }

  ready(function () {
    initMobileMenu();
    initCurrentYear();
    initHeroCarousel();
    initFilters();
    initPlayers();
  });
})();
