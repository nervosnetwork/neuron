import { useEffect, useContext } from 'react'
import NeuronWalletContext from '../contexts/NeuronWallet'

export const useFullscreen = (fullscreen: boolean) => {
  useEffect(() => {
    const content = document.querySelector('.main-content') as HTMLElement
    if (fullscreen) {
      content.classList.add('full-screen')
    }
    return () => {
      content.classList.remove('full-screen')
    }
  }, [fullscreen])
}

export const useNeuronWallet = () => useContext(NeuronWalletContext)

export default { useFullscreen, useNeuronWallet }
