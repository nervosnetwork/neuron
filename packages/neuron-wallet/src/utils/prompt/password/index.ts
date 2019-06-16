const { ipcRenderer } = require('electron')

const form = document.querySelector('form') as any

const { language } = window.navigator

const locale = (() => {
  if (language === 'en-US' || language === 'en') {
    return 'en-US'
  }
  return 'zh-CN'
})()

const labels: any = {
  'zh-CN': {
    label: '请输入密码',
    submit: '提交',
    cancel: '取消',
  },
  'en-US': {
    label: 'Input your password',
    submit: 'Submit',
    cancel: 'Cancel',
  },
}

form.password.labels[0].innerText = labels[locale].label
form.submit.value = labels[locale].submit
form.cancel.value = labels[locale].cancel

form.addEventListener('submit', (event: any) => {
  event.preventDefault()
  if (event && event.target) {
    const password = event.target.password.value
    ipcRenderer.send('prompt-data', password)
  }
  return false
})

form.cancel.addEventListener('click', (event: Event) => {
  event.preventDefault()
  ipcRenderer.send('prompt-cancel')
  return false
})
