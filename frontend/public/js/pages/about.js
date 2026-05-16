async function renderAbout() {
  const app = document.getElementById('app');

  try {
    // We'll load the author info from the API
    const me = await api.get('/auth/me').catch(() => null);
    const user = me?.user || { display_name: 'The Author', bio: 'Writer, thinker, creator.', avatar_url: '' };

    const avatar = user.avatar_url
      ? `<img class="about-avatar" src="${user.avatar_url}" alt="${user.display_name}">`
      : `<div class="about-avatar" style="display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:36px;font-weight:600;color:var(--ink-3)">${(user.display_name || 'A').charAt(0)}</div>`;

    app.innerHTML = `
      <div class="about-page page-enter">
        ${avatar}
        <h1 class="about-name">${user.display_name}</h1>
        <p class="about-role">Writer · Blogger · Creator</p>
        <div class="about-bio">
          ${user.bio
            ? user.bio.split('\n').filter(Boolean).map(p => `<p>${p}</p>`).join('')
            : `<p>Welcome to Stalk Quil — a place for writing that matters. Here you'll find essays, reflections, and stories on the things that shape how we live, think, and create.</p>
               <p>This blog exists because words need a home. Because some ideas deserve more than a tweet. Because reading slowly is a form of resistance.</p>`
          }
        </div>
      </div>
    `;
    updateActiveNav('about');
  } catch (err) {
    app.innerHTML = `<div class="empty-state"><h3>Failed to load</h3><p>${err.message}</p></div>`;
  }
}
