import { dialog, shell } from 'electron'
import { t } from 'i18next'

import env from '../env'

export const VC_REDIST_URL = 'https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist?view=msvc-170'

export const showCkbDependencyDialog = () => {
  const I18N_PATH = `messageBox.ckb-dependency`
  return dialog
    .showMessageBox({
      type: 'info',
      buttons: ['install-and-exit'].map(label => t(`${I18N_PATH}.buttons.${label}`)),
      defaultId: 0,
      title: t(`${I18N_PATH}.title`),
      message: t(`${I18N_PATH}.message`),
      detail: t(`${I18N_PATH}.detail`),
      cancelId: 0,
      noLink: true,
    })
    .then(() => {
      shell.openExternal(VC_REDIST_URL)
      env.app.quit()
      return false
    })
}
