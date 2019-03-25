import { Network } from '../contexts/Chain'
import { LocalStorage } from './const'

export const saveNetworks = (networks: Network[]) => {
  window.localStorage.setItem(LocalStorage.Networks, JSON.stringify(networks))
}

export const loadNetworks = () => {
  try {
    return JSON.parse(window.localStorage.getItem(LocalStorage.Networks) || '{}')
  } catch (e) {
    console.warn(e)
  }
  return []
}
