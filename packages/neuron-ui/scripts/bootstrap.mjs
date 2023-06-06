#!/usr/bin/env zx

import { loadEnv } from '@nervina-labs/neuron-shared'

loadEnv()

const arg1 = process.argv[3]

if (arg1 !== 'start' && arg1 !== 'build') {
  throw new Error(`Invalid argument ${arg1}`)
}
const isDevMode = process.env.NODE_ENV === 'development'

const vars = [
  isDevMode && 'PORT',
  isDevMode && 'BROWSER',
  'DISABLE_ESLINT_PLUGIN',
  'GENERATE_SOURCEMAP'
].filter(Boolean).map((key) => `${key}=${process.env[key]}`)

$`${vars} react-app-rewired ${arg1}`
