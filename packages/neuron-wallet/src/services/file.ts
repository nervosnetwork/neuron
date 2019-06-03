import fs from 'fs'
import path from 'path'
import env from '../env'

export default class FileService {
  private static instance: FileService

  static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService()
    }

    return FileService.instance
  }

  public basePath = env.fileBasePath
  public config = {
    encoding: 'utf8',
  }

  constructor() {
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true })
    }
  }

  public mkDirSync = (dirname: string) => {
    const dir = path.join(this.basePath, dirname)
    fs.mkdirSync(dir, { recursive: true })
    return dir
  }

  public hasModule = (dirname: string) => {
    return fs.existsSync(path.resolve(this.basePath, dirname))
  }

  public addModule = (moduleName: string) => {
    this.mkDirSync(moduleName)
  }

  public hasFile(moduleName: string, filename: string) {
    if (!this.hasModule(moduleName)) throw new Error(`Module ${moduleName} not found`)
    return fs.existsSync(path.join(this.basePath, moduleName, filename))
  }

  public readFileSync = (moduleName: string, filename: string) => {
    if (!this.hasFile(moduleName, filename)) throw new Error(`File ${filename} not found`)
    return fs.readFileSync(path.join(this.basePath, moduleName, filename), this.config)
  }

  public readFile = (moduleName: string, filename: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!this.hasFile(moduleName, filename)) reject(new Error(`File ${filename} not found`))
      fs.readFile(path.join(this.basePath, moduleName, filename), this.config, (err, file) => {
        if (err) reject(err)
        resolve(file)
      })
    })
  }

  public writeFileSync = (moduleName: string, filename: string, data: string) => {
    if (!this.hasModule(moduleName)) throw new Error(`Module ${moduleName} not found`)
    return fs.writeFileSync(path.join(this.basePath, moduleName, filename), data, this.config)
  }

  public deleteFileSync = (moduleName: string, filename: string) => {
    if (!this.hasFile(moduleName, filename)) throw new Error(`File ${filename} not found`)
    return fs.unlinkSync(path.join(this.basePath, moduleName, filename))
  }
}

export const fileService = new FileService()
