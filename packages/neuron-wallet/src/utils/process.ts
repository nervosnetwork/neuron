export default class ProcessUtils {
  public static isRenderer(): boolean {
    return process.type === 'renderer'
  }

  public static isMain(): boolean {
    return process.type === 'browser'
  }
}
