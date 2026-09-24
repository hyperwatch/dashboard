import { useEffect, useMemo, useState } from 'react';
import { execTimeColor, countryFlag } from '../lib/format';
import { FirewallBadge } from './FirewallActions';

// DevTools-style detail of one logged request. Only what Hyperwatch logs is
// shown: request headers and enrichments, but no response headers or bodies.

function statusColor(status) {
  if (!status) return 'text-text-dim';
  if (status >= 500) return 'text-red';
  if (status >= 400) return 'text-yellow';
  if (status >= 300) return 'text-cyan';
  return 'text-green';
}

// Suspicion score: high is bad
function scoreColor(score) {
  if (score >= 0.8) return 'text-red';
  if (score <= 0.2) return 'text-green';
  return 'text-yellow';
}

function requestHost(headers = {}) {
  return (
    headers['original-hostname'] ||
    headers['x-forwarded-host'] ||
    headers.host ||
    null
  );
}

function fullUrl(entry) {
  const url = entry.request?.url || '';
  const host = requestHost(entry.request?.headers);
  return host ? `https://${host}${url}` : url;
}

function queryParams(url) {
  const idx = url?.indexOf('?') ?? -1;
  if (idx === -1) return [];
  return [...new URLSearchParams(url.slice(idx + 1)).entries()];
}

// The GraphQL request body as the client sent it. The API logs `req.body`
// and adds `servedFromCache`.
function graphqlBody(entry) {
  if (!entry.graphql) return null;
  // eslint-disable-next-line no-unused-vars
  const { servedFromCache, hash, ...body } = entry.graphql;
  return Object.keys(body).length ? body : null;
}

const hasKeys = (value) =>
  value && typeof value === 'object' && Object.keys(value).length > 0;

const shellQuote = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`;

// Headers curl sets itself, or that would be wrong on a replay
const CURL_SKIP = new Set(['host', 'content-length', 'connection']);

function toCurl(entry) {
  const { method = 'GET', headers = {} } = entry.request || {};
  const parts = [`curl ${shellQuote(fullUrl(entry))}`];
  if (method !== 'GET') parts.push(`-X ${method}`);
  for (const [name, value] of Object.entries(headers).sort()) {
    if (!CURL_SKIP.has(name))
      parts.push(`-H ${shellQuote(`${name}: ${value}`)}`);
  }
  // The logged GraphQL body, minus what the API's logger adds to it
  const body = graphqlBody(entry);
  if (body) {
    parts.push(`--data-raw ${shellQuote(JSON.stringify(body))}`);
  }
  return parts.join(' \\\n  ');
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <h4 className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1.5">
        {title}
      </h4>
      {children}
    </div>
  );
}

// Name / value rows; empty (or false) values are skipped
function Rows({ rows, mono = true }) {
  const shown = rows.filter(
    ([, v]) => v !== undefined && v !== null && v !== '' && v !== false
  );
  if (!shown.length) return <div className="text-[11px] text-text-dim">—</div>;
  return (
    <table className="w-full text-[11px] border-collapse">
      <tbody>
        {shown.map(([name, value], i) => (
          <tr
            key={`${name}-${i}`}
            className="align-top border-b border-border/40 last:border-0"
          >
            <td className="py-0.5 pr-3 text-text-dim w-44 break-all">{name}</td>
            <td
              className={`py-0.5 text-text break-all ${mono ? 'font-mono' : ''}`}
            >
              {value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function HeadersTab({ entry }) {
  const req = entry.request || {};
  const headers = Object.entries(req.headers || {}).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  const status = entry.response?.status;
  return (
    <>
      <Section title="General">
        <Rows
          rows={[
            ['Request URL', fullUrl(entry)],
            ['Method', req.method],
            [
              'Status',
              status && <span className={statusColor(status)}>{status}</span>,
            ],
            ['Remote address', entry.address?.value || req.address],
            ['Time', req.time],
            [
              'Execution time',
              entry.executionTime != null && (
                <span className={execTimeColor(entry.executionTime)}>
                  {entry.executionTime}ms
                </span>
              ),
            ],
            ['Cloudflare data center', entry.cloudflare?.['data-center']],
            ['Application', entry.application],
          ]}
        />
      </Section>
      <Section title={`Request headers (${headers.length})`}>
        <Rows rows={headers} />
      </Section>
      <div className="text-[10px] text-text-dim">
        Response headers and bodies are not captured in the logs.
      </div>
    </>
  );
}

function ClientTab({ entry }) {
  const {
    agent,
    geoip,
    hostname,
    dnsbl,
    language,
    signature,
    fingerprint,
    firewall,
  } = entry;
  const version = (o) =>
    [o?.major, o?.minor, o?.patch]
      .filter((v) => v != null && v !== '')
      .join('.');
  return (
    <>
      <Section title="Identity">
        <Rows
          rows={[
            [
              'Identity',
              entry.identity && (
                <span className="text-magenta">{entry.identity}</span>
              ),
            ],
            [
              'Hostname',
              hostname?.value &&
                `${hostname.value}${hostname.verified ? ' (verified)' : ''}`,
            ],
            [
              'Firewall',
              firewall && (
                <span className="inline-flex items-center gap-2">
                  <FirewallBadge match={firewall} />
                  <span>
                    {firewall.list}: {firewall.value}
                  </span>
                </span>
              ),
            ],
            [
              'DNSBL',
              dnsbl &&
                (dnsbl.xbl ? (
                  <span className="text-red">listed (XBL)</span>
                ) : (
                  'not listed'
                )),
            ],
          ]}
        />
      </Section>
      {agent && (
        <Section title="User agent">
          <Rows
            rows={[
              [
                'Browser',
                agent.family && `${agent.family} ${version(agent)}`.trim(),
              ],
              [
                'OS',
                agent.os?.family &&
                  `${agent.os.family} ${version(agent.os)}`.trim(),
              ],
              [
                'Device',
                agent.device?.family !== 'Other' &&
                  [agent.device?.brand, agent.device?.model]
                    .filter(Boolean)
                    .join(' '),
              ],
              ['Raw', entry.request?.headers?.['user-agent']],
            ]}
          />
        </Section>
      )}
      {geoip && (
        <Section title="Location">
          <Rows
            mono={false}
            rows={[
              [
                'Country',
                geoip.country &&
                  `${countryFlag(geoip.country)} ${geoip.country}`,
              ],
              [
                'Region / city',
                [geoip.region, geoip.city].filter(Boolean).join(' / '),
              ],
              ['Timezone', geoip.timezone],
              ['Coordinates', geoip.ll?.join(', ')],
            ]}
          />
        </Section>
      )}
      {language?.length > 0 && (
        <Section title="Languages">
          <Rows
            rows={language.map((l) => [
              [l.code, l.script, l.region].filter(Boolean).join('-'),
              `q=${l.quality}`,
            ])}
          />
        </Section>
      )}
      {(signature || fingerprint) && (
        <Section title="Fingerprint">
          <Rows
            rows={[
              ['Signature', signature?.id],
              [
                'Score',
                typeof fingerprint?.score === 'number' && (
                  <span className={scoreColor(fingerprint.score)}>
                    {fingerprint.score.toFixed(1)}
                  </span>
                ),
              ],
              [
                'Flags',
                Array.isArray(fingerprint?.flags) &&
                  fingerprint.flags.join(', '),
              ],
            ]}
          />
        </Section>
      )}
    </>
  );
}

function Code({ children }) {
  return (
    <pre className="bg-bg rounded p-2 text-[11px] font-mono text-text overflow-auto whitespace-pre">
      {children}
    </pre>
  );
}

function PayloadTab({ entry, params }) {
  const graphql = entry.graphql;
  return (
    <>
      {params.length > 0 && (
        <Section title="Query string parameters">
          <Rows rows={params} />
        </Section>
      )}
      {graphql && (
        <Section title="GraphQL">
          <Rows
            rows={[
              ['Operation', graphql.operationName],
              [
                'Cache',
                graphql.servedFromCache ? (
                  <span className="text-green">HIT</span>
                ) : (
                  'MISS'
                ),
              ],
            ]}
          />
        </Section>
      )}
      {graphql?.query && (
        <Section title="Query">
          <Code>{graphql.query.trim()}</Code>
        </Section>
      )}
      {hasKeys(graphql?.variables) && (
        <Section title="Variables">
          <Code>{JSON.stringify(graphql.variables, null, 2)}</Code>
        </Section>
      )}
      {hasKeys(graphql?.extensions) && (
        <Section title="Extensions">
          <Code>{JSON.stringify(graphql.extensions, null, 2)}</Code>
        </Section>
      )}
    </>
  );
}

export default function RequestDetailPanel({ entry, onClose }) {
  const [tab, setTab] = useState('headers');
  const [copied, setCopied] = useState(null);
  const params = useMemo(() => queryParams(entry.request?.url), [entry]);
  const hasPayload = params.length > 0 || !!graphqlBody(entry);

  const tabs = [
    ['headers', 'Headers'],
    ['client', 'Client'],
    ...(hasPayload ? [['payload', 'Payload']] : []),
    ['raw', 'Raw'],
  ];
  const activeTab = tabs.some(([id]) => id === tab) ? tab : 'headers';

  // Escape closes this panel only, not the side panel it was opened from:
  // capture on window runs before their document listeners.
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  // A click outside closes this panel only, like Escape. Clicking another log
  // line switches to that request instead.
  useEffect(() => {
    function handleMouseDown(e) {
      if (e.target.closest?.('[data-request-detail], [data-log-entry]')) return;
      e.stopPropagation();
      onClose();
    }
    window.addEventListener('mousedown', handleMouseDown, true);
    return () => window.removeEventListener('mousedown', handleMouseDown, true);
  }, [onClose]);

  async function copy(kind, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }

  const req = entry.request || {};
  const status = entry.response?.status;

  return (
    <div
      data-request-detail
      className="fixed inset-y-0 right-0 w-[40rem] max-w-full border-l border-border bg-bg-sidebar flex flex-col z-40 shadow-lg"
    >
      <div className="p-3 border-b border-border">
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm font-mono break-all">
            <span className="text-text-dim">{req.method}</span>{' '}
            <span className="text-text">{req.url?.split('?')[0]}</span>{' '}
            <span className={statusColor(status)}>{status}</span>
          </div>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-text flex-shrink-0 cursor-pointer text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-text-dim">{req.time}</span>
          <div className="flex gap-1.5 ml-auto">
            {[
              ['curl', 'Copy as cURL', () => toCurl(entry)],
              ['json', 'Copy JSON', () => JSON.stringify(entry, null, 2)],
            ].map(([kind, label, text]) => (
              <button
                key={kind}
                onClick={() => copy(kind, text())}
                className="px-2 py-0.5 rounded text-[10px] border border-border bg-bg-card text-text-dim hover:text-text cursor-pointer"
              >
                {copied === kind ? 'Copied' : label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-1 px-3 border-b border-border">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-2 py-1.5 text-[11px] border-b-2 -mb-px cursor-pointer transition-colors ${
              activeTab === id
                ? 'border-cyan text-cyan'
                : 'border-transparent text-text-dim hover:text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-3 min-h-0">
        {activeTab === 'headers' && <HeadersTab entry={entry} />}
        {activeTab === 'client' && <ClientTab entry={entry} />}
        {activeTab === 'payload' && (
          <PayloadTab entry={entry} params={params} />
        )}
        {activeTab === 'raw' && (
          <pre className="text-[11px] font-mono text-text whitespace-pre-wrap break-all">
            {JSON.stringify(entry, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
