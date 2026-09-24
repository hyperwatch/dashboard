# @hyperwatch/dashboard

Web dashboard for [Hyperwatch](https://github.com/hyperwatch/hyperwatch): overview, live logs,
addresses, signatures, identities, pipeline nodes and status. Optional pages (Firewall,
Fingerprint) show up only when the instance runs the matching Hyperwatch module.

The package ships the prebuilt static files. A Hyperwatch process serves them under `/dashboard`,
and the dashboard calls that same process's API on bare paths (`/status.json`,
`/addresses.json`, `/logs/<node>`, …).

## Usage

```sh
npm install @hyperwatch/dashboard
```

```js
const express = require('express');
const hyperwatch = require('@hyperwatch/hyperwatch');
const { distPath, indexPath } = require('@hyperwatch/dashboard');

hyperwatch.app.api.use('/dashboard', express.static(distPath));
hyperwatch.app.api.get('/dashboard/*splat', (req, res) =>
  res.sendFile(indexPath)
);
```

Then open `http://localhost:<port>/dashboard`.

### Several instances

If you run several Hyperwatch processes, each one serves its own dashboard. To link them from the
sidebar, serve `/dashboard.json` on each:

```json
{
  "name": "api",
  "instances": [
    { "name": "api", "label": "API", "url": "http://localhost:3360" },
    { "name": "frontend", "label": "Frontend", "url": "http://localhost:3300" }
  ]
}
```

`name` is the current instance. Links keep the current page. Without `/dashboard.json` there is no
switcher.

## Development

```sh
npm install
HYPERWATCH_URL=http://localhost:3000 npm run dev
```

Vite serves the dashboard at `http://localhost:5173/dashboard` and proxies everything else
(HTTP and WebSockets) to `HYPERWATCH_URL` (default `http://localhost:3000`).

When the app serves the dashboard from a linked copy of this repo (`npm link`), rebuild on every
change instead and reload the page:

```sh
npm run watch
```

This keeps working across several instances (each serves `dist/`), while `npm run dev` gives hot
reload against a single one.

## Publishing

`npm publish` builds `dist/` first (`prepack`).

## License

[Apache-2.0](LICENSE)
