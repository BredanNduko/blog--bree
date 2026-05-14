const API_BASE = '/api';

const api = {
  _token: null,

  getToken() {
    return this._token || localStorage.getItem('blog_token');
  },

  setToken(token) {
    this._token = token;
    if (token) localStorage.setItem('blog_token', token);
    else localStorage.removeItem('blog_token');
  },

  async request(method, path, data = null, isFormData = false) {
    const headers = {};
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isFormData && data) headers['Content-Type'] = 'application/json';

    const opts = { method, headers };
    if (data) opts.body = isFormData ? data : JSON.stringify(data);

    const res = await fetch(`${API_BASE}${path}`, opts);
    const json = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  },

  get: (path) => api.request('GET', path),
  post: (path, data) => api.request('POST', path, data),
  put: (path, data) => api.request('PUT', path, data),
  delete: (path) => api.request('DELETE', path),

  // Auth
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.post('/auth/update-profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),

  // Articles (public)
  getArticles: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/articles${qs ? '?' + qs : ''}`);
  },
  getFeatured: () => api.get('/articles/featured'),
  getArticle: (slug) => api.get(`/articles/${slug}`),
  getTags: () => api.get('/articles/tags/all'),

  // Articles (admin)
  getAllArticles: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/articles/admin/all${qs ? '?' + qs : ''}`);
  },
  getArticleById: (id) => api.get(`/articles/admin/id/${id}`),
  createArticle: (data) => api.post('/articles', data),
  updateArticle: (id, data) => api.put(`/articles/${id}`, data),
  deleteArticle: (id) => api.delete(`/articles/${id}`),

  // Upload
  async uploadImage(file) {
    const fd = new FormData();
    fd.append('image', file);
    return api.request('POST', '/upload/image', fd, true);
  }
};
