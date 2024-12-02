// from https://github.com/beefyfinance/beefy-v2/blob/3690e105c4bb98afcf06f9c3e385d13cc23af5cd/src/config/risk.tsx
export const MAX_SCORE = 10

type Risk = {
  category: keyof typeof CATEGORIES
  score: number
  title: string
}

// removed explanation, condition and risks without category / score from the beefy codebase
export const RISKS: Record<string, Risk> = {
  COMPLEXITY_LOW: {
    category: 'Categry-Beefy',
    score: 0,
    title: 'Complexity-Low-Titl',
  },

  COMPLEXITY_MID: {
    category: 'Categry-Beefy',
    score: 0.3,
    title: 'Complexity-Mid-Titl',
  },

  COMPLEXITY_HIGH: {
    category: 'Categry-Beefy',
    score: 0.5,
    title: 'Complexity-Hi-Titl',
  },

  BATTLE_TESTED: {
    category: 'Categry-Beefy',
    score: 0,
    title: 'Testd-Battle-Titl',
  },

  NEW_STRAT: {
    category: 'Categry-Beefy',
    score: 0.3,
    title: 'Testd-New-Titl',
  },

  EXPERIMENTAL_STRAT: {
    category: 'Categry-Beefy',
    score: 0.7,
    title: 'Testd-Experimtl-Titl',
  },

  IL_NONE: {
    category: 'Categry-Asset',
    score: 0,
    title: 'IL-None-Titl',
  },

  IL_LOW: {
    category: 'Categry-Asset',
    score: 0.2,
    title: 'IL-Low-Titl',
  },

  IL_HIGH: {
    category: 'Categry-Asset',
    score: 0.5,
    title: 'IL-High-Titl',
  },

  ALGO_STABLE: {
    category: 'Categry-Asset',
    score: 0.9,
    title: 'IL-AlgoStable-Titl',
  },

  PARTIAL_COLLAT_ALGO_STABLECOIN: {
    category: 'Categry-Asset',
    score: 0.21,
    title: 'PartialCollatAlgoStable-Titl',
  },

  OVER_COLLAT_ALGO_STABLECOIN: {
    category: 'Categry-Asset',
    score: 0.15,
    title: 'OverCollatAlgoStable-Titl',
  },

  LIQ_HIGH: {
    category: 'Categry-Asset',
    score: 0,
    title: 'Liquidt-High-Titl',
  },

  LIQ_LOW: {
    category: 'Categry-Asset',
    score: 0.3,
    title: 'Liquidt-Low-Titl',
  },

  MCAP_LARGE: {
    category: 'Categry-Asset',
    score: 0,
    title: 'MktCap-Large-Titl',
  },

  MCAP_MEDIUM: {
    category: 'Categry-Asset',
    score: 0.1,
    title: 'MktCap-Mid-Titl',
  },

  MCAP_SMALL: {
    category: 'Categry-Asset',
    score: 0.3,
    title: 'MktCap-Small-Titl',
  },

  MCAP_MICRO: {
    category: 'Categry-Asset',
    score: 0.5,
    title: 'MktCap-Micro-Titl',
  },

  SUPPLY_CENTRALIZED: {
    category: 'Categry-Asset',
    score: 1,
    title: 'Concentrated-Titl',
  },

  PLATFORM_ESTABLISHED: {
    category: 'Categry-Platform',
    score: 0,
    title: 'Platfrm-Establshd-Titl',
  },

  PLATFORM_NEW: {
    category: 'Categry-Platform',
    score: 0.5,
    title: 'Platfrm-New-Titl',
  },

  NO_AUDIT: {
    category: 'Categry-Platform',
    score: 0.3,
    title: 'Platfrm-AuditNo-Titl',
  },

  AUDIT: {
    category: 'Categry-Platform',
    score: 0,
    title: 'Platfrm-Audit-Titl',
  },

  CONTRACTS_VERIFIED: {
    category: 'Categry-Platform',
    score: 0,
    title: 'Platfrm-Verified-Titl',
  },

  CONTRACTS_UNVERIFIED: {
    category: 'Categry-Platform',
    score: 1,
    title: 'Platfrm-VerifiedNo-Titl',
  },

  ADMIN_WITH_TIMELOCK: {
    category: 'Categry-Platform',
    score: 0,
    title: 'Platfrm-Timelock-Titl',
  },

  ADMIN_WITH_SHORT_TIMELOCK: {
    category: 'Categry-Platform',
    score: 0.5,
    title: 'Platfrm-TimelockShort-Titl',
  },

  ADMIN_WITHOUT_TIMELOCK: {
    category: 'Categry-Platform',
    score: 1,
    title: 'Platfrm-TimelockNo-Titl',
  },
}

export const CATEGORIES = {
  'Categry-Beefy': 0.2,
  'Categry-Asset': 0.3,
  'Categry-Platform': 0.5,
}
