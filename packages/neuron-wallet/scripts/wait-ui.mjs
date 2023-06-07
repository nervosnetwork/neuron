#!/usr/bin/env node
/* eslint-disable no-console */
import { loadEnv } from '@nervosnetwork/neuron-shared'
import { exec } from 'node:child_process';

loadEnv()

const child = exec(`npx wait-on http://127.0.0.1:${process.env.PORT}`, { stdio: 'inherit' });

child.on('close', (code) => {
  if (code !== 0) {
    console.log(`child process exited with code ${code}`);
  }
});
