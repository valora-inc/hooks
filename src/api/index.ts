import { HttpFunction, http } from '@google-cloud/functions-framework'
import { createLoggingMiddleware } from '@valora/logging'
import {
  HttpError,
  asyncHandler as valoraAsyncHandler,
} from '@valora/http-handler'
import express from 'express'
import { z } from 'zod'
import { getConfig } from './config'
import { logger } from '../log'
import { parseRequest } from './parseRequest'
import { getPositions } from '../runtime/getPositions'
import { getShortcuts } from '../runtime/getShortcuts'

function asyncHandler(handler: HttpFunction) {
  return valoraAsyncHandler(handler, logger)
}

function createApp() {
  const config = getConfig()

  const app = express()
  app.use(
    createLoggingMiddleware({
      logger,
      projectId: config.GOOGLE_CLOUD_PROJECT,
    }),
  )

  const getHooksRequestSchema = z.object({
    query: z.object({
      network: z.string({ required_error: 'network is required' }),
      address: z
        .string({ required_error: 'address is required' })
        .regex(/^0x[a-fA-F0-9]{40}$/)
        .transform((val) => val.toLowerCase()),
    }),
  })

  app.get(
    '/getPositions',
    asyncHandler(async (req, res) => {
      const parsedRequest = await parseRequest(req, getHooksRequestSchema)
      const { network, address } = parsedRequest.query
      const positions = await getPositions(network, address, config.APP_IDS)
      res.send({ message: 'OK', data: positions })
    }),
  )

  app.get(
    '/getShortcuts',
    asyncHandler(async (_req, res) => {
      const shortcuts = await getShortcuts(undefined, undefined, config.APP_IDS)
      res.send({ message: 'OK', data: shortcuts })
    }),
  )

  app.get(
    '/v2/getShortcuts',
    asyncHandler(async (req, res) => {
      const parsedRequest = await parseRequest(req, getHooksRequestSchema)
      const { network, address } = parsedRequest.query
      const shortcuts = await getShortcuts(network, address, config.APP_IDS)
      res.send({ message: 'OK', data: shortcuts })
    }),
  )

  const triggerShortcutRequestSchema = z.object({
    body: z.object({
      network: z.string({ required_error: 'network is required' }),
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
  })

  app.post(
    '/triggerShortcut',
    asyncHandler(async (req, res) => {
      const parsedRequest = await parseRequest(
        req,
        triggerShortcutRequestSchema,
      )

      const { network, address, appId, shortcutId, positionAddress } =
        parsedRequest.body

      const shortcuts = await getShortcuts(network, address, [appId])

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
        network,
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
