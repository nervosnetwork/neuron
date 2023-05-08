import { KeyboardEvent, KeyboardEventHandler } from 'react'

export function onEnter(callback: (e: KeyboardEvent) => void): KeyboardEventHandler {
  return e => {
    if (e.key === 'Enter') {
      callback(e)
    }
  }
}

export default {}
