import * as $ from 'shelljs'
import terminate from 'terminate/promise'

describe('start', () => {
  it('should start the preview server successfully', async () => {
    const child = $.exec(`yarn start`, { async: true })

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
