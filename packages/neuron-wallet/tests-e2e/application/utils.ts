import { SpectronClient } from 'spectron'
import { AllElectron } from 'electron'
import axios, { AxiosResponse } from 'axios'

var port = 22333;
axios.defaults.baseURL = location.protocol + '//' + location.hostname + ':' + port;

export const fetchRunningAppCount = () => {
  return axios.get('/app/count').then((res: AxiosResponse) => {
    return parseInt(res.data)
  })
}
export const increaseRunningAppCount = () => {
  return axios.get("/app/count/increase").then((res: AxiosResponse) => {
    return parseInt(res.data)
  })
}
export const decreaseRunningAppCount = () => {
  return axios.get('/app/count/decrease').then((res: AxiosResponse) => {
    return parseInt(res.data)
  })
}
export const exitServer = () => {
  return axios.get('/exit')
}

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
