import { ShortcutsHook } from '../../types/shortcuts'

const hook: ShortcutsHook = {
  getShortcutDefinitions() {
    return [
      {
        id: 'claim-reward',
        name: 'Claim',
        description: 'Claim vested rewards',
        networks: ['celo'],
        category: 'claim',
        async onTrigger(network, address, positionAddress) {
          console.log(network, address, positionAddress)
          throw new Error('')
        },
      },
    ]
  },
}

export default hook
