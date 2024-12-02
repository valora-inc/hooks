import { TFunction } from 'i18next'
import { BaseBeefyVault } from './api'
import { getSafety } from './safety'

const mockT = ((x: string) => x) as TFunction

describe('safety', () => {
  it('returns safety info for known risks', () => {
    const safety = getSafety(
      {
        risks: [
          'COMPLEXITY_LOW',
          'BATTLE_TESTED',
          'IL_NONE',
          'MCAP_LARGE',
          'AUDIT',
          'CONTRACTS_VERIFIED',
        ],
        id: 'mock-vault',
      } as BaseBeefyVault,
      mockT,
    )

    expect(safety).toEqual({
      level: 'high',
      risks: [
        {
          category: 'beefyRisks.Categry-Beefy',
          isPositive: true,
          title: 'beefyRisks.Complexity-Low-Titl',
        },
        {
          category: 'beefyRisks.Categry-Beefy',
          isPositive: true,
          title: 'beefyRisks.Testd-Battle-Titl',
        },
        {
          category: 'beefyRisks.Categry-Asset',
          isPositive: true,
          title: 'beefyRisks.IL-None-Titl',
        },
        {
          category: 'beefyRisks.Categry-Asset',
          isPositive: true,
          title: 'beefyRisks.MktCap-Large-Titl',
        },
        {
          category: 'beefyRisks.Categry-Platform',
          isPositive: true,
          title: 'beefyRisks.Platfrm-Audit-Titl',
        },
        {
          category: 'beefyRisks.Categry-Platform',
          isPositive: true,
          title: 'beefyRisks.Platfrm-Verified-Titl',
        },
      ],
    })
  })

  it('returns undefined if no known risks', () => {
    const safety = getSafety(
      {
        risks: ['foo', 'bar'] as string[],
        id: 'mock-vault',
      } as BaseBeefyVault,
      mockT,
    )

    expect(safety).toBeUndefined()
  })

  it('excludes unknown risks if there are some unknown risks', () => {
    const safety = getSafety(
      {
        risks: ['foo', 'EXPERIMENTAL_STRAT', 'MCAP_MICRO'] as string[],
        id: 'mock-vault',
      } as BaseBeefyVault,
      mockT,
    )

    expect(safety).toEqual({
      level: 'medium',
      risks: [
        {
          category: 'beefyRisks.Categry-Beefy',
          isPositive: false,
          title: 'beefyRisks.Testd-Experimtl-Titl',
        },
        {
          category: 'beefyRisks.Categry-Asset',
          isPositive: false,
          title: 'beefyRisks.MktCap-Micro-Titl',
        },
      ],
    })
  })
})
