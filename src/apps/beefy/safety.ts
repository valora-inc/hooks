import { TFunction } from 'i18next'
import { Safety } from '../../types/positions'
import { MAX_SCORE, RISKS, CATEGORIES } from './safetyConfig'
import { logger } from '../../log'
import { BaseBeefyVault } from './api'

// From https://github.com/beefyfinance/beefy-v2/blob/3690e105c4bb98afcf06f9c3e385d13cc23af5cd/src/helpers/safetyScore.tsx
const calcRisk = (risks: string[]) => {
  const categories: Record<string, string[]> = {}
  for (const c of Object.keys(CATEGORIES)) {
    categories[c] = []
  }

  // reverse lookup
  risks.forEach((risk) => {
    // should never happen with check below, but leaving as is from beefy codebase
    if (!(risk in RISKS)) {
      return
    }

    // should never happen with type safety, but leaving as is from beefy codebase
    const cat = RISKS[risk].category
    if (!(cat in CATEGORIES)) {
      return
    }

    categories[cat].push(risk)
  })

  // reduce & clamp
  let score = 0
  for (const [category, weight] of Object.entries(CATEGORIES)) {
    score +=
      weight *
      Math.min(
        1,
        categories[category].reduce(
          (acc: number, risk: string) => acc + RISKS[risk].score,
          0,
        ),
      )
  }

  return score
}

const safetyScore = (risks: string[]) => {
  const score = MAX_SCORE * (1 - calcRisk(risks))
  // from https://github.com/beefyfinance/beefy-v2/blob/3690e105c4bb98afcf06f9c3e385d13cc23af5cd/src/components/SafetyScore/SafetyScore.tsx#L27-L29
  return score > 7.5 ? 'high' : score >= 6.4 ? 'medium' : 'low'
}

export function getSafety(
  vault: BaseBeefyVault,
  t: TFunction,
): Safety | undefined {
  const { risks } = vault
  const knownRisks = risks.filter((risk) => !!RISKS[risk])

  if (knownRisks.length !== risks.length) {
    logger.warn({ vault }, 'Beefy vault has unknown risks')
  }

  if (!knownRisks.length) return
  return {
    level: safetyScore(knownRisks),
    risks: knownRisks.map((risk) => {
      const { category, title, score } = RISKS[risk]
      return {
        // from https://github.com/beefyfinance/beefy-v2/blob/3690e105c4bb98afcf06f9c3e385d13cc23af5cd/src/features/vault/components/SafetyCard/SafetyCard.tsx#L39
        // score represents the level of the risk, higher is worse
        isPositive: score <= 0,
        title: t(`beefyRisks.${title}`),
        category: t(`beefyRisks.${category}`),
      }
    }),
  }
}
