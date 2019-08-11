export const backToTop = (elm?: HTMLElement) => {
  const container = elm || (document.querySelector('main > div') as HTMLElement)
  if (container) {
    container.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    })
  }
}

export default {
  backToTop,
}
