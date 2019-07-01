const { ipcRenderer } = require('electron')

const form = document.querySelector('form') as any
const id = window.location.hash.slice(1)

form.addEventListener('submit', (event: any) => {
  event.preventDefault()
  if (event && event.target) {
    const password = event.target.password.value
    ipcRenderer.send(`prompt-data-${id}`, password)
  }
  return false
})

form.cancel.addEventListener('click', (event: Event) => {
  event.preventDefault()
  ipcRenderer.send(`prompt-cancel-${id}`)
  return false
})

ipcRenderer.on(`prompt-init`, (_e: Event, labels: any) => {
  form.password.labels[0].innerText = labels.label
  form.submit.value = labels.submit
  form.cancel.value = labels.cancel
})
