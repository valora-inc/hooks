import { http, HttpFunction } from '@google-cloud/functions-framework'
import { createLoggingMiddleware } from '@valora/logging'
import {
  asyncHandler as valoraAsyncHandler,
  HttpError,
} from '@valora/http-handler'
import express from 'express'
import { z } from 'zod'
import { getConfig } from './config'
import { logger } from '../log'
import { parseRequest } from './parseRequest'
import { getPositions } from '../runtime/getPositions'
import { getShortcuts } from '../runtime/getShortcuts'
import {
  LegacyNetwork,
  legacyNetworkToNetworkId,
  NetworkId,
} from '../types/networkId'

function asyncHandler(handler: HttpFunction) {
  return valoraAsyncHandler(handler, logger)
}

const backwardsCompatibleNetworkSchema = z.union([
  z.object({ network: z.nativeEnum(LegacyNetwork) }), // legacy schema: 'celo' or 'celoAlfajores' passed as 'network' field on the request
  z.object({ networkId: z.nativeEnum(NetworkId) }), // current schema: any member of NetworkId enum passed as 'networkId' field on the request
])

async function createApp() {
  const config = await getConfig()

  const app = express()
  app.use(
    createLoggingMiddleware({
      logger,
      projectId: config.GOOGLE_CLOUD_PROJECT,
    }),
  )

  const getHooksRequestSchema = z.object({
    query: z.intersection(
      z.object({
        address: z
          .string({ required_error: 'address is required' })
          .regex(/^0x[a-fA-F0-9]{40}$/)
          .transform((val) => val.toLowerCase()),
      }),
      backwardsCompatibleNetworkSchema,
    ),
  })

  app.get(
    '/getPositions',
    asyncHandler(async (req, res) => {
      const parsedRequest = await parseRequest(req, getHooksRequestSchema)
      const { address } = parsedRequest.query
      const networkId =
        'network' in parsedRequest.query
          ? legacyNetworkToNetworkId[parsedRequest.query.network]
          : parsedRequest.query.networkId
      const positions = await getPositions(
        networkId,
        address,
        config.POSITION_IDS,
        config.GET_TOKENS_INFO_URL,
      )
      res.send({ message: 'OK', data: positions })
    }),
  )

  app.get(
    '/getShortcuts',
    asyncHandler(async (_req, res) => {
      const shortcuts = await getShortcuts(
        undefined,
        undefined,
        config.SHORTCUT_IDS,
      )
      res.send({ message: 'OK', data: shortcuts })
    }),
  )

  app.get(
    '/v2/getShortcuts',
    asyncHandler(async (req, res) => {
      const parsedRequest = await parseRequest(req, getHooksRequestSchema)
      const { address } = parsedRequest.query
      const networkId =
        'network' in parsedRequest.query
          ? legacyNetworkToNetworkId[parsedRequest.query.network]
          : parsedRequest.query.networkId
      const shortcuts = await getShortcuts(
        networkId,
        address,
        config.SHORTCUT_IDS,
      )
      res.send({ message: 'OK', data: shortcuts })
    }),
  )

  const triggerShortcutRequestSchema = z.object({
    body: z.intersection(
      z.object({
        address: z
          .string({ required_error: 'address is required' })
          .regex(/^0x[a-fA-F0-9]{40}$/)
          .transform((val) => val.toLowerCase()),
        appId: z.string({ required_error: 'appId is required' }),
        shortcutId: z.string({ required_error: 'shortcutId is required' }),
        positionAddress: z
          .string({ required_error: 'positionAddress is required' })
          .regex(/^0x[a-fA-F0-9]{40}$/)
          .transform((val) => val.toLowerCase()),
      }),
      backwardsCompatibleNetworkSchema,
    ),
  })

  app.post(
    '/triggerShortcut',
    asyncHandler(async (req, res) => {
      const parsedRequest = await parseRequest(
        req,
        triggerShortcutRequestSchema,
      )

      const { address, appId, shortcutId, positionAddress } = parsedRequest.body

      const networkId =
        'network' in parsedRequest.body
          ? legacyNetworkToNetworkId[parsedRequest.body.network]
          : parsedRequest.body.networkId

      const shortcuts = await getShortcuts(networkId, address, [appId])

      const shortcut = shortcuts.find((s) => s.id === shortcutId)
      if (!shortcut) {
        throw new HttpError(
          400,
          `No shortcut found with id '${shortcutId}' for app '${appId}', available shortcuts: ${shortcuts
            .map((s) => s.id)
            .join(', ')}`,
        )
      }

      const transactions = await shortcut.onTrigger(
        networkId,
        address,
        positionAddress,
      )
      res.send({ message: 'OK', data: { transactions } })
    }),
  )

  // We'll add more routes here

  return app
}

// Register the main Cloud Function
http('hooks-api', createApp())
