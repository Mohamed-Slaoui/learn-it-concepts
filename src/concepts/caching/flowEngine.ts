import type { Flow, OperationType, CacheState } from '../../types';

type ReadStratId = 'cache-aside' | 'read-through' | 'refresh-ahead';
type WriteStratId = 'write-through' | 'write-behind' | 'write-around';

export function makeFlow(
  op: OperationType,
  rs: ReadStratId,
  ws: WriteStratId,
  cs: CacheState,
): Flow {
  const hit = cs === 'hit';

  if (op === 'read') {
    if (rs === 'cache-aside') {
      return hit
        ? {
            isHit: true,
            steps: [
              { id: 's1', from: 'app', to: 'server', label: 'REQUEST', dot: '#3b82f6', desc: 'App sends request to Backend Server', log: 'App → Server: GET /data', type: 'info' },
              { id: 's2', from: 'server', to: 'cache', label: '1. Read from cache', dot: '#10b981', desc: 'Server checks Cache first', log: 'Server → Cache: lookup(key)', type: 'fetch' },
              { id: 's3', from: 'cache', to: 'server', label: '✓ Cache HIT', dot: '#10b981', desc: 'Cache returns data — HIT!', log: 'Cache: HIT — data found instantly ⚡', type: 'hit' },
              { id: 's4', from: 'server', to: 'app', label: 'RESPONSE', dot: '#3b82f6', desc: 'Server returns cached data to App', log: 'Response delivered from cache', type: 'response' },
            ],
          }
        : {
            isHit: false,
            steps: [
              { id: 's1', from: 'app', to: 'server', label: 'REQUEST', dot: '#3b82f6', desc: 'App sends request to Backend Server', log: 'App → Server: GET /data', type: 'info' },
              { id: 's2', from: 'server', to: 'cache', label: '1. Read from cache', dot: '#10b981', desc: 'Server checks Cache first', log: 'Server → Cache: lookup(key)', type: 'fetch' },
              { id: 's3', from: 'cache', to: 'server', label: '2. Cache Miss', dot: '#ef4444', desc: 'Cache MISS — data not found', log: 'Cache: MISS — going to database', type: 'miss', pause: 300 },
              { id: 's4', from: 'server', to: 'db', label: '3. Read from data source', dot: '#7c3aed', desc: 'Server fetches data from Database', log: 'Server → DB: query(key)', type: 'fetch' },
              { id: 's5', from: 'db', to: 'server', label: '4. Here is the data', dot: '#7c3aed', desc: 'Database returns data to Server', log: 'DB → Server: data returned', type: 'fetch' },
              { id: 's6', from: 'server', to: 'cache', label: '5. Update Cache', dot: '#f59e0b', desc: 'Server stores result in Cache', log: 'Server → Cache: store(key, data)', type: 'store' },
              { id: 's7', from: 'server', to: 'app', label: 'RESPONSE', dot: '#3b82f6', desc: 'Server sends response to App', log: 'Response delivered (from DB, now cached)', type: 'response' },
            ],
          };
    }

    if (rs === 'read-through') {
      return hit
        ? {
            isHit: true,
            steps: [
              { id: 's1', from: 'app', to: 'server', label: 'REQUEST', dot: '#3b82f6', desc: 'App sends request to Server', log: 'App → Server: GET /data', type: 'info' },
              { id: 's2', from: 'server', to: 'cache', label: 'Read via cache', dot: '#10b981', desc: 'Server delegates read to Cache', log: 'Server → Cache: read-through(key)', type: 'fetch' },
              { id: 's3', from: 'cache', to: 'server', label: '✓ HIT', dot: '#10b981', desc: 'Cache serves data (HIT)', log: 'Cache HIT — served directly', type: 'hit' },
              { id: 's4', from: 'server', to: 'app', label: 'RESPONSE', dot: '#3b82f6', desc: 'Server returns data to App', log: 'Response from cache', type: 'response' },
            ],
          }
        : {
            isHit: false,
            steps: [
              { id: 's1', from: 'app', to: 'server', label: 'REQUEST', dot: '#3b82f6', desc: 'App sends request to Server', log: 'App → Server: GET /data', type: 'info' },
              { id: 's2', from: 'server', to: 'cache', label: 'Read via cache', dot: '#10b981', desc: 'Server delegates read to Cache', log: 'Server → Cache: read-through(key)', type: 'fetch' },
              { id: 's3', from: 'cache', to: 'db', label: 'Cache fetches from DB', dot: '#ef4444', desc: 'Cache MISS — cache fetches DB', log: 'Cache → DB: miss, fetching data', type: 'miss' },
              { id: 's4', from: 'db', to: 'cache', label: 'Data returned', dot: '#7c3aed', desc: 'DB returns data, cache populates', log: 'DB → Cache: data populated', type: 'store' },
              { id: 's5', from: 'cache', to: 'server', label: 'Serve data', dot: '#10b981', desc: 'Cache returns data to Server', log: 'Cache → Server: data served', type: 'fetch' },
              { id: 's6', from: 'server', to: 'app', label: 'RESPONSE', dot: '#3b82f6', desc: 'Server sends response to App', log: 'Response delivered', type: 'response' },
            ],
          };
    }

    // refresh-ahead — always a hit (pre-warmed)
    return {
      isHit: true,
      steps: [
        { id: 's1', from: 'app', to: 'server', label: 'REQUEST', dot: '#3b82f6', desc: 'App sends request to Server', log: 'App → Server: GET /data', type: 'info' },
        { id: 's2', from: 'server', to: 'cache', label: 'Check cache', dot: '#10b981', desc: 'Server checks pre-warmed cache', log: 'Server → Cache: check(key)', type: 'fetch' },
        { id: 's3', from: 'cache', to: 'server', label: '⚡ Pre-cached', dot: '#06b6d4', desc: 'Cache serves pre-fetched data', log: 'Cache HIT (refresh-ahead pre-loaded)', type: 'hit' },
        { id: 's4', from: 'server', to: 'app', label: 'RESPONSE', dot: '#3b82f6', desc: 'Instant response to App', log: 'Response delivered instantly ⚡', type: 'response' },
        { id: 's5', from: 'cache', to: 'db', label: 'Background refresh', dot: '#94a3b8', desc: '[Async] Cache refreshes from DB', log: 'Background: Cache → DB async prefetch', type: 'fetch' },
        { id: 's6', from: 'db', to: 'cache', label: 'Updated quietly', dot: '#94a3b8', desc: '[Async] Cache silently updated', log: 'Background: Cache refreshed, TTL reset', type: 'store' },
      ],
    };
  }

  // WRITE operations
  if (ws === 'write-through') {
    return {
      steps: [
        { id: 's1', from: 'app', to: 'server', label: 'WRITE', dot: '#7c3aed', desc: 'App sends write request to Server', log: 'App → Server: POST /data', type: 'info' },
        { id: 's2', from: 'server', to: 'cache', label: '1. Write to Cache', dot: '#f59e0b', desc: 'Server writes to Cache simultaneously', log: 'Server → Cache: write(key, data)', type: 'store' },
        { id: 's3', from: 'server', to: 'db', label: '2. Write to DB', dot: '#7c3aed', desc: 'Server writes to DB simultaneously', log: 'Server → DB: insert/update(key, data)', type: 'store' },
        { id: 's4', from: 'cache', to: 'server', label: '✓ Cache ACK', dot: '#f59e0b', desc: 'Cache confirms write', log: 'Cache: write acknowledged', type: 'ack' },
        { id: 's5', from: 'db', to: 'server', label: '✓ DB ACK', dot: '#7c3aed', desc: 'DB confirms write', log: 'DB: write acknowledged', type: 'ack' },
        { id: 's6', from: 'server', to: 'app', label: 'ACK', dot: '#3b82f6', desc: 'Server confirms write to App', log: 'Write confirmed — cache & DB in sync ✓', type: 'response' },
      ],
    };
  }

  if (ws === 'write-behind') {
    return {
      steps: [
        { id: 's1', from: 'app', to: 'server', label: 'WRITE', dot: '#7c3aed', desc: 'App sends write request to Server', log: 'App → Server: POST /data', type: 'info' },
        { id: 's2', from: 'server', to: 'cache', label: '1. Write to Cache', dot: '#f59e0b', desc: 'Server writes to Cache immediately', log: 'Server → Cache: write(key, data) — fast!', type: 'store' },
        { id: 's3', from: 'server', to: 'app', label: '⚡ Fast ACK', dot: '#3b82f6', desc: 'Server ACKs App immediately (no DB wait)', log: 'Write ACK before DB write ⚡', type: 'response', pause: 500 },
        { id: 's4', from: 'cache', to: 'db', label: '2. Async write to DB', dot: '#94a3b8', desc: '[Async] Cache flushes to DB in background', log: 'Background: Cache → DB async flush', type: 'store' },
        { id: 's5', from: 'db', to: 'cache', label: 'DB persisted', dot: '#94a3b8', desc: '[Async] DB confirms persistence', log: 'DB: data persisted asynchronously', type: 'ack' },
      ],
    };
  }

  // write-around
  return {
    steps: [
      { id: 's1', from: 'app', to: 'server', label: 'WRITE', dot: '#7c3aed', desc: 'App sends write request to Server', log: 'App → Server: POST /data', type: 'info' },
      { id: 's2', from: 'server', to: 'db', label: '1. Write directly to DB', dot: '#7c3aed', desc: 'Server writes to DB, bypassing Cache', log: 'Server → DB: direct write (cache bypassed)', type: 'store' },
      { id: 's3', from: 'db', to: 'server', label: '✓ Persisted', dot: '#7c3aed', desc: 'DB confirms write', log: 'DB: write confirmed', type: 'ack' },
      { id: 's4', from: 'server', to: 'app', label: 'ACK', dot: '#3b82f6', desc: 'Server confirms write to App', log: 'Write confirmed — cache NOT updated', type: 'response' },
    ],
  };
}
