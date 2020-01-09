export default class TypeChecker {
  public static hashChecker(...hashes: (string | null | undefined)[]): void {
    hashes.forEach(hash => {
      if (hash && (!hash.startsWith('0x') || hash.length !== 66)) {
        throw new Error(`hash ${hash} must start with 0x and has 64 characters`)
      }
    })
  }

  public static numberChecker(...nums: (string | null | undefined)[]): void {
    nums.forEach(num => {
      if (num && (typeof num !== 'string' || num.startsWith('0x'))) {
        throw new Error(`number ${num} should be decimal`)
      }
    })
  }
}
