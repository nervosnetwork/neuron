import app from './app'
import chain from './chain'
import wallet from './wallet'
import settings from './settings'

export * from './app'
export * from './chain'
export * from './wallet'
export * from './settings'

const initStates = {
  app,
  chain,
  wallet,
  settings,
}

export default initStates
