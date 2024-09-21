// Helper script to trigger a shortcut
/* eslint-disable no-console */
import yargs from 'yargs'
import { Address, createWalletClient, http, createPublicClient } from 'viem'
import { mnemonicToAccount } from 'viem/accounts'
import { celo } from 'viem/chains'
import { getShortcuts } from '../src/runtime/getShortcuts'
import { NetworkId } from '../src/types/networkId'
import { z } from 'zod'

const CELO_DERIVATION_PATH = "m/44'/52752'/0'/0/0"

const argv = yargs(process.argv.slice(2))
  .parserConfiguration({
    'parse-numbers': false, // prevents 0x{string} from being parsed as a number
  })
  .usage(
    'Usage: $0 --network <network> --address <address> --app <appId> --shortcut <shortcutId> [<triggerInput>...]',
  )
  .env('')
  .options({
    networkId: {
      alias: 'n',
      describe: 'Network ID to get positions for',
      choices: Object.values(NetworkId),
      default: NetworkId['celo-mainnet'],
    },
    address: {
      alias: 'a',
      describe: 'Address to get positions for',
      type: 'string',
      demandOption: true,
    },
    app: {
      alias: 'p',
      describe: 'App ID of the shortcut to trigger',
      type: 'string',
      demandOption: true,
    },
    shortcut: {
      alias: 's',
      describe: 'Shortcut ID to trigger',
      type: 'string',
      demandOption: true,
    },
    mnemonic: {
      describe: 'Mnemonic to use to sign the shortcut transaction(s)',
      type: 'string',
    },
    derivationPath: {
      describe: 'Derivation path to use to sign the shortcut transaction(s)',
      type: 'string',
      default: CELO_DERIVATION_PATH,
    },
  })
  .parseSync()

void (async () => {
  const shortcuts = await getShortcuts(argv.networkId, argv.address, [argv.app])

  const shortcut = shortcuts.find((s) => s.id === argv.shortcut)
  if (!shortcut) {
    throw new Error(
      `No shortcut found with id '${
        argv.shortcut
      }', available shortcuts: ${shortcuts.map((s) => s.id).join(', ')}`,
    )
  }

  // TODO: consider showing a user friendly prompt to fill in the trigger input
  // or at least a list of the expected fields
  // This just throws a Zod error if the input is not valid
  const triggerInput = z.object(shortcut.triggerInputShape).parse(argv)

  const triggerArgs = {
    networkId: argv.networkId,
    address: argv.address,
    ...triggerInput,
  }

  console.log(
    `Triggering shortcut '${shortcut.id}' for app '${shortcut.appId}'`,
    triggerArgs,
  )
  const result = await shortcut.onTrigger(triggerArgs)

  console.log('Transaction(s) to send:', result)

  if (!argv.mnemonic) {
    console.log('No mnemonic provided, skipping transaction sending')
    return
  }

  const account = mnemonicToAccount(argv.mnemonic, {
    path: argv.derivationPath as any,
  })

  if (account.address.toLowerCase() !== argv.address.toLowerCase()) {
    throw new Error(
      `Derived address '${account.address}' from mnemonic does not match the provided address '${argv.address}'`,
    )
  }

  const wallet = createWalletClient({
    account,
    chain: celo,
    transport: http(),
  })
  const client = createPublicClient({
    chain: celo,
    transport: http(),
  })

  for (const transaction of result.transactions) {
    const txHash = await wallet.sendTransaction({
      // from: transaction.from as Address,
      to: transaction.to as Address,
      data: transaction.data as `0x${string}`,
    })
    console.log(`Transaction sent, waiting for receipt: ${txHash}`)

    const receipt = await client.waitForTransactionReceipt({ hash: txHash })

    console.log('Transaction receipt:', receipt)
  }
})()
