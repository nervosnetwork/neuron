jest.mock('../../../src/env', () => ({
  __esModule: true,
  default: {
    mainURL: 'file:///app/index.html',
  },
}))

import { resolveInternalWindowTarget } from '../../../src/controllers/app/resolve-window-url'

describe('resolveInternalWindowTarget', () => {
  it('accepts internal hash routes', () => {
    expect(resolveInternalWindowTarget('  #/settings/general  ')).toEqual({
      navigationUrl: '/settings/general',
      windowUrl: 'file:///app/index.html#/settings/general',
    })
  })

  it('accepts internal slash routes', () => {
    expect(resolveInternalWindowTarget('/settings/general')).toEqual({
      navigationUrl: '/settings/general',
      windowUrl: 'file:///app/index.html#/settings/general',
    })
  })

  it.each(['https://attacker.example/poc', 'http://127.0.0.1:3000/#/settings', 'file:///tmp/poc.html'])(
    'rejects external target %s',
    target => {
      expect(resolveInternalWindowTarget(target)).toBeNull()
    }
  )
})
