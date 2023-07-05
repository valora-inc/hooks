/* eslint-disable no-console */
import yargs from 'yargs'
import qrcodeTerminal from 'qrcode-terminal'
import internalIp from 'internal-ip'
import * as $ from 'shelljs'

$.config.fatal = true

const DEFAULT_PORT = 18000

const argv = yargs(process.argv.slice(2))
  .usage('Usage: $0 [--watch]')
  .options({
    watch: {
      alias: 'w',
      describe: 'Watch for changes, defaults to true',
      type: 'boolean',
      default: true,
    },
    port: {
      alias: 'p',
      describe: `Port to listen on, defaults to ${DEFAULT_PORT}`,
      type: 'number',
      default: DEFAULT_PORT,
    },
  })
  .parseSync()

const colors = {
  bold: [1, 22],
  italic: [3, 23],
  underline: [4, 24],
  inverse: [7, 27],
  white: [37, 39],
  grey: [90, 39],
  black: [30, 39],
  blue: [34, 39],
  cyan: [36, 39],
  green: [32, 39],
  magenta: [35, 39],
  red: [31, 39],
  yellow: [33, 39],
}

/**
 * Add colors to the specified string, for colorized output in terminals
 */
function stylize(str: string, color: keyof typeof colors) {
  if (!str) {
    return ''
  }

  const codes = colors[color]
  if (codes) {
    return '\x1B[' + codes[0] + 'm' + str + '\x1B[' + codes[1] + 'm'
  }
  return str
}

void (async () => {
  console.log('Starting hooks preview API server...')

  function printServerInfo() {
    const ipAddress = internalIp.v4.sync()
    if (!ipAddress) {
      throw new Error('Could not determine IP address')
    }

    const serverUrl = `http://${ipAddress}:${argv.port}`

    const deeplink = `celo://wallet/enableHooksPreview?hooksApiUrl=${encodeURIComponent(
      serverUrl,
    )}`
    // This directly prints the QR code to the terminal
    qrcodeTerminal.generate(deeplink, { small: true })
    console.log(stylize(deeplink, 'grey') + '\n')

    console.log(`› Server URL: ${serverUrl}`)
    console.log(
      `› Scan the QR code above with Valora to enable live preview of hooks\n`,
    )
    console.log(
      `Server logs will appear below. ${stylize(
        'Press Ctrl+C to exit.',
        'grey',
      )}`,
    )
  }

  function startServer(command: string) {
    const child = $.exec(command, { async: true, silent: true })
    let serverReadyOnce = false
    // This string is printed by the functions-framework when the server is ready
    const serverReadyString = `URL: http://localhost:${argv.port}/`

    // Wait for the server to be ready before printing the server info
    child.stdout!.on('data', function (data: Buffer) {
      let readyIndex = -1
      const output = data.toString()
      // Remove serverReadyString from the output if it exists
      readyIndex = output.indexOf(serverReadyString)
      if (readyIndex > -1) {
        data = Buffer.from(
          output.slice(0, readyIndex) +
            output.slice(readyIndex + serverReadyString.length),
        )
      }

      process.stdout.write(data)

      if (readyIndex > -1) {
        if (!serverReadyOnce) {
          printServerInfo()
        } else {
          console.log('› Server restarted and ready')
        }
        serverReadyOnce = true
      }
    })

    child.stderr!.on('data', function (data: Buffer) {
      process.stderr.write(data)
    })
  }

  const serverCommand = `functions-framework --target=hooks-api --signature-type=http --port=${argv.port}`

  if (argv.watch) {
    startServer(`tsc-watch --noClear --onSuccess "${serverCommand}"`)
  } else {
    $.exec('yarn build')
    startServer(serverCommand)
  }
})()
