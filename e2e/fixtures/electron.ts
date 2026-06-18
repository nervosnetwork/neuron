import path from 'path'
import { test as base, expect, type Page } from '@playwright/test'
import { _electron as electron, type ElectronApplication } from 'playwright'

type NeuronFixtures = {
  electronApp: ElectronApplication
  page: Page
}

const repoRoot = path.resolve(__dirname, '../..')
const walletPackageDir = path.join(repoRoot, 'packages/neuron-wallet')

export const test = base.extend<NeuronFixtures>({
  electronApp: async ({}, use, testInfo) => {
    const xdgConfigHome = testInfo.outputPath('xdg-config-home')
    const electronApp = await electron.launch({
      args: [walletPackageDir],
      cwd: repoRoot,
      env: {
        ...process.env,
        BROWSER: 'none',
        DISABLE_ESLINT_PLUGIN: 'true',
        NODE_ENV: 'development',
        XDG_CONFIG_HOME: xdgConfigHome,
      },
    })

    await use(electronApp)
    await electronApp.close()
  },

  page: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow({ timeout: 60_000 })
    await page.waitForLoadState('domcontentloaded')
    await use(page)
  },
})

export { expect }
