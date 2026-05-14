const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');

// Serve static assets
app.use(express.static(PUBLIC));

// SPA fallback — all routes serve index.html EXCEPT /admin.html and /uploads
app.use((req, res, next) => {
  // Admin panel — served directly
  if (req.path === '/admin.html' || req.path === '/admin') {
    return res.sendFile(path.join(PUBLIC, 'admin.html'));
  }
  // All other routes → SPA
  res.sendFile(path.join(PUBLIC, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐  Frontend running at http://localhost:${PORT}`);
  console.log(`🔒  Admin panel at  http://localhost:${PORT}/admin.html`);
});
