#!/usr/bin/env zx

import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path:  path.join(__dirname, '..', 'packages', 'neuron-wallet', '.env.development.local')})
await Promise.all([
  $`cross-env BROWSER=none PORT=${process.env.PORT} yarn run start:ui`,
  $`wait-on http://127.0.0.1:${process.env.PORT} && yarn run start:wallet`
])
console.log('bye')
