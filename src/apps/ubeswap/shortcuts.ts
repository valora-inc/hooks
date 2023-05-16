import { ShortcutsHook } from '../../shortcuts'

const hook: ShortcutsHook = {
  getShortcutDefinitions() {
    return [
      {
        id: 'claim-reward',
        name: 'Claim',
        description: 'Claim rewards for staked liquidity',
        networks: ['celo'],
        category: 'claim',
        async onTrigger(_network, _address, _positionAddress) {
          // TODO: return the unsigned transaction to claim the reward
          return []
        },
      },
    ]
  },
}

export default hook
