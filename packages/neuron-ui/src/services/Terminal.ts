import { Channel } from 'utils/const'
import UILayer from './UILayer'

const TerminalChannel = {
  on: (cb: Function) => UILayer.on(Channel.Terminal, cb),
  send: (msg: any) => UILayer.send(Channel.Terminal, msg),
  removeSelf: () => UILayer.removeAllListeners(Channel.Terminal),
}
export default TerminalChannel
