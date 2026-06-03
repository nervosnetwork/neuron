import { test, expect } from '../fixtures/electron'

test.describe('Neuron release smoke', () => {
  test('opens the Electron shell against the local UI server', async ({ page }) => {
    await expect(page).toHaveTitle(/Neuron/)
    await expect(page.locator('#root')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('ResizeObserver loop completed with undelivered notifications')
  })

  test('renders the wallet entry route without a renderer crash', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000/#/wizard/')

    await expect(page.locator('#root')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('Unhandled Runtime Error')
    await expect(page.locator('body')).not.toContainText('Cannot read properties of undefined')
  })
})
