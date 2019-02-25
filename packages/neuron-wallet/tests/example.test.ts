import { Application } from 'spectron'

describe('Setup tests', () => {
  let app: Application

  beforeEach(() => {
    app = new Application({
      path: 'node_modules/.bin/electron',
      args: ['dist/main.js'],
    })

    return app.start()
  })

  afterEach(() => {
    if (app.isRunning) {
      return app.stop()
    }
    return null
  })

  it('opens app window', async () => {
    const { client, browserWindow } = app

    await client.waitUntilWindowLoaded()
    const title = await browserWindow.getTitle()

    expect(title).toBe('Electron')
  })
})
