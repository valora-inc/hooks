// Add jest global setup

const nock = require('nock')

jest.setTimeout(60 * 1000) // 60 secs timeouts

// Allow all network requests
nock.cleanAll()
nock.enableNetConnect()


