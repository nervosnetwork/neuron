import Application from '../application'

/**
 * 1. navigate to the general settings handleViewError
 * 2. the toggle of skip data and type script should be off
 * 3. click on the toggles and their statuses should be updated
 * 4. refresh the view and the statuses should be preserved
 */
export default (app: Application) => {
  beforeAll(async () => {
    await app.gotoSettingPageFromMenu()
    await app.waitUntilLoaded()
  })

  describe('Test general settings', () => {
    app.test('Check the initialized statuses', async () => {
      const { client } = app.spectron
      const toggles = client.$$('button[role=switch]')
      expect(toggles).toHaveLength(1)
      expect((await client.elementIdAttribute(toggles[1].value.ELEMENT, 'aria-checked')).value).toBe('true')
    })

    app.test('toggle SkipDataAndType to false', async () => {
      const { client } = app.spectron
      await app.waitUntilLoaded()
      const toggles = client.$$('button[role=switch]')

      toggles.forEach((_, idx) => {
        client.elementIdClick(toggles[idx].value.ELEMENT)
      })

      await app.waitUntilLoaded()
      expect((await client.elementIdAttribute(toggles[1].value.ELEMENT, 'aria-checked')).value).toBe('false')
    })

    test.skip('Toggle statuses should be preserved', async () => {})
  })
}
