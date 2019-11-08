import Application from '../application'

export default (app: Application) => {
  beforeAll(async () => {
    await app.gotoSettingPageFromMenu()
    await app.waitUntilLoaded()
  })

  describe.skip('Test general settings', () => {})
}
