(function () {
  function select(selector, root) {
    return (root || document).querySelector(selector);
  }

  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return (value || "").toString().trim().toLowerCase();
  }

  function setupNavigation() {
    var toggle = select("[data-nav-toggle]");
    var panel = select("[data-mobile-panel]");

    if (!toggle || !panel) {
      return;
    }

    toggle.addEventListener("click", function () {
      panel.classList.toggle("open");
    });
  }

  function setupSearchForms() {
    selectAll("[data-site-search]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = select("input[name='q']", form);
        var value = input ? input.value.trim() : "";
        var target = "./search.html";

        if (value) {
          target += "?q=" + encodeURIComponent(value);
        }

        window.location.href = target;
      });
    });
  }

  function setupHeroCarousel() {
    var carousel = select("[data-hero-carousel]");

    if (!carousel) {
      return;
    }

    var slides = selectAll("[data-hero-slide]", carousel);
    var dots = selectAll("[data-hero-dot]", carousel);
    var prev = select("[data-hero-prev]", carousel);
    var next = select("[data-hero-next]", carousel);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === index);
      });
    }

    function play() {
      clearInterval(timer);
      timer = setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        play();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        play();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(parseInt(dot.getAttribute("data-hero-dot"), 10));
        play();
      });
    });

    show(0);
    play();
  }

  function setupFilters() {
    var cards = selectAll("[data-movie-card]");

    if (!cards.length) {
      return;
    }

    var keyword = select("[data-filter-keyword]");
    var year = select("[data-filter-year]");
    var region = select("[data-filter-region]");
    var category = select("[data-filter-category]");
    var status = select("[data-filter-status]");
    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";

    if (keyword && initial) {
      keyword.value = initial;
    }

    function apply() {
      var q = normalize(keyword && keyword.value);
      var y = normalize(year && year.value);
      var r = normalize(region && region.value);
      var c = normalize(category && category.value);
      var matched = false;

      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-tags"),
          card.getAttribute("data-year"),
          card.getAttribute("data-region"),
          card.getAttribute("data-type"),
          card.getAttribute("data-category"),
          card.textContent
        ].join(" "));
        var ok = true;

        if (q && haystack.indexOf(q) === -1) {
          ok = false;
        }

        if (y && normalize(card.getAttribute("data-year")).indexOf(y) === -1) {
          ok = false;
        }

        if (r && normalize(card.getAttribute("data-region")).indexOf(r) === -1) {
          ok = false;
        }

        if (c && normalize(card.getAttribute("data-category")) !== c) {
          ok = false;
        }

        card.style.display = ok ? "" : "none";
        matched = matched || ok;
      });

      if (status) {
        status.textContent = matched ? "已匹配相关影片" : "未匹配到相关影片";
      }
    }

    [keyword, year, region, category].forEach(function (field) {
      if (field) {
        field.addEventListener("input", apply);
        field.addEventListener("change", apply);
      }
    });

    apply();
  }

  window.setupMoviePlayer = function (streamUrl) {
    var shell = select("[data-player]");

    if (!shell || !streamUrl) {
      return;
    }

    var video = select("video", shell);
    var button = select("[data-play]", shell);
    var started = false;
    var hls = null;

    function start() {
      if (!video) {
        return;
      }

      if (!started) {
        started = true;

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({ enableWorker: true });
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
        } else {
          video.src = streamUrl;
        }
      }

      shell.classList.add("is-playing");
      var playTask = video.play();

      if (playTask && typeof playTask.catch === "function") {
        playTask.catch(function () {});
      }
    }

    if (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        start();
      });
    }

    shell.addEventListener("click", function (event) {
      if (!started && event.target !== video) {
        start();
      }
    });

    window.addEventListener("pagehide", function () {
      if (hls && typeof hls.destroy === "function") {
        hls.destroy();
      }
    });
  };

  document.addEventListener("DOMContentLoaded", function () {
    setupNavigation();
    setupSearchForms();
    setupHeroCarousel();
    setupFilters();
  });
})();
