// ── ROUTER SETUP ──────────────────────────────────────────────────────────────
Router.define('/', () => renderHome());
Router.define('/articles', (params) => renderArticles(params));
Router.define('/article/:slug', (params, { slug }) => renderArticle(slug));
Router.define('/about', () => renderAbout());

// ── SEARCH ────────────────────────────────────────────────────────────────────
let searchTimer = null;

document.getElementById('searchToggle').addEventListener('click', () => {
  document.getElementById('searchOverlay').classList.add('open');
  document.getElementById('searchInput').focus();
});

document.getElementById('searchClose').addEventListener('click', closeSearch);

document.getElementById('searchOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeSearch();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSearch();
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('searchOverlay').classList.add('open');
    document.getElementById('searchInput').focus();
  }
});

function closeSearch() {
  document.getElementById('searchOverlay').classList.remove('open');
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').innerHTML = '';
}

document.getElementById('searchInput').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  const q = e.target.value.trim();
  if (!q) { document.getElementById('searchResults').innerHTML = ''; return; }

  searchTimer = setTimeout(async () => {
    try {
      const res = await api.getArticles({ search: q, limit: 6 });
      const articles = res.articles || [];
      const container = document.getElementById('searchResults');

      if (!articles.length) {
        container.innerHTML = `<div style="padding:20px 20px;color:var(--ink-4);font-size:14px">No results for "${q}"</div>`;
        return;
      }

      container.innerHTML = articles.map(a => `
        <div class="search-result-item" onclick="selectSearchResult('${a.slug}')">
          <img class="search-result-img" src="${a.cover_image || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=120&q=60'}" alt="">
          <div>
            <div class="search-result-title">${a.title}</div>
            <div class="search-result-excerpt">${a.excerpt || ''}</div>
          </div>
        </div>
      `).join('');
    } catch (_) {}
  }, 300);
});

function selectSearchResult(slug) {
  closeSearch();
  Router.navigate(`/article/${slug}`);
}

// ── NAV SCROLL ────────────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ── FOOTER TAGS ───────────────────────────────────────────────────────────────
async function loadFooterTags() {
  try {
    const { tags } = await api.getTags();
    document.getElementById('footerTags').innerHTML = (tags || []).slice(0, 8).map(t => `
      <span class="footer-tag" onclick="Router.navigate('/articles?tag=${t.slug}')">${t.name}</span>
    `).join('');
  } catch (_) {}
}

// ── INIT ──────────────────────────────────────────────────────────────────────
Router.init();
loadFooterTags();
