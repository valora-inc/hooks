import got, { ExtendOptions, TimeoutError } from 'got'
import { logger } from '../log'

// https://github.com/sindresorhus/got/blob/HEAD/documentation/quick-start.md#options
const options: ExtendOptions = {
  timeout: {
    request: 15 * 1000,
  },
  hooks: {
    beforeError: [
      (err) => {
        if (err instanceof TimeoutError) {
          logger.warn(
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
        logger.debug(
          {
            response: {
              statusCode: response.statusCode,
              statusMessage: response.statusMessage,
              url: response.request.requestUrl,
              timings: response.timings,
              method: response.request.options.method,
            },
          },
          `Request completed with status ${response.statusCode}`,
        )
        return response
      },
    ],
  },
}

const client = got.extend(options)

export default client
