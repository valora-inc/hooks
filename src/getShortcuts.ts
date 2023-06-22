import { getHooks } from './getHooks'

export async function getShortcuts(appIds: string[] = []) {
  const hooks = await getHooks(appIds, 'shortcuts')
  const shortcuts = await Promise.all(
    Object.entries(hooks).map(async ([appId, hook]) => {
      const appShortcuts = await hook.getShortcutDefinitions()
      return appShortcuts.map((shortcut) => ({
        ...shortcut,
        appId,
      }))
    }),
  )
  return shortcuts.flat()
}
