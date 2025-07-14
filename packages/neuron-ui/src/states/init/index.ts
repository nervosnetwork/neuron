import app from './app'
import chain from './chain'
import wallet from './wallet'
import settings from './settings'
import nervosDAO from './nervosDAO'
import updater from './updater'
import perun from './perun'

export * from './app'
export * from './chain'
export * from './wallet'
export * from './settings'
export * from './nervosDAO'
export * from './updater'
export * from './perun'

export const initStates = {
  app,
  chain,
  wallet,
  settings,
  nervosDAO,
  updater,
  experimental: null,
  sUDTAccounts: [],
  perunState: { request: { hello: 'world' } },
  perun,
}

export default initStates
