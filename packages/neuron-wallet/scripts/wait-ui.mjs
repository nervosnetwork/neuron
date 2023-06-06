#!/usr/bin/env zx
import { loadEnv } from '@nervina-labs/neuron-shared'
import { $ } from 'zx'

loadEnv()

await $`wait-on http://127.0.0.1:${process.env.PORT}`
