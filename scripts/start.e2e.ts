import * as $ from 'shelljs'
import terminate from 'terminate/promise'
import yaml from 'js-yaml'
import fs from 'fs'

describe('start', () => {
  it('should start the preview server successfully', async () => {
    const envFileContent = yaml.load(
      fs.readFileSync('src/api/production.yaml', 'utf8'),
    ) as Record<string, string>
    const cliArgs = Object.entries(envFileContent)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ')

    const child = $.exec(`${cliArgs} yarn start`, { async: true })

    // Wait for the server to be ready
    await new Promise<void>((resolve, _reject) => {
      child.stdout!.on('data', function (data: Buffer) {
        const output = data.toString()
        if (output.includes('Server logs will appear below')) {
          resolve()
        }
      })
    })

    if (!child.pid) {
      throw new Error('Child process has no PID')
    }

    // Terminate the child process along with all its children
    await expect(terminate(child.pid)).resolves.toBeUndefined()
  })
})
