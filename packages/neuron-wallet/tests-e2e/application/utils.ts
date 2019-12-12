import { SpectronClient } from 'spectron'
import { AllElectron } from 'electron'

export const getElementByTagName = async (client: SpectronClient, tagName: string, textContent: string) => {
  const elements = await client.elements(`<${tagName} />`)
  for (let index = 0; index < elements.value.length; index++) {
    const element = elements.value[index];
    const text = await client.elementIdText(element.ELEMENT)
    if (text.value === textContent) {
      return element
    }
  }
  return null
}

// TODO: Refactor this! Integration tests should reply on UI operation, not IPC communications!
export const clickMenu = (electron: AllElectron, labels: string[]) => {
  return electron.ipcRenderer.send('E2E_CLICK_MENU_ITEM', labels)
}

export const getMenuItem = (electron: AllElectron, labels: string[]) => {
  return electron.ipcRenderer.sendSync('E2E_GET_MENU_ITEM', labels)
}

export const editWallet = (electron: AllElectron, walletId: string) => {
  return electron.ipcRenderer.send('E2E_EDIT_WALLET', [walletId])
}

export const quitApp = (electron: AllElectron) => {
  return electron.ipcRenderer.send('E2E_QUIT_APP')
}

export const editNetwork = (electron: AllElectron, networkId: string) => {
  return electron.ipcRenderer.send('E2E_EDIT_NETWORK', [networkId])
}

export const deleteNetwork = (electron: AllElectron, networkId: string) => {
  return electron.ipcRenderer.send('E2E_DELETE_NETWORK', [networkId])
}

export const sleep = (delay: number) => {
  var start = (new Date()).getTime();
  while ((new Date()).getTime() - start < delay) {
    continue;
  }
}
