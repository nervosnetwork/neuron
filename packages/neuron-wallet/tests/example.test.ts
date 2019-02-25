import { Application } from 'spectron'

describe('Setup tests', () => {
  let app: Application
  const delay = (time: number) => new Promise(resolve => setTimeout(resolve, time))

  beforeAll(async () => {
    app = new Application({
      path: 'node_modules/.bin/electron',
      args: ['dist/main.js'],
      startTimeout: 10_000,
      waitTimeout: 10_000,
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
    const { client, browserWindow } = app

    await client.waitUntilWindowLoaded()
    await delay(500)
    const title = await browserWindow.getTitle()

    expect(title).toBe('Electron')
  })
})
