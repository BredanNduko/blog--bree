let currentTag = null;
let currentPage = 1;

async function renderArticles(params = {}) {
  const app = document.getElementById('app');

  if (params.tag) currentTag = params.tag;
  else if (!params._keepTag) currentTag = null;

  if (params.page) currentPage = parseInt(params.page);
  else if (!params._keepPage) currentPage = 1;

  app.innerHTML = `<div class="loading"><div class="spinner"></div> Loading…</div>`;

  try {
    const [articlesRes, tagsRes] = await Promise.all([
      api.getArticles({ page: currentPage, limit: 8, tag: currentTag || undefined }),
      api.getTags()
    ]);

    const articles = articlesRes.articles || [];
    const pagination = articlesRes.pagination || {};
    const tags = tagsRes.tags || [];

    const tagsHTML = `
      <div class="tags-strip">
        <button class="tag-filter ${!currentTag ? 'active' : ''}" onclick="filterByTag(null)">All</button>
        ${tags.map(t => `
          <button class="tag-filter ${currentTag === t.slug ? 'active' : ''}" onclick="filterByTag('${t.slug}')">
            ${t.name} <span style="opacity:0.5;font-size:11px">${t.article_count}</span>
          </button>
        `).join('')}
      </div>
    `;

    const articlesHTML = articles.length > 0
      ? `<div class="articles-list">${articles.map(a => renderListItem(a)).join('')}</div>`
      : `<div class="empty-state"><h3>No articles found</h3><p>Try a different filter.</p></div>`;

    const paginationHTML = pagination.pages > 1 ? `
      <div class="pagination">
        ${currentPage > 1 ? `<button class="page-btn" onclick="goToPage(${currentPage - 1})">←</button>` : ''}
        ${Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => `
          <button class="page-btn ${p === currentPage ? 'active' : ''}" onclick="goToPage(${p})">${p}</button>
        `).join('')}
        ${currentPage < pagination.pages ? `<button class="page-btn" onclick="goToPage(${currentPage + 1})">→</button>` : ''}
      </div>
    ` : '';

    app.innerHTML = `
      <div class="section page-enter">
        <div class="section-header">
          <h2 class="section-title">${currentTag ? `Tag: ${currentTag}` : 'All Articles'}</h2>
          <span style="font-size:13px;color:var(--ink-4)">${pagination.total || 0} articles</span>
        </div>
        ${tagsHTML}
        ${articlesHTML}
        ${paginationHTML}
      </div>
    `;

    updateActiveNav('articles');

  } catch (err) {
    app.innerHTML = `<div class="empty-state"><h3>Failed to load</h3><p>${err.message}</p></div>`;
  }
}

function renderListItem(a) {
  const img = a.cover_image || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80';
  return `
    <article class="article-list-item" data-link="/article/${a.slug}">
      <div class="article-list-img">
        <img src="${img}" alt="${a.title}" loading="lazy">
      </div>
      <div class="article-list-body">
        <div class="article-card-tags">
          ${(a.tags || []).slice(0, 3).map(t => `<span class="tag-pill">${t.name}</span>`).join('')}
        </div>
        <h3 class="article-list-title">${a.title}</h3>
        <p class="article-list-excerpt">${a.excerpt || ''}</p>
        <div class="article-meta">
          <span>${a.author_name || 'Author'}</span>
          <span class="article-meta-dot">·</span>
          <span>${a.read_time || 1} min read</span>
          <span class="article-meta-dot">·</span>
          <span>${formatDate(a.published_at)}</span>
        </div>
      </div>
    </article>
  `;
}

function filterByTag(tag) {
  currentTag = tag;
  currentPage = 1;
  const url = tag ? `/articles?tag=${tag}` : '/articles';
  Router.navigate(url);
}

function goToPage(page) {
  currentPage = page;
  const url = currentTag ? `/articles?tag=${currentTag}&page=${page}` : `/articles?page=${page}`;
  Router.navigate(url);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
