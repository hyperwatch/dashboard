import Hostname from '../components/Hostname';
import Sparkline from '../components/Sparkline';
import {
  allSeenToday,
  countryFlag,
  formatLastSeen,
  parseHostname,
  truncate,
} from './format';

// Columns shared by the aggregator pages. They are the columns of Hyperwatch's
// HTML tables, in the same order.

export const hostnameColumn = {
  key: 'hostname',
  label: 'Hostname',
  render: (v) => <Hostname {...parseHostname(v)} />,
};

export const countryColumn = {
  key: 'country',
  label: 'Country',
  render: (v) =>
    v ? (
      <span className="text-text-dim">
        {countryFlag(v)} {v}
      </span>
    ) : (
      ''
    ),
};

// The count and execution time of the selected period
export const periodColumns = (period) => [
  { key: `count${period}`, label: 'Count', sortable: true },
  { key: `execTime${period}`, label: 'Exec time', sortable: true },
];

export const lastSeenColumn = (rows) => {
  const timeOnly = allSeenToday(rows || []);
  return {
    key: 'lastSeen',
    label: 'Last seen',
    sortable: true,
    sortKey: 'latest',
    render: (v) => (
      <span className="text-text-dim">{formatLastSeen(v, timeOnly)}</span>
    ),
  };
};

// A sparkline of the requests over the period. Not shown for now: to show it,
// add it to the columns of a page with useActivity(), e.g.
// activityColumn(activity, (row) => row.address)
// activity: see useActivity(). identifier(row): what the entry is grouped by.
export const activityColumn = (activity, identifier) => ({
  key: 'activity',
  label: 'Activity',
  render: (v, row) => {
    const points = activity.get(identifier(row));
    return points ? (
      <Sparkline data={points} color="#797979" width={100} height={12} />
    ) : (
      ''
    );
  },
});

// An agent, as the aggregators give it: "Empty" is a request without
// User-Agent
export function Agent({ value, max = 50 }) {
  return value === 'Empty' ? <em>Empty</em> : truncate(value, max);
}
