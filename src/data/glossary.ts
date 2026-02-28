/** Reusable structured glossary — extend per concept. */

export interface GlossaryTerm {
  title: string;
  short: string;          // one-line definition
  context?: string;       // contextual note tied to the diagram
  color: string;          // badge / accent color (hex)
  relatedStrategies?: string[]; // strategy ids where this term appears
  conceptId: string;      // 'caching' | 'load-balancer' | ...
  logType?: string;       // matches LogEntry.type so we can auto-detect in logs
}

export const GLOSSARY: Record<string, GlossaryTerm> = {
  // ── CACHING ─────────────────────────────────────────────────────────────────
  'cache-hit': {
    conceptId: 'caching',
    title: 'Cache Hit',
    short: 'The data was found in cache — no DB call needed.',
    context: 'Seen when the packet travels Cache → Application without touching DB.',
    color: '#059669',
    logType: 'hit',
    relatedStrategies: ['cache-aside', 'read-through', 'refresh-ahead'],
  },
  'cache-miss': {
    conceptId: 'caching',
    title: 'Cache Miss',
    short: "Data wasn't in cache, so the system had to go to the database.",
    context: 'Seen when the flow goes Application → Cache → DB → Cache → Application.',
    color: '#ef4444',
    logType: 'miss',
    relatedStrategies: ['cache-aside', 'read-through'],
  },
  latency: {
    conceptId: 'caching',
    title: 'Latency',
    short: 'The time it takes for a request to travel from start to finish.',
    context: 'Cache has ~1ms latency vs ~100ms for a database query.',
    color: '#3b82f6',
  },
  ttl: {
    conceptId: 'caching',
    title: 'TTL (Time to Live)',
    short: 'How long a cached item stays before it expires and is refreshed.',
    context: 'When TTL expires the next request triggers a fresh DB fetch.',
    color: '#d97706',
    relatedStrategies: ['refresh-ahead'],
  },
  'cache-aside': {
    conceptId: 'caching',
    title: 'Cache Aside',
    short: 'App checks cache itself. On miss, it fetches from DB and writes to cache.',
    context: 'See the App node acting as the coordinator between Cache and DB.',
    color: '#10b981',
    relatedStrategies: ['cache-aside'],
  },
  'read-through': {
    conceptId: 'caching',
    title: 'Read Through',
    short: 'Cache sits in front of DB and loads data itself when requested.',
    context: 'Notice the App only ever talks to Cache — DB is hidden behind it.',
    color: '#6366f1',
    relatedStrategies: ['read-through'],
  },
  'refresh-ahead': {
    conceptId: 'caching',
    title: 'Refresh Ahead',
    short: 'Cache predicts what you need next and refreshes it before TTL expires.',
    context: 'Cache proactively calls DB before the user even makes a request.',
    color: '#8b5cf6',
    relatedStrategies: ['refresh-ahead'],
  },
  'write-through': {
    conceptId: 'caching',
    title: 'Write Through',
    short: 'Every write goes to both cache and DB at the same time.',
    context: 'Both nodes light up on a write — strong consistency guaranteed.',
    color: '#f59e0b',
    relatedStrategies: ['write-through'],
  },
  'write-behind': {
    conceptId: 'caching',
    title: 'Write Behind',
    short: 'Writes land in cache first; DB is updated asynchronously later.',
    context: 'Only the Cache node glows on write — DB sync happens in the background.',
    color: '#f97316',
    relatedStrategies: ['write-behind'],
  },
  'write-around': {
    conceptId: 'caching',
    title: 'Write Around',
    short: 'Writes skip the cache entirely and go straight to the database.',
    context: 'Cache is bypassed on write — prevents polluting cache with write-once data.',
    color: '#64748b',
    relatedStrategies: ['write-around'],
  },
  fetch: {
    conceptId: 'caching',
    title: 'Fetch',
    short: 'The system is retrieving data from the database after a cache miss.',
    context: 'Shown when the animated packet travels toward the DB node.',
    color: '#3b82f6',
    logType: 'fetch',
  },
  store: {
    conceptId: 'caching',
    title: 'Store',
    short: 'Writing fresh data into the cache so future requests can be served fast.',
    context: 'Happens after a DB fetch — the packet moves from DB back to Cache.',
    color: '#d97706',
    logType: 'store',
  },
  response: {
    conceptId: 'caching',
    title: 'Response',
    short: 'Data has been collected and is being sent back to the application.',
    context: 'The final leg of the journey — packet travels back to the App/Server node.',
    color: '#1d4ed8',
    logType: 'response',
  },
};

/** Returns terms relevant to the active simulation state. */
export function getActiveTerms(
  conceptId: string,
  activeStrategies: string[],
): GlossaryTerm[] {
  return Object.values(GLOSSARY).filter((t) => {
    if (t.conceptId !== conceptId) return false;
    if (!t.relatedStrategies) return true;
    return t.relatedStrategies.some((s) => activeStrategies.includes(s));
  });
}

/** Per-strategy rich explanation (diagram-flow language, not academic prose). */
export const STRATEGY_GUIDE: Record<string, {
  headline: string;
  flow: string;
  note: string;
}> = {
  'cache-aside': {
    headline: 'App is in charge of the cache.',
    flow: 'Request → App checks Cache → HIT: return data. MISS: App fetches DB → writes to Cache → returns data.',
    note: 'The most common pattern. Simple to reason about, easy to debug.',
  },
  'read-through': {
    headline: 'Cache handles everything for you.',
    flow: 'Request → App asks Cache → HIT: instant return. MISS: Cache fetches DB itself → stores → returns.',
    note: 'Your app code only ever talks to one thing: the cache.',
  },
  'refresh-ahead': {
    headline: 'Cache stays warm before you ask.',
    flow: 'Background job tracks TTL → before expiry, Cache proactively fetches fresh data from DB.',
    note: 'Near-zero misses. Best for data you can predict (top posts, trending items).',
  },
  'write-through': {
    headline: 'Every write hits cache AND DB together.',
    flow: 'Write → App sends to Cache → Cache synchronously writes to DB → both confirmed.',
    note: 'Reads are always fresh. Writes are slightly slower — two places to update.',
  },
  'write-behind': {
    headline: 'Write fast now, sync DB later.',
    flow: 'Write → App writes to Cache → Cache acknowledges immediately → DB updated async.',
    note: 'Fastest writes. Small window of risk if cache crashes before DB sync.',
  },
  'write-around': {
    headline: 'Writes skip the cache entirely.',
    flow: 'Write → App writes directly to DB → Cache is not involved.',
    note: 'No cache pollution. Good for write-once data like logs or audit records.',
  },
};

/** Tooltip content for inline log keywords. */
export const LOG_TOOLTIPS: Record<string, string> = {
  HIT: 'Data was found in cache — no database trip needed.',
  MISS: 'Data not in cache — system fetched it from the database.',
  FETCH: 'Retrieving data from the database after a miss.',
  STORE: 'Writing data into cache for future fast access.',
  ACK: 'Acknowledgement — the operation completed successfully.',
  RESPONSE: 'Final data being returned to the requester.',
  READ: 'A read operation — trying to get data.',
  WRITE: 'A write operation — trying to save or update data.',
};
