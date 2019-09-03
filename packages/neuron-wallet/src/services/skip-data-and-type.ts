import FileService from './file'

export default class SkipDataAndType {
  private static moduleName = ''
  private static fileName = 'skip-data-and-type.json'

  private skip: boolean | undefined = undefined

  private static instance: SkipDataAndType

  static getInstance(): SkipDataAndType {
    if (!SkipDataAndType.instance) {
      SkipDataAndType.instance = new SkipDataAndType()
    }

    return SkipDataAndType.instance
  }

  // open means can use cells with data and type
  public update(skip: boolean) {
    FileService.getInstance().writeFileSync(
      SkipDataAndType.moduleName,
      SkipDataAndType.fileName,
      JSON.stringify({
        skip,
      })
    )
    // cache this variable
    this.skip = skip
  }

  public get(): boolean {
    // if cached, don't to read file
    if (this.skip !== undefined) {
      return this.skip
    }
    const fileService = FileService.getInstance()
    const { moduleName, fileName } = SkipDataAndType

    if (fileService.hasFile(moduleName, fileName)) {
      const info = FileService.getInstance().readFileSync(moduleName, fileName)
      const { skip } = JSON.parse(info)
      if (skip === false) {
        return false
      }
    }

    // default is true
    return true
  }
}
