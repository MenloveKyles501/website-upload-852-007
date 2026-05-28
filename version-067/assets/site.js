(function () {
  var root = document.body ? (document.body.getAttribute('data-root') || './') : './';

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function initMenu() {
    var button = $('.menu-toggle');
    var panel = $('[data-mobile-panel]');
    if (!button || !panel) return;
    button.addEventListener('click', function () {
      var open = !panel.classList.contains('is-open');
      panel.classList.toggle('is-open', open);
      button.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function initHero() {
    var hero = $('[data-hero]');
    if (!hero) return;
    var slides = $all('[data-hero-slide]', hero);
    var dots = $all('[data-hero-dot]', hero);
    if (!slides.length) return;
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    start();
  }

  function initImageErrors() {
    document.addEventListener('error', function (event) {
      var target = event.target;
      if (target && target.tagName === 'IMG') {
        target.remove();
      }
    }, true);
  }

  function initCardFilters() {
    var input = $('[data-card-filter]');
    var year = $('[data-year-filter]');
    var cards = $all('[data-card]');
    var empty = $('[data-empty-state]');
    if (!cards.length || (!input && !year)) return;

    function apply() {
      var term = normalize(input ? input.value : '');
      var selectedYear = year ? year.value : '';
      var visible = 0;
      cards.forEach(function (card) {
        var text = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-type'),
          card.getAttribute('data-genre'),
          card.getAttribute('data-year')
        ].join(' '));
        var cardYear = card.getAttribute('data-year') || '';
        var ok = (!term || text.indexOf(term) !== -1) && (!selectedYear || cardYear === selectedYear);
        card.style.display = ok ? '' : 'none';
        if (ok) visible += 1;
      });
      if (empty) empty.classList.toggle('is-visible', visible === 0);
    }

    if (input) input.addEventListener('input', apply);
    if (year) year.addEventListener('change', apply);
    apply();
  }

  function cardHtml(item) {
    var title = escapeHtml(item.title || '');
    var meta = [item.year, item.type, item.region].filter(Boolean).map(escapeHtml).join('</span><span>');
    return '' +
      '<a href="' + root + 'movie/' + item.id + '.html" class="movie-card group" data-card>' +
      '<div class="cover-frame">' +
      '<img src="' + root + escapeHtml(item.cover || '') + '" alt="' + title + '" loading="lazy">' +
      '<span class="cover-name">' + title + '</span>' +
      '<span class="region-badge">' + escapeHtml(item.region || '') + '</span>' +
      '<span class="play-hover">▶</span>' +
      '</div>' +
      '<div class="movie-card-body">' +
      '<h3>' + title + '</h3>' +
      '<p>' + escapeHtml(item.oneLine || '') + '</p>' +
      '<div class="movie-meta"><span>' + meta + '</span></div>' +
      '</div>' +
      '</a>';
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initSearchPage() {
    var results = $('[data-search-results]');
    var input = $('[data-search-page-input]');
    var status = $('[data-search-status]');
    var empty = $('[data-search-empty]');
    if (!results || !input) return;
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    input.value = query;

    fetch(root + 'assets/search-index.json')
      .then(function (response) { return response.json(); })
      .then(function (items) {
        function run() {
          var term = normalize(input.value);
          var filtered = items.filter(function (item) {
            var text = normalize([
              item.title,
              item.region,
              item.type,
              item.year,
              item.genre,
              (item.tags || []).join(' ')
            ].join(' '));
            return !term || text.indexOf(term) !== -1;
          }).slice(0, 120);
          if (term) {
            status.textContent = '搜索：' + input.value;
          } else {
            status.textContent = '精选内容';
          }
          results.innerHTML = filtered.map(cardHtml).join('');
          if (empty) empty.classList.toggle('is-visible', filtered.length === 0);
        }
        input.addEventListener('input', run);
        run();
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMenu();
    initHero();
    initImageErrors();
    initCardFilters();
    initSearchPage();
  });
})();
