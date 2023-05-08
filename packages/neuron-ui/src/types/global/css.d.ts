/**
 * Reference from
 * https://github.com/frenic/csstype#what-should-i-do-when-i-get-type-errors
 */
import type {} from 'csstype'

declare module 'csstype' {
  interface Properties {
    // Allow any CSS Custom Properties
    [index: `--${string}`]: string | number
  }
}
