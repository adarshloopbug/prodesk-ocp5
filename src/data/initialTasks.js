/**
 * Seed dataset of Enterprise Verification Tickets
 * Used to initialize WorkflowEngine state
 */
export const INITIAL_TASKS = [
  {
    id: 1,
    ticketNumber: 'TCK-1049',
    title: 'KYC Identity Verification - Enterprise Client (Acme Holdings Ltd)',
    description: 'Automated biometric match flagged high-confidence facial scan discrepancy. Requires manual analyst review against government issued passport.',
    category: 'Identity Compliance',
    priority: 'HIGH',
    status: 'PENDING',
    assignee: 'Sarah Connor',
    riskScore: '0.14 - Low Risk',
    submittedAt: '5 mins ago',
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    history: [
      {
        status: 'PENDING',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        user: 'System Ingestion Bot',
      },
    ],
  },
  {
    id: 2,
    ticketNumber: 'TCK-1052',
    title: 'AML Sanctions & PEP Screening Match - Apex Global Trade',
    description: 'Secondary name variation match against OFAC SDN List tier-2 sanctions registry. Entity has requested cross-border settlement.',
    category: 'Sanctions / AML',
    priority: 'CRITICAL',
    status: 'PENDING',
    assignee: 'Marcus Vance',
    riskScore: '0.82 - Critical Risk',
    submittedAt: '12 mins ago',
    updatedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    history: [
      {
        status: 'PENDING',
        timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        user: 'FinCEN Stream Watcher',
      },
    ],
  },
  {
    id: 3,
    ticketNumber: 'TCK-1055',
    title: 'High-Value Treasury Settlement ($2,450,000 USD)',
    description: 'Dual-authorization wire transfer request for Q3 Liquidity Provider rebalancing. Requires senior risk officer sign-off.',
    category: 'Treasury Ops',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assignee: 'Elena Rostova',
    riskScore: '0.28 - Moderate Risk',
    submittedAt: '24 mins ago',
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    history: [
      {
        status: 'PENDING',
        timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
        user: 'Treasury Gateway',
      },
      {
        status: 'IN_PROGRESS',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        user: 'Elena Rostova',
      },
    ],
  },
  {
    id: 4,
    ticketNumber: 'TCK-1058',
    title: 'Vendor SOC 2 Type II Security Clearance - Cloudflare CDN Partner',
    description: 'Annual vendor security assessment verification. Trust report verified with zero exceptions noted on trust services criteria.',
    category: 'SecOps Audit',
    priority: 'MEDIUM',
    status: 'PENDING',
    assignee: 'Devon Miles',
    riskScore: '0.04 - Negligible',
    submittedAt: '35 mins ago',
    updatedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    history: [
      {
        status: 'PENDING',
        timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        user: 'SecOps Pipeline',
      },
    ],
  },
  {
    id: 5,
    ticketNumber: 'TCK-1060',
    title: 'Automated Fraud Heuristics Alert - Merchant Account #90841',
    description: 'Velocity anomaly detected: 48 micro-transactions within 90 seconds from distributed IP subnets. Rapid mitigation initiated.',
    category: 'Fraud Prevention',
    priority: 'CRITICAL',
    status: 'APPROVED',
    assignee: 'Security Auto-Shield',
    riskScore: '0.94 - Flagged Action',
    submittedAt: '1 hour ago',
    updatedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    history: [
      {
        status: 'PENDING',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        user: 'Heuristics Shield',
      },
      {
        status: 'APPROVED',
        timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        user: 'Risk Lead John D.',
      },
    ],
  },
];
