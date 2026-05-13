async function renderHome() {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="loading"><div class="spinner"></div> Loading…</div>`;

  try {
    const [featuredRes, latestRes] = await Promise.all([
      api.getFeatured(),
      api.getArticles({ page: 1, limit: 6 })
    ]);

    const featured = featuredRes.articles || [];
    const latest = latestRes.articles || [];

    const heroHTML = featured.length > 0 ? `
      <section class="hero">
        <div class="hero-featured">
          ${featured[0] ? `
            <div class="hero-main" data-link="/article/${featured[0].slug}">
              <img class="hero-img" src="${featured[0].cover_image || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=900&q=80'}" alt="${featured[0].title}" loading="lazy">
              <div class="hero-overlay"></div>
              <div class="hero-content">
                ${featured[0].tags && featured[0].tags[0] ? `<span class="hero-tag">${featured[0].tags[0].name}</span>` : ''}
                <h1 class="hero-title">${featured[0].title}</h1>
                <div class="hero-meta">
                  <span>${featured[0].author_name}</span>
                  <span>·</span>
                  <span>${featured[0].read_time} min read</span>
                  <span>·</span>
                  <span>${formatDate(featured[0].published_at)}</span>
                </div>
              </div>
            </div>
          ` : ''}
          ${featured.slice(1, 3).map(a => `
            <div class="hero-secondary" data-link="/article/${a.slug}">
              <img class="hero-img" src="${a.cover_image || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80'}" alt="${a.title}" loading="lazy">
              <div class="hero-overlay"></div>
              <div class="hero-content">
                ${a.tags && a.tags[0] ? `<span class="hero-tag">${a.tags[0].name}</span>` : ''}
                <h2 class="hero-title">${a.title}</h2>
                <div class="hero-meta">
                  <span>${a.read_time} min read</span>
                  <span>·</span>
                  <span>${formatDate(a.published_at)}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    ` : '';

    const latestHTML = latest.length > 0 ? `
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Latest</h2>
          <a class="section-link" data-link="/articles">All articles →</a>
        </div>
        <div class="articles-grid">
          ${latest.map(a => renderArticleCard(a)).join('')}
        </div>
      </section>
    ` : `
      <section class="section">
        <div class="empty-state">
          <h3>No articles yet</h3>
          <p>Check back soon for new content.</p>
        </div>
      </section>
    `;

    app.innerHTML = `<div class="page-enter">${heroHTML}${latestHTML}</div>`;
    updateActiveNav('home');

  } catch (err) {
    app.innerHTML = `<div class="empty-state"><h3>Failed to load</h3><p>${err.message}</p></div>`;
  }
}

function renderArticleCard(a) {
  const img = a.cover_image || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80';
  return `
    <article class="article-card" data-link="/article/${a.slug}">
      <div class="article-card-img-wrap">
        <img class="article-card-img" src="${img}" alt="${a.title}" loading="lazy">
      </div>
      <div class="article-card-tags">
        ${(a.tags || []).slice(0, 2).map(t => `<span class="tag-pill">${t.name}</span>`).join('')}
      </div>
      <h3 class="article-card-title">${a.title}</h3>
      <p class="article-card-excerpt">${a.excerpt || ''}</p>
      <div class="article-meta">
        <span>${a.author_name || 'Author'}</span>
        <span class="article-meta-dot">·</span>
        <span>${a.read_time || 1} min read</span>
        <span class="article-meta-dot">·</span>
        <span>${formatDate(a.published_at)}</span>
      </div>
    </article>
  `;
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function updateActiveNav(page) {
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const active = document.querySelector(`.nav-link[data-page="${page}"]`);
  if (active) active.classList.add('active');
}
