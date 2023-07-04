import { promises as fs } from 'fs'
import path from 'path'
import { PositionsHook } from '../types/positions'
import { ShortcutsHook } from '../types/shortcuts'

type HookTypeName = 'positions' | 'shortcuts'

type HookType<T> = T extends 'positions'
  ? PositionsHook
  : T extends 'shortcuts'
  ? ShortcutsHook
  : never

const APP_ID_PATTERN = /^[a-zA-Z0-9-]+$/

async function getAllAppIds(): Promise<string[]> {
  // Read all folders from the "apps" folder
  const files = await fs.readdir(path.join(__dirname, 'apps'), {
    withFileTypes: true,
  })
  const folders = files.filter((file) => file.isDirectory())
  // Check that all folders are valid app ids
  for (const folder of folders) {
    if (!APP_ID_PATTERN.test(folder.name)) {
      throw new Error(
        `Invalid app id: '${folder.name}', must match ${APP_ID_PATTERN}`,
      )
    }
  }
  return folders.map((folder) => folder.name)
}

export async function getHooks<T extends HookTypeName>(
  appIds: string[],
  hookType: T,
): Promise<Record<string, HookType<T>>> {
  const allAppIds = await getAllAppIds()
  const hooks: Record<string, HookType<T>> = {}
  const appIdsToLoad = appIds.length === 0 ? allAppIds : appIds
  for (const appId of appIdsToLoad) {
    if (!allAppIds.includes(appId)) {
      throw new Error(
        `No app with id '${appId}' found, available apps: ${allAppIds.join(
          ', ',
        )}`,
      )
    }

    let hook: any
    try {
      hook = await import(`./apps/${appId}/${hookType}`)
    } catch (e) {
      if (appIds.includes(appId)) {
        if ((e as any).code === 'MODULE_NOT_FOUND') {
          throw new Error(
            `No ${hookType} hook found for app '${appId}', make sure to export a default hook from 'src/apps/${appId}/${hookType}.ts'`,
          )
        }
        throw e
      }
    }
    if (hook?.default) {
      hooks[appId] = hook.default
    }
  }
  return hooks
}
