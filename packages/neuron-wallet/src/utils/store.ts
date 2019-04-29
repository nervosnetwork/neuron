import fs from 'fs'
import path from 'path'
import EventEmitter from 'events'

class Store extends EventEmitter {
  public readonly location: string

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

  public read = (key?: string) =>
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
          reject(parseErr)
        }
      })
    })

  public save = (key: string, value: any) =>
    this.read().then((content: any = {}) => {
      const oldValue = content[key]
      if (oldValue !== value) {
        this.emit(key, oldValue, value)
        const newContent = { ...content, ...{ [key]: value } }
        return new Promise((resolve, reject) => {
          fs.writeFile(this.location, JSON.stringify(newContent), this.config, err => {
            if (err) reject(err)
            return resolve(true)
          })
        })
      }
      return 'Same value'
    })

  public clear = () =>
    new Promise((resolve, reject) => {
      fs.unlink(this.location, err => {
        if (err) {
          reject(err)
        }
        resolve(true)
      })
    })
}

export default Store
