import { useEffect } from 'react'

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

export default { useFullscreen }
