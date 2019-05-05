import fs from 'fs'
import path from 'path'
import EventEmitter from 'events'

import console = require('console')

class Store extends EventEmitter {
  public readonly location: string

  public defaultValue = '{}'

  public config = {
    encoding: 'utf8',
  }

  constructor(pathname: string, filename: string) {
    super()
    this.location = path.resolve(pathname, filename)
    const exist = fs.existsSync(this.location)
    if (!exist) {
      fs.writeFileSync(this.location, '{}', this.config)
    }
  }

  public init = () =>
    new Promise((resolve, reject) => {
      fs.writeFile(this.location, this.defaultValue, this.config, err => {
        if (err) reject(err)
        resolve(true)
      })
    })

  public read = <T>(key?: string): Promise<T | undefined> =>
    new Promise((resolve, reject) => {
      fs.readFile(this.location, this.config, (loadErr, data) => {
        if (loadErr) {
          reject(loadErr)
        }
        try {
          const content = JSON.parse(data)
          if (key) {
            resolve(content[key])
          }
          resolve(content)
        } catch (parseErr) {
          console.error('\x1b[33m%s\x1b[0m', `Failed to parse data, backup to ${this.location}.brk and initiate data`)
          this.backup(data)
          this.init()
          reject(parseErr)
        }
      })
    })

  public write = (key: string, data: any) =>
    this.read().then((content: any = {}) => {
      const oldValue = content[key]
      if (oldValue !== data) {
        const newContent = { ...content, ...{ [key]: data } }
        return new Promise((resolve, reject) => {
          fs.writeFile(this.location, JSON.stringify(newContent), this.config, err => {
            if (err) reject(err)
            this.emit(key, oldValue, data)
            return resolve(true)
          })
        })
      }
      return 'Same value'
    })

  public readSync = <T>(key?: string): T => {
    const data = fs.readFileSync(this.location, this.config)
    const content = JSON.parse(data)
    return key ? content[key] : content
  }

  public writeSync = (key: string, data: any) => {
    const content: { [key: string]: any } = this.readSync()
    const oldValue = content[key]
    fs.writeFileSync(this.location, JSON.stringify({ ...content, ...{ [key]: data } }), this.config)
    this.emit(key, oldValue, data)
    return true
  }

  public clear = () =>
    new Promise((resolve, reject) => {
      fs.unlink(this.location, err => {
        if (err) {
          reject(err)
        }
        resolve(true)
      })
    })

  public backup = (data: string) =>
    new Promise((resolve, reject) => {
      fs.writeFile(`${this.location}.brk`, data, this.config, err => {
        if (err) reject(err)
        resolve(true)
      })
    })
}

export default Store
