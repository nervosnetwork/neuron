import { ipcMain } from 'electron'
import controllers from './controllers'
import logger from './utils/logger'

export default class Router {
  constructor(controllerSet: typeof controllers = controllers) {
    Object.values(controllerSet).forEach(controller => {
      if (typeof controller === 'function') {
        const channel = Reflect.getMetadata('channel', controller) || controller.name.toLowerCase().slice(0, -10)
        ipcMain.on(channel, async (e: Electron.Event, method: keyof typeof controller, ...params: any[]) => {
          e.sender.send(channel, method, await (controller[method] as Function)(...params))
        })
      } else {
        logger.log({ level: 'error', message: `${controller} is invalid` })
      }
    })
  }
}
