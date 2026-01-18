import '@testing-library/jest-dom'
import dotenv from 'dotenv'
import { TextEncoder, TextDecoder } from 'util'

// Load .env.local for tests (this provides DATABASE_URL and JWT_SECRET)
dotenv.config({ path: '.env.local' })

// Set NODE_ENV for tests
process.env.NODE_ENV = 'test'

// Polyfill TextEncoder/TextDecoder for jsdom
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock crypto for Node < 19
if (!global.crypto) {
  global.crypto = require('crypto').webcrypto
}

// Polyfill fetch APIs for jsdom (needed for Next.js Request/Response)
if (typeof global.fetch === 'undefined') {
  const nodeFetch = require('node-fetch')
  global.fetch = nodeFetch.default || nodeFetch
  global.Request = nodeFetch.Request
  global.Response = nodeFetch.Response
  global.Headers = nodeFetch.Headers
}

// Mock Response.json static method for Next.js compatibility
// Next.js extends Response with a static json() method
if (global.Response && !global.Response.json) {
  global.Response.json = function(data, init = {}) {
    const response = new global.Response(JSON.stringify(data), init)
    response.headers.set('content-type', 'application/json')
    return response
  }
}
