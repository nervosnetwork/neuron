import FileService from '../file'

export default class BaseSettings {
  private static moduleName = ''
  private static fileName = 'settings.json'

  private static instance: BaseSettings

  public static getInstance(): BaseSettings {
    if (!BaseSettings.instance) {
      BaseSettings.instance = new BaseSettings()
    }

    return BaseSettings.instance
  }

  public updateSetting = (key: string, value: any) => {
    let settings = this.read()
    if (settings === undefined) {
      settings = {}
    }
    Object.assign(settings, { [key]: value })
    FileService.getInstance().writeFileSync(BaseSettings.moduleName, BaseSettings.fileName, JSON.stringify(settings))
  }

  public getSetting = (key: string) => {
    const info = this.read()

    if (info) {
      return info[key]
    }

    return undefined
  }

  public read = () => {
    const fileService = FileService.getInstance()
    const { moduleName, fileName } = BaseSettings

    if (fileService.hasFile(moduleName, fileName)) {
      const info = FileService.getInstance().readFileSync(moduleName, fileName)
      const value = JSON.parse(info)
      return value
    }

    return undefined
  }
}
