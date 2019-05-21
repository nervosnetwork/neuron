import { ipcMain, WebContents, Notification } from 'electron'
import { Channel } from '../utils/const'

const methods: { [index: string]: Function } = {
  notification: (args: string[]) => {
    return new Promise(resolve => {
      const notification = new Notification({
        title: args[0] || '',
        body: args[1] || '',
      })
      notification.show()
      setTimeout(() => notification.close(), 3000)
      resolve(notification.toString())
    })
  },
  printCommand: (args: string[]) => {
    return new Promise(resolve => {
      resolve(args.join(' '))
    })
  },
}

class TerminalChannel {
  public web: WebContents

  constructor(web: WebContents) {
    this.web = web
  }

  static handleCommand = async (command: string, params: string[] = []) => {
    if (command in methods) {
      return {
        status: 1,
        result: {
          msg: await methods[command](params),
        },
      }
    }
    return {
      status: 0,
      msg: `${command} not found`,
    }
  }

  public start = () => {
    return ipcMain.on(Channel.Terminal, async (e: Electron.Event, input: string) => {
      const params = input.split(' ')
      const res = await TerminalChannel.handleCommand(params[0], params.slice(1))
      e.sender.send(Channel.Terminal, res)
    })
  }
}

export default TerminalChannel
