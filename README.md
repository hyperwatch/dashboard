# @hyperwatch/dashboard

Web dashboard for [Hyperwatch](https://github.com/hyperwatch/hyperwatch): overview, status,
addresses, identities, live logs and pipeline. Optional pages (Firewall, Fingerprint) show up only
when the instance runs the matching Hyperwatch module. Signatures has a page but no menu link, as
in Hyperwatch: open `/dashboard/signatures`.

It needs Hyperwatch 5.1 or later.

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

## Same pages as Hyperwatch's HTML interface

Hyperwatch serves minimal HTML pages of its own (`/addresses`, `/identities`, `/logs/main`,
`/pipeline`, …). The dashboard follows them: same names and order in the menu, same columns in the
same order, same formats (numbers, durations, last seen, verified hostnames ✓), same log lines, same
navigation between log streams, and the same `?period=24h` and `?filter=` parameters. On top of
that it has an overview, side panels with the logs of a row, request details and firewall actions.

### Columns left out

To match Hyperwatch's tables, these columns are no longer shown. The API still has the values
(`/addresses.json`, …): each is a candidate to bring back.

| Page       | Column                         | Still shown                       |
| ---------- | ------------------------------ | --------------------------------- |
| Addresses  | XBL (dnsbl module)             | Request details, per request      |
| Addresses  | Signatures (distinct, 15m/24h) | No (still a sort of the API)      |
| Addresses  | 2xx, 4xx                       | No (still sorts of the API)       |
| Identities | Address                        | Side panel, hostname column       |
| Signatures | Agent                          | Side panel, User-Agent in headers |
| Signatures | Fingerprint score              | Request details, Fingerprint page |
| Signatures | 2xx, 4xx                       | No (still sorts of the API)       |
| Status     | Status as a colored badge      | Shown as text                     |

When the instance runs the firewall module, Addresses and Signatures also show a badge for
the firewall list the address, or the User-Agent, is on (Monitored, Challenged, Blocked).

An Activity column (a sparkline of the requests over the period, as Hyperwatch's tables had until
5.1) is ready for Addresses and Identities but hidden for now: see `activityColumn` in
`src/lib/columns.jsx`. The overview keeps its sparkline.

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

This rebuilds `dist/` on every change (reload the page to see it), while `npm run dev` gives hot
reload through the Vite dev server.

## Publishing

`npm publish` builds `dist/` first (`prepack`).

## License

[Apache-2.0](LICENSE)
