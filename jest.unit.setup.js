// Add jest global setup

const nock = require('nock')

// Disable all network connections unless explicitly mocked
// This makes sure we don't accidentally make network requests
nock.cleanAll()
nock.disableNetConnect()
// But allow localhost
nock.enableNetConnect('127.0.0.1')
