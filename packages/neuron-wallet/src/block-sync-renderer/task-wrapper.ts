//@ts-nocheck
import Module from 'module';

const originalLoad = Module._load;

Module._load = function (request: string) {
  if (request === 'electron') {
    return {}
  }

  return originalLoad.apply(this, arguments);
};


export * from './task'
