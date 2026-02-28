export interface LBStrategy {
  id: string;
  label: string;
  tagline: string;
  pros: string[];
  when: string;
}

export const LB_STRATEGIES: LBStrategy[] = [
  {
    id: 'round-robin',
    label: 'Round Robin',
    tagline: 'Requests cycle evenly across all healthy servers, one after another.',
    pros: ['Simple & predictable', 'Even distribution', 'No state needed'],
    when: 'Homogenous servers with similar capacity',
  },
  {
    id: 'least-conn',
    label: 'Least Connections',
    tagline: 'New request goes to the server handling the fewest active connections.',
    pros: ['Handles long-lived requests well', 'Dynamic load awareness', 'Prevents hot spots'],
    when: 'Long-lived or variable-length requests',
  },
  {
    id: 'ip-hash',
    label: 'IP Hash',
    tagline: "Client's IP is hashed to always route to the same server. Session persistence.",
    pros: ['Session sticky — no shared state', 'Consistent routing', 'Cache-friendly per server'],
    when: 'Stateful apps without shared session store',
  },
  {
    id: 'weighted',
    label: 'Weighted',
    tagline: 'Servers get different traffic share based on capacity. Powerful servers serve more.',
    pros: ['Handles heterogeneous hardware', 'Configurable ratios', 'Maximises utilisation'],
    when: 'Servers with different specs or capacities',
  },
];
