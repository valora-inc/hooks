import { getHooks } from './getHooks'
import { NetworkId } from '../types/networkId'

export async function getShortcuts(
  networkId?: NetworkId,
  address?: string,
  appIds: string[] = [],
) {
  const hooks = await getHooks(appIds, 'shortcuts')
  const shortcuts = await Promise.all(
    Object.entries(hooks).map(async ([appId, hook]) => {
      const appShortcuts = await hook.getShortcutDefinitions(networkId, address)
      return appShortcuts.map((shortcut) => ({
        ...shortcut,
        appId,
      }))
    }),
  )
  return shortcuts.flat()
}
