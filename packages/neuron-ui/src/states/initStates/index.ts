import app from './app'
import chain from './chain'
import wallet from './wallet'
import settings from './settings'
import nervosDAO from './nervosDAO'
import updater from './updater'

export * from './app'
export * from './chain'
export * from './wallet'
export * from './settings'
export * from './nervosDAO'
export * from './updater'

const initStates = {
  app,
  chain,
  wallet,
  settings,
  nervosDAO,
  updater,
  experimental: null,
}

export default initStates
