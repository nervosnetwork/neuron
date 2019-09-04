import BaseSettings from './base'

export default class SkipDataAndType {
  private skip: boolean | undefined = undefined
  private keyName = 'skip'

  private static instance: SkipDataAndType

  static getInstance(): SkipDataAndType {
    if (!SkipDataAndType.instance) {
      SkipDataAndType.instance = new SkipDataAndType()
    }

    return SkipDataAndType.instance
  }

  // skip means can use cells with data and type
  public update(skip: boolean) {
    BaseSettings.getInstance().updateSetting(this.keyName, skip)
    // cache this variable
    this.skip = skip
  }

  public get(): boolean {
    // if cached, don't read file
    if (this.skip !== undefined) {
      return this.skip
    }

    const skip = BaseSettings.getInstance().getSetting(this.keyName)

    if (skip === false) {
      return false
    }

    // default is true
    return true
  }
}
