import EventEmitter from 'events'
import fileService from '../startup/fileService'
import logger from './logger'

class Store extends EventEmitter {
  public moduleName: string
  public filename: string
  public defaultValue: string
  public service = fileService

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

  public backup = () => {
    if (this.hasModule() && this.hasFile()) {
      const data = this.service.readFileSync(this.moduleName, this.filename)
      this.service.writeFileSync(this.moduleName, `${this.filename}.brk`, data)
      this.service.deleteFileSync(this.moduleName, this.filename)
    }
    this.init()
  }

  public read = <T>(key?: string): Promise<T | undefined> =>
    this.service
      .readFile(this.moduleName, this.filename)
      .then(data => {
        const content = JSON.parse(data)
        return content[key as string]
      })
      .catch(err => {
        this.backup()
        logger.log({
          level: 'error',
          message: err.message,
        })
        return this.read(key)
      })

  public write = (key: string, data: any) =>
    this.read()
      .then((content: any = {}) => {
        const oldValue = content[key]
        if (oldValue !== data) {
          const newContent = { ...content, ...{ [key]: data } }
          this.service.writeFileSync(this.moduleName, this.filename, JSON.stringify(newContent))
        }
      })
      .catch(err => {
        this.backup()
        logger.log({
          level: 'error',
          message: err.message,
        })
        this.write(key, data)
      })

  public readSync = <T>(key?: string): T => {
    try {
      const data = this.service.readFileSync(this.moduleName, this.filename)
      const content = JSON.parse(data)
      return key ? content[key] : content
    } catch (err) {
      this.backup()
      logger.log({
        level: 'error',
        message: err.message,
      })
      return this.readSync(key)
    }
  }

  public writeSync = (key: string, data: any) => {
    try {
      const content: { [key: string]: any } = this.readSync()
      const oldValue = content[key]
      this.service.writeFileSync(this.moduleName, this.filename, JSON.stringify({ ...content, ...{ [key]: data } }))
      this.emit(key, oldValue, data)
    } catch (err) {
      this.backup()
      logger.log({
        level: 'error',
        message: err.message,
      })
      this.writeSync(key, data)
    }
  }

  public clear = () => {
    if (this.hasModule() && this.hasFile()) {
      this.service.deleteFileSync(this.moduleName, this.filename)
    }
  }
}

export default Store
