export interface GlobalMessage {
  type: 'error' | 'notice'
  title: string
  time: string
  content: string
  actions: { label: string; action: React.MouseEventHandler | string }[]
  dismiss: React.MouseEventHandler
}

const messagesState = [] as GlobalMessage[]

export default messagesState
