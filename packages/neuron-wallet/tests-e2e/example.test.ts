import { Application } from 'spectron'
import path from 'path'

describe('setup tests', () => {
  let app: Application

  beforeAll(async () => {
    let electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron')
    if (process.platform === 'win32') {
      electronPath += '.cmd'
    }

    app = new Application({
      path: electronPath,
      args: [path.join(__dirname, '..', 'dist', 'main.js')],
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

      expect(title).toBe('Neuron')
    }
  })
})
