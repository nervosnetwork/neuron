import fs from 'fs'
import path from 'path'
import env from 'env'
import { FileNotFound, ModuleNotFound } from 'exceptions'

export default class FileService {
  private static instance: FileService

  static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService()
    }

    return FileService.instance
  }

  // get fileBasePath value from child_process.fork() env
  public basePath = process.env['fileBasePath'] ?? env.fileBasePath

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
    if (!this.hasModule(moduleName)) {
      throw new ModuleNotFound(moduleName)
    }
    return fs.existsSync(path.join(this.basePath, moduleName, filename))
  }

  public readFileSync = (moduleName: string, filename: string) => {
    if (!this.hasFile(moduleName, filename)) {
      throw new FileNotFound(filename)
    }
    return fs.readFileSync(path.join(this.basePath, moduleName, filename), this.config)
  }

  public writeFileSync = (moduleName: string, filename: string, data: string) => {
    if (!this.hasModule(moduleName)) {
      throw new ModuleNotFound(moduleName)
    }
    return fs.writeFileSync(path.join(this.basePath, moduleName, filename), data, this.config)
  }

  public deleteFileSync = (moduleName: string, filename: string) => {
    if (!this.hasFile(moduleName, filename)) {
      throw new FileNotFound(filename)
    }
    return fs.unlinkSync(path.join(this.basePath, moduleName, filename))
  }
}
