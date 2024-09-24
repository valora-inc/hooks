import got, { ExtendOptions, TimeoutError } from 'got'
import { logger } from '../log'

const gotLogger = logger.child({ module: 'got', level: 'debug' })

// https://github.com/sindresorhus/got/blob/HEAD/documentation/quick-start.md#options
const options: ExtendOptions = {
  timeout: {
    request: 15 * 1000,
  },
  hooks: {
    beforeError: [
      (err) => {
        if (err instanceof TimeoutError) {
          gotLogger.warn(
            {
              err,
              request: {
                url: err.request.requestUrl,
                options: err.request.options,
                timings: err.timings,
              },
            },
            `Request timed out on ${err.request.options.method} ${err.request.requestUrl}`,
          )
        }
        return err
      },
    ],
    afterResponse: [
      (response) => {
        if (
          response.timings.phases.total &&
          response.timings.phases.total > 5000
        ) {
          gotLogger.debug(
            {
              response: {
                statusCode: response.statusCode,
                statusMessage: response.statusMessage,
                url: response.requestUrl,
                timings: response.timings,
                method: response.request.options.method,
              },
            },
            `Request to ${response.request.options.method} ${response.requestUrl} took longer than 5s`,
          )
        }
        return response
      },
    ],
  },
}

const client = got.extend(options)

export default client
