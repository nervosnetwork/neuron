import FileService from './file'

export default class SkipDataAndType {
  private static moduleName = ''
  private static fileName = 'skip-data-and-type.json'

  private open: boolean | undefined = undefined

  private static instance: SkipDataAndType

  static getInstance(): SkipDataAndType {
    if (!SkipDataAndType.instance) {
      SkipDataAndType.instance = new SkipDataAndType()
    }

    return SkipDataAndType.instance
  }

  // open means can use cells with data and type
  public update(open: boolean) {
    FileService.getInstance().writeFileSync(
      SkipDataAndType.moduleName,
      SkipDataAndType.fileName,
      JSON.stringify({
        open,
      })
    )
    // cache this variable
    this.open = open
  }

  public get(): boolean {
    // if cached, don't to read file
    if (this.open !== undefined) {
      return this.open
    }
    const fileService = FileService.getInstance()
    const { moduleName, fileName } = SkipDataAndType

    if (fileService.hasFile(moduleName, fileName)) {
      const info = FileService.getInstance().readFileSync(moduleName, fileName)
      const { open } = JSON.parse(info)
      if (open === false) {
        return false
      }
    }

    // default is true
    return true
  }
}
