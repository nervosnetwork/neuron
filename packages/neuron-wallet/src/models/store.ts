import EventEmitter from 'events'
import FileService from 'services/file'
import logger from 'utils/logger'

class Store extends EventEmitter {
  public moduleName: string
  public filename: string
  public defaultValue: string
  public service = FileService.getInstance()

  constructor(moduleName: string, filename: string, defaultValue: string = '{}') {
    super()
    this.moduleName = moduleName
    this.filename = filename
    this.defaultValue = defaultValue
    this.init()
  }

  public hasModule = () => {
    return this.service.hasModule(this.moduleName)
  }

  public hasFile = () => {
    return this.service.hasFile(this.moduleName, this.filename)
  }

  public init = () => {
    if (!this.hasModule()) {
      this.service.addModule(this.moduleName)
    }
    if (!this.hasFile()) {
      this.service.writeFileSync(this.moduleName, this.filename, this.defaultValue)
    }
  }

  public readSync = <T>(key?: string): T => {
    try {
      const data = this.service.readFileSync(this.moduleName, this.filename)
      const content = JSON.parse(data)
      return key ? content[key] : content
    } catch (err) {
      logger.warn(`store read error: ${err}`)
      const content = JSON.parse(this.defaultValue)
      return key ? content[key] : content
    }
  }

  public writeSync = (key: string, data: any) => {
    const content: { [key: string]: any } = this.readSync()
    const oldValue = content[key]
    this.service.writeFileSync(this.moduleName, this.filename, JSON.stringify({ ...content, ...{ [key]: data } }))
    this.emit(key, oldValue, data)
  }

  public clear = () => {
    if (this.hasModule() && this.hasFile()) {
      this.service.deleteFileSync(this.moduleName, this.filename)
    }
  }
}

export default Store
