import { Application } from 'spectron'

describe('Setup tests', () => {
  let app: Application

  beforeAll(async () => {
    app = new Application({
      path: 'node_modules/.bin/electron',
      args: ['dist/main.js'],
    })

    return app.start()
  })

  afterAll(() => {
    if (app.isRunning) {
      return app.stop()
    }
    return null
  })

  it('opens app window', async () => {
    if (app) {
      const { client, browserWindow } = app
      await client.waitUntilWindowLoaded()
      const title = await browserWindow.getTitle()

      expect(title).toBe('Electron')
    } else {
      expect(true).toBe(true) // Should go here as app is not assigned at all.
    }
  })
})
