
(function () {
  const input = document.querySelector('[data-search-input]');
  const results = document.querySelector('[data-search-results]');
  const counter = document.querySelector('[data-search-count]');
  const region = document.querySelector('[data-filter-region]');
  const type = document.querySelector('[data-filter-type]');
  const genre = document.querySelector('[data-filter-genre]');
  const sort = document.querySelector('[data-sort]');
  if (!input || !results || !window.SITE_INDEX) return;
  const all = window.SITE_INDEX.slice();

  function textOf(item) {
    return [item.title, item.region, item.type, item.genre, item.oneLine, (item.tags || []).join(' ')].join(' ').toLowerCase();
  }

  function ok(item) {
    const q = input.value.trim().toLowerCase();
    const r = region && region.value !== '全部' ? region.value : '';
    const t = type && type.value !== '全部' ? type.value : '';
    const g = genre && genre.value !== '全部' ? genre.value : '';
    const text = textOf(item);
    return (!q || text.includes(q)) && (!r || item.region === r) && (!t || item.type === t) && (!g || (item.genre || '').includes(g) || (item.tags || []).some(x => x.includes(g)));
  }

  function ordered(items) {
    const arr = items.slice();
    switch ((sort && sort.value) || '综合') {
      case '年份新→旧': arr.sort((a, b) => (b.year || 0) - (a.year || 0)); break;
      case '年份旧→新': arr.sort((a, b) => (a.year || 0) - (b.year || 0)); break;
      case '标题A→Z': arr.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN')); break;
      default: arr.sort((a, b) => (b.score || 0) - (a.score || 0));
    }
    return arr;
  }

  function render() {
    const matched = all.filter(ok);
    if (counter) counter.textContent = `共找到 ${matched.length} 部`;
    const items = ordered(matched).slice(0, 200);
    if (!items.length) {
      results.innerHTML = '<div class="empty-state">没有找到匹配的影片，请换一个关键词再试。</div>';
      return;
    }
    results.innerHTML = items.map(item => {
      const tags = (item.tags || []).slice(0, 3).map(t => `<span class="chip">${t}</span>`).join('');
      return `
        <a class="result-card" href="${item.url}">
          <div class="result-card__poster poster" style="--hue:${item.score % 360}">
            <img src="${item.cover}" alt="${item.title}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.classList.add('show')">
            <div class="poster-fallback show">
              <div class="poster-fallback__kicker">搜索结果</div>
              <div class="poster-fallback__title">${item.title}</div>
              <div class="poster-fallback__summary">${item.oneLine || ''}</div>
              <div class="poster-fallback__badges">${tags}</div>
            </div>
          </div>
          <div class="result-card__body">
            <div class="result-card__meta">${item.region} · ${item.type} · ${item.year || ''}</div>
            <h3>${item.title}</h3>
            <p>${item.oneLine || ''}</p>
            <div class="result-card__tags">${tags}</div>
          </div>
        </a>`;
    }).join('');
  }

  [input, region, type, genre, sort].forEach(el => {
    if (el) {
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    }
  });
  render();
})();
