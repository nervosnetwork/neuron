import Module from 'module'

const originalLoad = Module._load

Module._load = function (...args) {
  if (args[0] === 'electron') {
    return {}
  }

  return originalLoad.apply(this, args)
}

export * from './task'
