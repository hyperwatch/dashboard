const path = require('path');

// Prebuilt dashboard (built on publish). Serve `distPath` under /dashboard and
// fall back to `indexPath` for client-side routes, e.g. with Express:
//
//   app.use('/dashboard', express.static(distPath));
//   app.get('/dashboard/*splat', (req, res) => res.sendFile(indexPath));
const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

module.exports = { distPath, indexPath };
