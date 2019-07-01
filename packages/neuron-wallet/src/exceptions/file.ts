export class ModuleNotFound extends Error {
  constructor(moduleName: string) {
    super(`Module ${moduleName} not found`)
  }
}
export class FileNotFound extends Error {
  constructor(filename: string) {
    super(`File ${filename} not found`)
  }
}

export default {
  ModuleNotFound,
  FileNotFound,
}
