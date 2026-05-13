const Router = {
  routes: {},
  current: null,

  define(path, handler) {
    this.routes[path] = handler;
  },

  navigate(path, push = true) {
    if (push && window.location.pathname + window.location.search !== path) {
      history.pushState({}, '', path);
    }
    this.resolve(path);
  },

  resolve(fullPath) {
    const [path, queryStr] = fullPath.split('?');
    const params = Object.fromEntries(new URLSearchParams(queryStr || ''));
    this.current = path;

    // Try exact match first
    if (this.routes[path]) {
      return this.routes[path](params, {});
    }

    // Try pattern match (e.g. /article/:slug)
    for (const route in this.routes) {
      const routeParts = route.split('/');
      const pathParts = path.split('/');
      if (routeParts.length !== pathParts.length) continue;

      const dynParams = {};
      let match = true;
      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(':')) {
          dynParams[routeParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
        } else if (routeParts[i] !== pathParts[i]) {
          match = false; break;
        }
      }
      if (match) return this.routes[route](params, dynParams);
    }

    // 404
    this.render404();
  },

  render404() {
    document.getElementById('app').innerHTML = `
      <div class="empty-state" style="padding-top:120px">
        <h3>Page not found</h3>
        <p>The page you're looking for doesn't exist.</p>
        <br>
        <a href="/" onclick="Router.navigate('/');return false;" style="color:var(--accent)">← Go home</a>
      </div>
    `;
  },

  init() {
    window.addEventListener('popstate', () => this.resolve(window.location.pathname + window.location.search));

    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-link]');
      if (link) {
        e.preventDefault();
        this.navigate(link.getAttribute('data-link'));
      }
    });

    this.resolve(window.location.pathname + window.location.search);
  }
};
