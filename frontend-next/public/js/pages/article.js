async function renderArticle(slug) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="loading"><div class="spinner"></div> Loading article…</div>`;

  try {
    const { article, related } = await api.getArticle(slug);

    const coverImg = article.cover_image
      ? `<div class="article-hero"><img src="${article.cover_image}" alt="${article.title}"></div>`
      : '';

    const authorAvatar = article.author_avatar
      ? `<img class="author-avatar" src="${article.author_avatar}" alt="${article.author_name}">`
      : `<div class="author-avatar" style="display:flex;align-items:center;justify-content:center;background:var(--paper-3);font-family:var(--serif);font-size:18px;">${(article.author_name || 'A').charAt(0)}</div>`;

    const relatedHTML = (related || []).length > 0 ? `
      <div class="related-section">
        <h3 class="related-title">More to read</h3>
        <div class="related-grid">
          ${related.map(a => `
            <article class="article-card" data-link="/article/${a.slug}">
              <div class="article-card-img-wrap">
                <img class="article-card-img" src="${a.cover_image || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80'}" alt="${a.title}" loading="lazy">
              </div>
              <h3 class="article-card-title" style="font-size:16px">${a.title}</h3>
              <div class="article-meta">
                <span>${a.read_time || 1} min read</span>
                <span class="article-meta-dot">·</span>
                <span>${formatDate(a.published_at)}</span>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    ` : '';

    app.innerHTML = `
      <div class="article-page page-enter">
        ${coverImg}
        <div class="article-header">
          <div class="article-header-tags">
            ${(article.tags || []).map(t => `
              <span class="tag-pill" style="cursor:pointer" data-link="/articles?tag=${t.slug}">${t.name}</span>
            `).join('')}
          </div>
          <h1 class="article-main-title">${article.title}</h1>
          ${article.excerpt ? `<p class="article-lede">${article.excerpt}</p>` : ''}
          <div class="article-byline">
            ${authorAvatar}
            <div>
              <div class="author-name">${article.author_name}</div>
              <div class="author-meta">
                ${formatDate(article.published_at)}
                &nbsp;·&nbsp;
                ${article.read_time || 1} min read
                &nbsp;·&nbsp;
                ${article.views} views
              </div>
            </div>
          </div>
        </div>

        <div class="article-body-wrap">
          <div class="article-body">${article.body}</div>
        </div>

        ${relatedHTML}
      </div>
    `;

    updateActiveNav('articles');
    window.scrollTo({ top: 0, behavior: 'instant' });

  } catch (err) {
    if (err.message === 'Article not found') {
      app.innerHTML = `
        <div class="empty-state" style="padding-top:80px">
          <h3>Article not found</h3>
          <p>This article may have been removed or the link is incorrect.</p>
          <br><a data-link="/" style="color:var(--accent)">← Go home</a>
        </div>
      `;
    } else {
      app.innerHTML = `<div class="empty-state"><h3>Failed to load</h3><p>${err.message}</p></div>`;
    }
  }
}
