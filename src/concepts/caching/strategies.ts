export interface Strategy {
  id: string;
  label: string;
  tagline: string;
  pros: string[];
  when: string;
}

export const READ_STRATS: Strategy[] = [
  {
    id: 'cache-aside',
    label: 'Cache Aside',
    tagline: 'App checks cache first. On miss, fetches DB and populates cache itself.',
    pros: ['Simple & full control', 'Great for read-heavy', 'Cache failures are safe'],
    when: 'Read >>> Writes',
  },
  {
    id: 'read-through',
    label: 'Read Through',
    tagline: "Cache sits in front of DB — it fetches data itself on a miss, not the app.",
    pros: ['App only ever talks to cache', 'Lazy population', 'Clean separation'],
    when: 'Repeated reads of same keys',
  },
  {
    id: 'refresh-ahead',
    label: 'Refresh Ahead',
    tagline: 'Cache proactively refreshes hot data before TTL expires. Zero cold misses.',
    pros: ['Near-zero misses', 'Invisible to app', 'Low latency at scale'],
    when: 'Predictable hot data',
  },
];

export const WRITE_STRATS: Strategy[] = [
  {
    id: 'write-through',
    label: 'Write Through',
    tagline: 'Every write goes to cache AND DB simultaneously. Strong consistency always.',
    pros: ['Strong consistency', 'Cache never stale', 'Simple read path'],
    when: 'Data must always be fresh',
  },
  {
    id: 'write-behind',
    label: 'Write Behind',
    tagline: 'Write to cache first, DB updated asynchronously later. Blazing fast writes.',
    pros: ['Very fast writes', 'Reduces DB pressure', 'Good for bursty loads'],
    when: 'Write-heavy, tolerate slight lag',
  },
  {
    id: 'write-around',
    label: 'Write Around',
    tagline: 'Writes bypass cache entirely, go straight to DB. Prevents cache pollution.',
    pros: ['Prevents cache pollution', 'Good for write-once data', 'Simpler write path'],
    when: 'Data written once, rarely read',
  },
];
