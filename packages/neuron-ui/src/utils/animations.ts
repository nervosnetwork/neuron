export const backToTop = (elm?: HTMLElement) => {
  const container = elm || (document.querySelector('main') as HTMLElement)
  if (container) {
    container.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }
}

export default {
  backToTop,
}
