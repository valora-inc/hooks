// Helper script to trigger a shortcut
/* eslint-disable no-console */
import yargs from 'yargs'
import { Address, createWalletClient, http, createPublicClient } from 'viem'
import { mnemonicToAccount } from 'viem/accounts'
import { celo } from 'viem/chains'
import { getShortcuts } from '../src/getShortcuts'

const CELO_DERIVATION_PATH = "m/44'/52752'/0'/0/0"

const argv = yargs(process.argv.slice(2))
  .usage(
    'Usage: $0 --network <network> --address <address> --app <appId> --shortcut <shortcutId> --positionAddress <positionAddress>',
  )
  .env('')
  .options({
    network: {
      alias: 'n',
      describe: 'Network to get positions for',
      choices: ['celo', 'celoAlfajores'],
      default: 'celo',
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
    positionAddress: {
      describe: 'Position address to trigger the shortcut on',
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
  const shortcuts = await getShortcuts([argv.app])

  const shortcut = shortcuts.find((s) => s.id === argv.shortcut)
  if (!shortcut) {
    throw new Error(
      `No shortcut found with id '${
        argv.shortcut
      }', available shortcuts: ${shortcuts.map((s) => s.id).join(', ')}`,
    )
  }

  console.log(
    `Triggering shortcut '${shortcut.id}' for app '${shortcut.appId}'`,
    {
      network: argv.network,
      address: argv.address,
      positionAddress: argv.positionAddress,
    },
  )
  const result = await shortcut.onTrigger(
    argv.network,
    argv.address,
    argv.positionAddress,
  )

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

  for (const transaction of result) {
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
