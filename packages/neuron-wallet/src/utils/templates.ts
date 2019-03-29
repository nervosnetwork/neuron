import { BrowserWindow } from 'electron'
import i18n from '../i18n'
import { Channel, EXPLORER } from './const'
import { ResponseCode } from '../channel/wallet'
import NetworksController from '../controllers/netowrks'

export const contextMenuTemplates = {
  history: (e: Electron.Event, hash: string) => [
    {
      label: i18n.t('contextmenu.details'),
      click: () => {
        e.sender.send(Channel.NavTo, {
          status: ResponseCode.Success,
          result: { router: `/transaction/${hash}` },
        })
      },
    },
    {
      label: i18n.t('contextmenu.explorer'),
      click: () => {
        const win = new BrowserWindow({
          minWidth: 800,
          minHeight: 600,
          show: false,
          frame: false,
          titleBarStyle: 'hidden',
          webPreferences: {
            nodeIntegration: false,
          },
        })
        win.loadURL(EXPLORER)
        win.show()
      },
    },
  ],
  networksSetting: (e: Electron.Event, id: string) => [
    {
      label: i18n.t('contextmenu.select'),
      enabled: (activeNetwork => {
        return activeNetwork && activeNetwork.id !== id
      })(NetworksController.active().result),
      click: () => {
        NetworksController.setActive(id)
      },
    },
    {
      label: i18n.t('contextmenu.edit'),
      enabled: (defaultNetwork => {
        return defaultNetwork.id !== id
      })(NetworksController.index().result![0]),
      click: () => {
        e.sender.send(Channel.NavTo, {
          status: ResponseCode.Success,
          result: { router: `/network/${id}` },
        })
      },
    },
    {
      label: i18n.t('contextmenu.delete'),
      enabled: (defaultNetwork => {
        return defaultNetwork.id !== id
      })(NetworksController.index().result![0]),
      click: () => {
        NetworksController.delete(id)
      },
    },
  ],
}

export default {
  contextMenuTemplates,
}
