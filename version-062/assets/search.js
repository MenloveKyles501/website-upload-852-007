
(function(){
  const data = window.MOVIE_INDEX || [];
  const input = document.getElementById('searchInput');
  const form = document.getElementById('searchForm');
  const results = document.getElementById('searchResults');
  const meta = document.getElementById('searchMeta');
  const pager = document.getElementById('searchPager');
  const quick = document.getElementById('quickFilters');
  if (!results || !meta || !pager) return;

  const pageSize = 24;
  const params = new URLSearchParams(location.search);
  input && (input.value = params.get('q') || '');
  let currentPage = 1;
  let currentQuery = (params.get('q') || '').trim();

  function card(item){
    return `
    <a href="${item.detailHref}" class="group overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(15,23,42,.08)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div class="poster-frame h-72 bg-gray-100">
        <img src="${item.poster}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
        <div class="absolute top-3 left-3 flex gap-2 text-xs text-white">
          <span class="px-2 py-1 rounded-full bg-black/35 backdrop-blur-sm">${item.region}</span>
          <span class="px-2 py-1 rounded-full bg-black/35 backdrop-blur-sm">${item.type}</span>
        </div>
        <div class="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 class="font-bold text-lg leading-tight line-clamp-1">${item.title}</h3>
          <p class="text-sm text-amber-200 mt-1">${item.year} · ${item.genre}</p>
        </div>
      </div>
      <div class="p-4">
        <p class="text-sm text-gray-600 line-clamp-2 leading-relaxed">${item.oneLine}</p>
        <div class="flex flex-wrap gap-2 mt-3">${item.tags.slice(0,3).map(t => `<span class="text-[11px] bg-white/70 text-amber-800 px-2 py-1 rounded-full">${t}</span>`).join('')}</div>
      </div>
    </a>`;
  }

  function score(item, query){
    if (!query) return 1;
    const q = query.toLowerCase();
    const hay = [item.title, item.region, item.type, item.genre, item.oneLine, item.summary, item.review, item.tags.join(' ')].join(' ').toLowerCase();
    return hay.includes(q) ? 1 : 0;
  }

  function filterData(){
    const q = currentQuery;
    return data.filter(item => {
      if (!q) return true;
      const lower = q.toLowerCase();
      const hay = [item.title, item.region, item.type, item.genre, item.oneLine, item.summary, item.review, item.tags.join(' '), String(item.year), item.rank].join(' ').toLowerCase();
      return hay.includes(lower);
    });
  }

  function render(){
    let list = filterData();
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * pageSize;
    const pageItems = list.slice(start, start + pageSize);
    results.innerHTML = pageItems.map(card).join('') || '<div class="col-span-full rounded-2xl bg-white p-8 text-center text-gray-500 soft-card">未找到匹配结果，请尝试其他关键词。</div>';
    meta.textContent = `共 ${total} 条结果 · 第 ${currentPage} / ${totalPages} 页`;
    if (totalPages <= 1) { pager.innerHTML = ''; return; }
    const prev = currentPage <= 1 ? '<span class="px-3 py-2 rounded-lg border border-gray-300 text-gray-400">上一页</span>' : `<button data-page="${currentPage - 1}" class="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">上一页</button>`;
    const next = currentPage >= totalPages ? '<span class="px-3 py-2 rounded-lg border border-gray-300 text-gray-400">下一页</span>' : `<button data-page="${currentPage + 1}" class="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">下一页</button>`;
    const nums = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) nums.push(i);
    } else if (currentPage <= 3) {
      nums.push(1,2,3,4,'…',totalPages);
    } else if (currentPage >= totalPages - 2) {
      nums.push(1,'…',totalPages-3,totalPages-2,totalPages-1,totalPages);
    } else {
      nums.push(1,'…',currentPage-1,currentPage,currentPage+1,'…',totalPages);
    }
    pager.innerHTML = `<div class="flex flex-wrap justify-center items-center gap-2 mt-12">${prev}${nums.map(n => n==='…' ? '<span class="px-3 py-2">…</span>' : (n===currentPage ? `<span class="px-4 py-2 rounded-lg font-medium bg-amber-600 text-white">${n}</span>` : `<button data-page="${n}" class="px-4 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-50">${n}</button>`)).join('')}${next}</div>`;
  }

  form && form.addEventListener('submit', e => {
    e.preventDefault();
    currentQuery = (input.value || '').trim();
    currentPage = 1;
    const sp = new URLSearchParams(location.search);
    if (currentQuery) sp.set('q', currentQuery); else sp.delete('q');
    history.replaceState({}, '', `${location.pathname}${sp.toString() ? '?' + sp.toString() : ''}`);
    render();
  });

  quick && quick.addEventListener('click', e => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    const term = btn.getAttribute('data-filter') || '';
    currentQuery = term;
    if (input) input.value = term;
    currentPage = 1;
    const sp = new URLSearchParams(location.search);
    if (term) sp.set('q', term); else sp.delete('q');
    history.replaceState({}, '', `${location.pathname}${sp.toString() ? '?' + sp.toString() : ''}`);
    render();
  });

  pager.addEventListener('click', e => {
    const btn = e.target.closest('button[data-page]');
    if (!btn) return;
    currentPage = parseInt(btn.getAttribute('data-page'), 10) || 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    render();
  });

  render();
})();
