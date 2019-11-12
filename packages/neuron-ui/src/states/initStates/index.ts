import app from './app'
import chain from './chain'
import wallet from './wallet'
import settings from './settings'
import nervosDAO from './nervosDAO'

export * from './app'
export * from './chain'
export * from './wallet'
export * from './settings'
export * from './nervosDAO'

const initStates = {
  app,
  chain,
  wallet,
  settings,
  nervosDAO,
}

export default initStates
