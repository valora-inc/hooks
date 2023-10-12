import { getHooks } from './getHooks'

export async function getShortcuts(
  network: string,
  address: string,
  appIds: string[] = [],
) {
  const hooks = await getHooks(appIds, 'shortcuts')
  const shortcuts = await Promise.all(
    Object.entries(hooks).map(async ([appId, hook]) => {
      const appShortcuts = await hook.getShortcutDefinitions(network, address)
      return appShortcuts.map((shortcut) => ({
        ...shortcut,
        appId,
      }))
    }),
  )
  return shortcuts.flat()
}
