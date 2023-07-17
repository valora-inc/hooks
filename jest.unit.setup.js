// Add jest global setup

const { server } = require('./test/server')

beforeAll(() =>
  server.listen({
    // Disable all network requests unless explicitly mocked in MSW
    // This makes sure we don't accidentally make network requests (except for localhost)
    onUnhandledRequest: ({ method, url }) => {
      if (url.hostname !== '127.0.0.1') {
        // If this throws for a unit test, you need to mock the request
        throw new Error(`Unhandled ${method} request to ${url}`)
      }
    },
  }),
)
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
