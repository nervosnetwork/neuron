export class ModuleIsNotFound extends Error {
  constructor(moduleName: string) {
    super(`Module ${moduleName} not found`)
  }
}
export class FileIsNotFound extends Error {
  constructor(filename: string) {
    super(`File ${filename} not found`)
  }
}

export default {
  ModuleIsNotFound,
  FileIsNotFound,
}
