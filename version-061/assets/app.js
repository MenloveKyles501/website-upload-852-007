(function () {
  function all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function one(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function text(value) {
    return String(value == null ? "" : value).toLowerCase();
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initMenu() {
    var button = one(".menu-toggle");
    var panel = one(".mobile-panel");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      var expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      panel.hidden = expanded;
    });
  }

  function initHeroSlider() {
    var slider = one("[data-slider]");
    if (!slider) {
      return;
    }
    var slides = all(".hero-slide", slider);
    var dots = all("[data-slider-dot]", slider);
    var prev = one("[data-slider-prev]", slider);
    var next = one("[data-slider-next]", slider);
    var active = 0;
    var timer = null;

    function show(index) {
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("hero-slide-active", slideIndex === active);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === active);
      });
    }

    function play() {
      stop();
      timer = window.setInterval(function () {
        show(active + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(active - 1);
        play();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(active + 1);
        play();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-slider-dot") || 0));
        play();
      });
    });

    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", play);
    show(0);
    play();
  }

  function initCardFilters() {
    all(".card-filter").forEach(function (input) {
      var section = input.closest(".content-section") || document;
      var cards = all(".movie-card, .rank-item", section);
      input.addEventListener("input", function () {
        var query = text(input.value).trim();
        cards.forEach(function (card) {
          var haystack = text([
            card.getAttribute("data-title"),
            card.getAttribute("data-tags"),
            card.getAttribute("data-year"),
            card.getAttribute("data-region"),
            card.getAttribute("data-category")
          ].join(" "));
          card.classList.toggle("is-hidden", query && haystack.indexOf(query) === -1);
        });
      });
    });
  }

  function initPlayers() {
    all(".player-shell").forEach(function (shell) {
      var video = one("video", shell);
      var button = one(".video-play", shell);
      var source = shell.getAttribute("data-stream");
      var initialized = false;
      var starting = false;

      function start() {
        if (!video || !source || starting) {
          return;
        }
        starting = true;
        shell.setAttribute("data-ready", "true");
        video.setAttribute("controls", "controls");

        function playVideo() {
          var promise = video.play();
          if (promise && promise.catch) {
            promise.catch(function () {
              shell.removeAttribute("data-ready");
            });
          }
          starting = false;
        }

        if (!initialized) {
          initialized = true;
          if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({
              autoStartLoad: true,
              enableWorker: true,
              lowLatencyMode: true
            });
            hls.loadSource(source);
            hls.attachMedia(video);
            video._hls = hls;
            hls.on(window.Hls.Events.MANIFEST_PARSED, playVideo);
            hls.on(window.Hls.Events.ERROR, function (eventName, data) {
              if (data && data.fatal) {
                if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                  hls.startLoad();
                } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                  hls.recoverMediaError();
                } else {
                  hls.destroy();
                }
              }
            });
          } else {
            video.src = source;
            video.addEventListener("loadedmetadata", playVideo, { once: true });
            video.load();
          }
        } else {
          playVideo();
        }
      }

      if (button) {
        button.addEventListener("click", function (event) {
          event.preventDefault();
          event.stopPropagation();
          start();
        });
      }

      shell.addEventListener("click", function (event) {
        if (event.target && event.target.closest && event.target.closest("button")) {
          return;
        }
        if (video && !video.paused && event.target === video) {
          return;
        }
        start();
      });
    });
  }

  function renderSearchCard(item) {
    var tags = (item.tags || []).slice(0, 3).map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");
    return "" +
      "<article class=\"movie-card\" data-title=\"" + escapeHtml(item.title) + "\" data-tags=\"" + escapeHtml((item.tags || []).join(" ")) + "\" data-year=\"" + escapeHtml(item.year) + "\" data-region=\"" + escapeHtml(item.region) + "\" data-category=\"" + escapeHtml(item.category) + "\">" +
      "<a class=\"poster-link\" href=\"" + escapeHtml(item.url) + "\" aria-label=\"" + escapeHtml(item.title) + "\">" +
      "<img src=\"" + escapeHtml(item.image) + "\" alt=\"" + escapeHtml(item.title) + "\" loading=\"lazy\">" +
      "<span class=\"play-badge\">播放</span>" +
      "</a>" +
      "<div class=\"movie-card-body\">" +
      "<div class=\"movie-meta-line\"><span>" + escapeHtml(item.year) + "</span><span>" + escapeHtml(item.region) + "</span><span>" + escapeHtml(item.type) + "</span></div>" +
      "<h3><a href=\"" + escapeHtml(item.url) + "\">" + escapeHtml(item.title) + "</a></h3>" +
      "<p>" + escapeHtml(item.oneLine) + "</p>" +
      "<div class=\"tag-row\">" + tags + "</div>" +
      "</div>" +
      "</article>";
  }

  function initSearchPage() {
    var container = one("#search-results");
    if (!container || !window.SEARCH_INDEX) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var query = (params.get("q") || "").trim();
    var input = one("#search-page-input");
    var title = one("#search-title");
    var subtitle = one("#search-subtitle");
    if (input) {
      input.value = query;
    }
    var source = window.SEARCH_INDEX;
    var result = source;
    if (query) {
      var q = text(query);
      result = source.filter(function (item) {
        return text([
          item.title,
          item.oneLine,
          item.region,
          item.type,
          item.year,
          item.genre,
          item.category,
          (item.tags || []).join(" ")
        ].join(" ")).indexOf(q) !== -1;
      });
    } else {
      result = source.slice(0, 60);
    }
    if (title) {
      title.textContent = query ? "“" + query + "”相关影片" : "推荐影片";
    }
    if (subtitle) {
      subtitle.textContent = query ? "已根据关键词匹配片名、标签、简介和分类。" : "可在上方输入关键词继续搜索。";
    }
    if (result.length === 0) {
      container.innerHTML = "<div class=\"empty-state\">没有找到相关影片，请尝试其他关键词。</div>";
    } else {
      container.innerHTML = result.map(renderSearchCard).join("");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMenu();
    initHeroSlider();
    initCardFilters();
    initPlayers();
    initSearchPage();
  });
})();
