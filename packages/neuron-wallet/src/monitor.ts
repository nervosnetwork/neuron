import { Channel } from './utils/const'
import { ckbCore } from './channel'

let network = {
  remote: {
    url: '',
  },
  connected: false,
}

const monitorNetwork = (wenContents: Electron.WebContents) => {
  const result = {
    remote: ckbCore.node,
    connected: false,
  }
  // TODO: add connected property in sdk
  if (network.remote.url !== result.remote.url || network.connected !== result.connected) {
    network = result
    wenContents.send(Channel.GetNetwork, {
      status: 1,
      result,
    })
  }
}

const monitorChain = (webContents: Electron.WebContents) => {
  setInterval(() => {
    monitorNetwork(webContents)
  }, 3000)
}

export default monitorChain
