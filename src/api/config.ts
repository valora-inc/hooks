import { z } from 'zod'
import * as dotenv from 'dotenv'
import { NetworkId } from '../types/networkId'

export interface Config {
  GET_TOKENS_INFO_URL: string
  NETWORK_ID_TO_RPC_URL: Partial<Record<NetworkId, string>>
  GOOGLE_CLOUD_PROJECT: string
  POSITION_IDS: string[]
  SHORTCUT_IDS: string[]
}

export function networkIdToRpcUrlTransform(val: string | undefined) {
  if (!val) {
    return {}
  }
  // expected format: network id/rpc url pairs joined by |, and pairs separated by spaces
  // example: 'ethereum-mainnet|https://my-endpoint-name.quiknode.pro/my-api-key celo-mainnet|https://forno.celo.org'
  const pairs: [networkId: NetworkId, rpcUrl: string][] = val
    .split(' ')
    .map((pairString: string) => {
      const [networkIdString, rpcUrl] = pairString.split('|')
      if (rpcUrl === '') {
        throw new Error(`Invalid rpc url for network id: ${networkIdString}`)
      }
      if (!(networkIdString in NetworkId)) {
        throw new Error(`Invalid network id: ${networkIdString}`)
      }
      return [networkIdString as NetworkId, rpcUrl]
    })
  return Object.fromEntries(pairs)
}

export function getConfig(): Config {
  dotenv.config()
  const sharedSchema = z.object({
    GET_TOKENS_INFO_URL: z.string(),
    NETWORK_ID_TO_RPC_URL: z
      .string()
      .optional()
      .transform(networkIdToRpcUrlTransform),
  })

  const productionSchema = z.intersection(
    sharedSchema,
    z.object({
      GOOGLE_CLOUD_PROJECT: z.string().min(1),
      POSITION_IDS: z.string().transform((val) => val.split(',')),
      SHORTCUT_IDS: z.string().transform((val) => val.split(',')),
    }),
  )

  const developmentSchema = z.intersection(
    sharedSchema,
    z.object({
      GOOGLE_CLOUD_PROJECT: z.string().default('dev-project'),
      POSITION_IDS: z
        .string()
        .default('')
        .transform((val) => (val === '' ? [] : val.split(','))),
      SHORTCUT_IDS: z
        .string()
        .default('')
        .transform((val) => (val === '' ? [] : val.split(','))),
    }),
  )

  return process.env.NODE_ENV === 'production'
    ? productionSchema.parse(process.env)
    : developmentSchema.parse(process.env)
}
