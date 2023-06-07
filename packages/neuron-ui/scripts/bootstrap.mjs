#!/usr/bin/env node
/* eslint-disable no-console */
import { loadEnv } from '@nervosnetwork/neuron-shared'
import { exec } from 'node:child_process'

loadEnv()

const arg1 = process.argv[2]

if (arg1 !== 'start' && arg1 !== 'build') {
  throw new Error(`Invalid argument ${arg1}`)
}
const isDevMode = process.env.NODE_ENV === 'development'

const vars = [
  isDevMode && 'PORT',
  isDevMode && 'BROWSER',
  'DISABLE_ESLINT_PLUGIN',
  'GENERATE_SOURCEMAP'
].filter(Boolean).map((key) => `${key}=${process.env[key]}`).join(' ')

const command = `npx cross-env ${vars} react-app-rewired ${arg1}`

const child = exec(command, { stdio: 'inherit' })
child.on('close', (code) => {
  if (code !== 0) {
    console.log(`child process exited with code ${code}`);
  }
});
