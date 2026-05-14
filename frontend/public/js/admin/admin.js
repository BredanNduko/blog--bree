// ── STATE ─────────────────────────────────────────────────────────────────────
let currentUser = null;
let editingArticleId = null;
let editorTags = [];
let articleFilter = 'all';
let confirmCallback = null;

// ── AUTH ──────────────────────────────────────────────────────────────────────
async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');

  errEl.classList.remove('show');
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  try {
    const res = await api.login(email, password);
    api.setToken(res.token);
    currentUser = res.user;
    showApp();
  } catch (err) {
    errEl.textContent = err.message || 'Invalid credentials';
    errEl.classList.add('show');
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
}

async function checkExistingSession() {
  const token = api.getToken();
  if (!token) return;
  try {
    const res = await api.getMe();
    currentUser = res.user;
    showApp();
  } catch {
    api.setToken(null);
  }
}

function doLogout() {
  api.setToken(null);
  currentUser = null;
  document.getElementById('admin-app').classList.remove('visible');
  document.getElementById('login-screen').style.display = 'flex';
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-app').classList.add('visible');

  if (currentUser) {
    document.getElementById('sidebarName').textContent = currentUser.display_name;
    document.getElementById('sidebarAvatar').textContent = (currentUser.display_name || 'A').charAt(0).toUpperCase();
  }

  showDashboard();
}

// ── NAVIGATION ────────────────────────────────────────────────────────────────
function setActiveNav(id) {
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
async function showDashboard() {
  setActiveNav('nav-dashboard');
  setTopbar('Dashboard', '');
  const content = document.getElementById('adminContent');
  content.innerHTML = `<div class="admin-loading"><div class="spinner"></div> Loading…</div>`;

  try {
    const res = await api.getAllArticles({ limit: 100 });
    const all = res.articles || [];
    const published = all.filter(a => a.status === 'published');
    const drafts = all.filter(a => a.status === 'draft');
    const totalViews = all.reduce((s, a) => s + (a.views || 0), 0);
    const recent = all.slice(0, 5);

    content.innerHTML = `
      <div class="stats-grid">
        ${statCard('Total Articles', all.length, 'All time')}
        ${statCard('Published', published.length, `${drafts.length} drafts`)}
        ${statCard('Total Views', totalViews.toLocaleString(), 'Across all articles')}
        ${statCard('Avg. Read Time', all.length ? Math.round(all.reduce((s,a)=>s+(a.read_time||1),0)/all.length) + ' min' : '—', 'Per article')}
      </div>

      <div class="table-card">
        <div class="table-header">
          <div class="table-title">Recent Articles</div>
          <button class="btn btn-primary btn-sm" onclick="showEditor()">+ New Article</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Views</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${recent.length ? recent.map(a => articleRow(a)).join('') : `
              <tr><td colspan="5" style="text-align:center;color:var(--text-3);padding:40px">No articles yet. <span style="color:var(--accent);cursor:pointer" onclick="showEditor()">Write your first one →</span></td></tr>
            `}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<div class="empty-admin"><h3>Failed to load</h3><p>${err.message}</p></div>`;
  }
}

function statCard(label, value, sub) {
  return `
    <div class="stat-card">
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-sub">${sub}</div>
    </div>
  `;
}

// ── ARTICLES LIST ─────────────────────────────────────────────────────────────
async function showArticles(filter = 'all') {
  articleFilter = filter;
  setActiveNav('nav-articles');
  setTopbar('Articles', `<button class="btn btn-primary btn-sm" onclick="showEditor()">+ New Article</button>`);

  const content = document.getElementById('adminContent');
  content.innerHTML = `<div class="admin-loading"><div class="spinner"></div> Loading…</div>`;

  try {
    const params = { limit: 50 };
    if (filter !== 'all') params.status = filter;
    const res = await api.getAllArticles(params);
    const articles = res.articles || [];

    content.innerHTML = `
      <div class="table-card">
        <div class="table-header">
          <div class="table-title">All Articles <span style="color:var(--text-3);font-size:13px;font-weight:400">(${articles.length})</span></div>
          <div class="table-filters">
            <button class="filter-btn ${filter==='all'?'active':''}" onclick="showArticles('all')">All</button>
            <button class="filter-btn ${filter==='published'?'active':''}" onclick="showArticles('published')">Published</button>
            <button class="filter-btn ${filter==='draft'?'active':''}" onclick="showArticles('draft')">Drafts</button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Read Time</th>
              <th>Views</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${articles.length ? articles.map(a => articleRow(a, true)).join('') : `
              <tr><td colspan="6" style="text-align:center;color:var(--text-3);padding:48px">
                No articles${filter !== 'all' ? ` with status "${filter}"` : ''}. 
                <span style="color:var(--accent);cursor:pointer" onclick="showEditor()">Write one →</span>
              </td></tr>
            `}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<div class="empty-admin"><h3>Failed to load</h3><p>${err.message}</p></div>`;
  }
}

function articleRow(a, extended = false) {
  const date = new Date(a.updated_at || a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const statusBadge = `<span class="status-badge status-${a.status}">${a.status === 'published' ? '● Published' : '○ Draft'}</span>`;

  return `
    <tr>
      <td><div class="td-title" title="${a.title}">${a.title}</div></td>
      <td>${statusBadge}</td>
      ${extended ? `<td>${a.read_time || 1} min</td>` : ''}
      <td>${(a.views || 0).toLocaleString()}</td>
      <td style="color:var(--text-3);font-size:13px">${date}</td>
      <td>
        <div style="display:flex;gap:6px;justify-content:flex-end">
          ${a.status === 'published' ? `
            <a href="/article/${a.slug}" target="_blank" class="btn btn-ghost btn-sm btn-icon" title="View">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          ` : ''}
          <button class="btn btn-ghost btn-sm btn-icon" title="Edit" onclick="editArticle('${a.id}')">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn btn-ghost btn-sm btn-icon" title="Delete" onclick="confirmDelete('${a.id}', '${a.title.replace(/'/g, "\\'")}')">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `;
}

// ── EDITOR ────────────────────────────────────────────────────────────────────
async function showEditor(articleId = null) {
  editingArticleId = articleId;
  editorTags = [];

  setActiveNav('nav-new');
  setTopbar(articleId ? 'Edit Article' : 'New Article', '');

  const content = document.getElementById('adminContent');
  content.innerHTML = `<div class="admin-loading"><div class="spinner"></div> ${articleId ? 'Loading article…' : 'Preparing editor…'}</div>`;

  let article = null;
  if (articleId) {
    try {
      const res = await api.getArticleById(articleId);
      article = res.article;
      editorTags = (article.tags || []).map(t => t.name);
    } catch (err) {
      toast('Failed to load article', 'error');
      return showArticles();
    }
  }

  const coverUrl = article?.cover_image || '';

  content.innerHTML = `
    <div class="editor-layout">
      <!-- MAIN EDITOR -->
      <div class="editor-main">
        <div class="editor-toolbar">
          <button class="toolbar-btn" title="Bold" onclick="formatText('bold')"><b>B</b></button>
          <button class="toolbar-btn" title="Italic" onclick="formatText('italic')"><i>I</i></button>
          <button class="toolbar-btn" title="Heading 2" onclick="insertBlock('h2')">H2</button>
          <button class="toolbar-btn" title="Heading 3" onclick="insertBlock('h3')">H3</button>
          <div class="toolbar-divider"></div>
          <button class="toolbar-btn" title="Blockquote" onclick="insertBlock('blockquote')">"</button>
          <button class="toolbar-btn" title="Unordered list" onclick="insertBlock('ul')">≡</button>
          <button class="toolbar-btn" title="Ordered list" onclick="insertBlock('ol')">#</button>
          <div class="toolbar-divider"></div>
          <button class="toolbar-btn" title="Link" onclick="insertLink()">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </button>
          <button class="toolbar-btn" title="Image tag" onclick="insertBlock('img')">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </button>
          <div class="toolbar-divider"></div>
          <button class="toolbar-btn" title="Preview" onclick="togglePreview()" id="previewToggleBtn" style="font-size:11px;width:auto;padding:0 8px">Preview</button>
        </div>

        <textarea
          id="editorTitle"
          class="editor-title-input"
          placeholder="Article title…"
          rows="1"
          oninput="autoResize(this)"
        >${article?.title || ''}</textarea>

        <div id="editorBodyWrap">
          <textarea
            id="editorBody"
            class="editor-body"
            placeholder="Write your article here… HTML is supported."
          >${article?.body || ''}</textarea>
        </div>

        <div id="editorPreview" style="display:none;padding:20px 24px 32px;font-family:'Playfair Display',serif;font-size:18px;line-height:1.8;color:var(--text-2)" class="article-body"></div>
      </div>

      <!-- SIDEBAR -->
      <div class="editor-sidebar">

        <!-- Publish -->
        <div class="sidebar-card">
          <div class="sidebar-card-header">Publish</div>
          <div class="sidebar-card-body" style="display:flex;flex-direction:column;gap:12px">
            <div>
              <label class="form-label">Status</label>
              <select class="form-select" id="editorStatus">
                <option value="draft" ${article?.status !== 'published' ? 'selected' : ''}>Draft</option>
                <option value="published" ${article?.status === 'published' ? 'selected' : ''}>Published</option>
              </select>
            </div>
            <button class="btn btn-primary btn-full" onclick="saveArticle()">
              ${articleId ? 'Save Changes' : 'Publish Article'}
            </button>
            ${articleId ? `
              <button class="btn btn-secondary btn-full" onclick="showArticles()">← Back to Articles</button>
            ` : ''}
          </div>
        </div>

        <!-- Cover Image -->
        <div class="sidebar-card">
          <div class="sidebar-card-header">Cover Image</div>
          <div class="sidebar-card-body">
            <div class="cover-preview" id="coverPreview">
              ${coverUrl
                ? `<img id="coverPreviewImg" src="${coverUrl}" alt="Cover">`
                : `<div class="cover-preview-placeholder">
                    <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>No cover image</span>
                  </div>`
              }
            </div>
            <div style="display:flex;gap:8px">
              <label class="btn btn-secondary btn-sm" style="flex:1;cursor:pointer;text-align:center">
                Upload
                <input type="file" accept="image/*" style="display:none" onchange="uploadCover(event)">
              </label>
              <button class="btn btn-secondary btn-sm" onclick="setCoverUrl()" style="flex:1">URL</button>
            </div>
            <input type="hidden" id="coverImageUrl" value="${coverUrl}">
          </div>
        </div>

        <!-- Excerpt -->
        <div class="sidebar-card">
          <div class="sidebar-card-header">Excerpt</div>
          <div class="sidebar-card-body">
            <textarea class="form-textarea" id="editorExcerpt" placeholder="Short description shown in listings…" rows="3">${article?.excerpt || ''}</textarea>
          </div>
        </div>

        <!-- Tags -->
        <div class="sidebar-card">
          <div class="sidebar-card-header">Tags</div>
          <div class="sidebar-card-body">
            <div class="tags-input-wrap" id="tagsWrap" onclick="document.getElementById('tagInput').focus()">
              ${editorTags.map(t => tagChipHTML(t)).join('')}
              <input type="text" class="tags-input" id="tagInput" placeholder="${editorTags.length ? '' : 'Add tags…'}" onkeydown="handleTagInput(event)">
            </div>
            <div style="font-size:11px;color:var(--text-3);margin-top:6px">Press Enter or comma to add</div>
          </div>
        </div>

      </div>
    </div>
  `;

  // Auto-resize title
  const titleEl = document.getElementById('editorTitle');
  if (titleEl) autoResize(titleEl);
}

function tagChipHTML(name) {
  const safe = name.replace(/"/g, '&quot;');
  return `<span class="tag-chip">${safe}<span class="tag-chip-remove" onclick="removeTag('${safe}')">×</span></span>`;
}

function handleTagInput(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const val = e.target.value.trim().replace(/,$/, '');
    if (val && !editorTags.includes(val)) {
      editorTags.push(val);
      renderTagChips();
    }
    e.target.value = '';
  } else if (e.key === 'Backspace' && e.target.value === '' && editorTags.length) {
    editorTags.pop();
    renderTagChips();
  }
}

function removeTag(name) {
  editorTags = editorTags.filter(t => t !== name);
  renderTagChips();
}

function renderTagChips() {
  const wrap = document.getElementById('tagsWrap');
  const input = document.getElementById('tagInput');
  wrap.innerHTML = editorTags.map(t => tagChipHTML(t)).join('') +
    `<input type="text" class="tags-input" id="tagInput" placeholder="${editorTags.length ? '' : 'Add tags…'}" onkeydown="handleTagInput(event)">`;
  document.getElementById('tagInput').focus();
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

// ── TOOLBAR HELPERS ───────────────────────────────────────────────────────────
function formatText(type) {
  const ta = document.getElementById('editorBody');
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = ta.value.substring(start, end);
  let wrapped = '';

  if (type === 'bold') wrapped = `<strong>${selected}</strong>`;
  if (type === 'italic') wrapped = `<em>${selected}</em>`;

  ta.value = ta.value.substring(0, start) + wrapped + ta.value.substring(end);
  ta.focus();
  ta.setSelectionRange(start + wrapped.length, start + wrapped.length);
}

function insertBlock(tag) {
  const ta = document.getElementById('editorBody');
  const start = ta.selectionStart;
  const selected = ta.value.substring(start, ta.selectionEnd) || 'Your text here';
  let block = '';

  if (tag === 'h2') block = `\n\n<h2>${selected}</h2>\n\n`;
  else if (tag === 'h3') block = `\n\n<h3>${selected}</h3>\n\n`;
  else if (tag === 'blockquote') block = `\n\n<blockquote>${selected}</blockquote>\n\n`;
  else if (tag === 'ul') block = `\n<ul>\n  <li>${selected}</li>\n  <li>Item 2</li>\n</ul>\n`;
  else if (tag === 'ol') block = `\n<ol>\n  <li>${selected}</li>\n  <li>Item 2</li>\n</ol>\n`;
  else if (tag === 'img') block = `\n<img src="IMAGE_URL_HERE" alt="${selected}">\n`;

  ta.value = ta.value.substring(0, start) + block + ta.value.substring(ta.selectionEnd);
  ta.focus();
}

function insertLink() {
  const url = prompt('Enter URL:');
  if (!url) return;
  const ta = document.getElementById('editorBody');
  const start = ta.selectionStart;
  const selected = ta.value.substring(start, ta.selectionEnd) || url;
  const link = `<a href="${url}">${selected}</a>`;
  ta.value = ta.value.substring(0, start) + link + ta.value.substring(ta.selectionEnd);
}

let previewOn = false;
function togglePreview() {
  const bodyWrap = document.getElementById('editorBodyWrap');
  const preview = document.getElementById('editorPreview');
  const btn = document.getElementById('previewToggleBtn');
  previewOn = !previewOn;

  if (previewOn) {
    preview.innerHTML = document.getElementById('editorBody').value;
    bodyWrap.style.display = 'none';
    preview.style.display = 'block';
    btn.textContent = 'Edit';
    btn.style.background = 'var(--accent-subtle)';
    btn.style.color = 'var(--accent)';
  } else {
    bodyWrap.style.display = 'block';
    preview.style.display = 'none';
    btn.textContent = 'Preview';
    btn.style.background = '';
    btn.style.color = '';
  }
}

// ── COVER IMAGE ───────────────────────────────────────────────────────────────
async function uploadCover(e) {
  const file = e.target.files[0];
  if (!file) return;

  const preview = document.getElementById('coverPreview');
  preview.innerHTML = `<div class="cover-preview-placeholder"><div class="spinner"></div><span>Uploading…</span></div>`;

  try {
    const res = await api.uploadImage(file);
     const url = `https://stalkquill.onrender.com${res.url}`;
    document.getElementById('coverImageUrl').value = url;
    preview.innerHTML = `<img id="coverPreviewImg" src="${url}" alt="Cover">`;
    toast('Image uploaded', 'success');
  } catch (err) {
    preview.innerHTML = `<div class="cover-preview-placeholder" style="color:#e07070">Upload failed</div>`;
    toast('Upload failed: ' + err.message, 'error');
  }
}

function setCoverUrl() {
  const url = prompt('Enter image URL:');
  if (!url) return;
  document.getElementById('coverImageUrl').value = url;
  const preview = document.getElementById('coverPreview');
  preview.innerHTML = `<img id="coverPreviewImg" src="${url}" alt="Cover">`;
}

// ── SAVE ARTICLE ──────────────────────────────────────────────────────────────
async function saveArticle() {
  const title = document.getElementById('editorTitle').value.trim();
  const body = document.getElementById('editorBody').value.trim();
  const status = document.getElementById('editorStatus').value;
  const excerpt = document.getElementById('editorExcerpt').value.trim();
  const cover_image = document.getElementById('coverImageUrl').value.trim();

  if (!title) { toast('Title is required', 'error'); return; }
  if (!body) { toast('Body is required', 'error'); return; }

  const payload = { title, body, status, excerpt, cover_image, tags: editorTags };

  try {
    if (editingArticleId) {
      await api.updateArticle(editingArticleId, payload);
      toast('Article updated', 'success');
    } else {
      await api.createArticle(payload);
      toast('Article created', 'success');
      editingArticleId = null;
    }
    setTimeout(() => showArticles(), 800);
  } catch (err) {
    toast('Save failed: ' + err.message, 'error');
  }
}

async function editArticle(id) {
  await showEditor(id);
  editingArticleId = id;
  setActiveNav('nav-articles');
}

// ── DELETE ────────────────────────────────────────────────────────────────────
function confirmDelete(id, title) {
  document.getElementById('modalTitle').textContent = 'Delete Article';
  document.getElementById('modalBody').textContent = `Are you sure you want to delete "${title}"? This cannot be undone.`;
  document.getElementById('modalConfirmBtn').onclick = () => deleteArticle(id);
  document.getElementById('confirmModal').classList.add('open');
}

async function deleteArticle(id) {
  closeModal();
  try {
    await api.deleteArticle(id);
    toast('Article deleted', 'success');
    showArticles(articleFilter);
  } catch (err) {
    toast('Delete failed: ' + err.message, 'error');
  }
}

function closeModal() {
  document.getElementById('confirmModal').classList.remove('open');
}

// ── SETTINGS ─────────────────────────────────────────────────────────────────
function showSettings() {
  setActiveNav('nav-settings');
  setTopbar('Settings', '');
  const content = document.getElementById('adminContent');

  if (!currentUser) return;

  content.innerHTML = `
    <!-- Profile -->
    <div class="settings-section">
      <div class="settings-section-header">Profile</div>
      <div class="settings-section-body">
        <div class="settings-row">
          <div class="form-group" style="margin:0">
            <label class="form-label">Display Name</label>
            <input type="text" class="form-input" id="profileName" value="${currentUser.display_name || ''}">
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" value="${currentUser.email || ''}" disabled style="opacity:0.5">
          </div>
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Bio</label>
          <textarea class="form-textarea" id="profileBio" rows="4" placeholder="Tell readers about yourself…">${currentUser.bio || ''}</textarea>
        </div>
        <div style="margin-top:16px">
          <button class="btn btn-primary" onclick="saveProfile()">Save Profile</button>
        </div>
      </div>
    </div>

    <!-- Password -->
    <div class="settings-section">
      <div class="settings-section-header">Change Password</div>
      <div class="settings-section-body">
        <div class="settings-row">
          <div class="form-group" style="margin:0">
            <label class="form-label">Current Password</label>
            <input type="password" class="form-input" id="currentPw" placeholder="••••••••">
          </div>
          <div></div>
        </div>
        <div class="settings-row">
          <div class="form-group" style="margin:0">
            <label class="form-label">New Password</label>
            <input type="password" class="form-input" id="newPw" placeholder="Min. 6 characters">
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label">Confirm New Password</label>
            <input type="password" class="form-input" id="confirmPw" placeholder="••••••••">
          </div>
        </div>
        <div style="margin-top:16px">
          <button class="btn btn-primary" onclick="savePassword()">Update Password</button>
        </div>
      </div>
    </div>

    <!-- Blog Link -->
    <div class="settings-section">
      <div class="settings-section-header">Blog</div>
      <div class="settings-section-body">
        <p style="font-size:14px;color:var(--text-2);margin-bottom:16px">Your blog is live and publicly accessible.</p>
        <a href="/" target="_blank" class="btn btn-secondary">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          Open Blog
        </a>
      </div>
    </div>
  `;
}

async function saveProfile() {
  const display_name = document.getElementById('profileName').value.trim();
  const bio = document.getElementById('profileBio').value.trim();
  if (!display_name) { toast('Name is required', 'error'); return; }

  try {
    await api.updateProfile({ display_name, bio });
    currentUser.display_name = display_name;
    currentUser.bio = bio;
    document.getElementById('sidebarName').textContent = display_name;
    document.getElementById('sidebarAvatar').textContent = display_name.charAt(0).toUpperCase();
    toast('Profile updated', 'success');
  } catch (err) {
    toast('Failed: ' + err.message, 'error');
  }
}

async function savePassword() {
  const current_password = document.getElementById('currentPw').value;
  const new_password = document.getElementById('newPw').value;
  const confirm = document.getElementById('confirmPw').value;

  if (!current_password || !new_password) { toast('All fields required', 'error'); return; }
  if (new_password !== confirm) { toast('Passwords do not match', 'error'); return; }
  if (new_password.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }

  try {
    await api.changePassword({ current_password, new_password });
    document.getElementById('currentPw').value = '';
    document.getElementById('newPw').value = '';
    document.getElementById('confirmPw').value = '';
    toast('Password updated', 'success');
  } catch (err) {
    toast('Failed: ' + err.message, 'error');
  }
}

// ── TOPBAR ────────────────────────────────────────────────────────────────────
function setTopbar(title, actionsHTML) {
  document.getElementById('topbarTitle').textContent = title;
  document.getElementById('topbarActions').innerHTML = actionsHTML || '';
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function toast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
      ${type === 'success'
        ? '<polyline points="20 6 9 17 4 12"/>'
        : type === 'error'
          ? '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'
          : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
    </svg>
    <span>${message}</span>
  `;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    el.style.transition = '0.3s ease';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

// ── KEYBOARD SHORTCUTS ────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    if (document.getElementById('editorTitle')) saveArticle();
  }
  if (e.key === 'Escape') closeModal();
});

// Enter key on login
document.getElementById('loginPassword').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doLogin();
});
document.getElementById('loginEmail').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('loginPassword').focus();
});

// ── INIT ──────────────────────────────────────────────────────────────────────
checkExistingSession();
