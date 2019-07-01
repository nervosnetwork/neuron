import { Channel } from '../utils/const'

export const Controller: (channel: Channel) => ClassDecorator = channel => target => {
  Reflect.defineMetadata('channel', channel, target)
}

export default { Controller }
