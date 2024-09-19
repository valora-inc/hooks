import got, { ExtendOptions } from 'got'

// https://github.com/sindresorhus/got/blob/HEAD/documentation/quick-start.md#options
const options: ExtendOptions = {
  timeout: {
    request: 10 * 1000,
  },
}

const client = got.extend(options)

export default client
