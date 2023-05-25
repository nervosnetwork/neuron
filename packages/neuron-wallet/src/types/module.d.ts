import 'module'

declare module 'module' {
  namespace Module {
    function _load(...args: unknown[]): unknown
  }
  export = Module
}
