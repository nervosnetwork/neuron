export interface GlobalMessage {
  category: 'error' | 'notice'
  title: string
  time: number
  content: string
  actions: { label: string; action: React.MouseEventHandler | string }[]
  dismiss: React.MouseEventHandler
}

const messagesState = [] as GlobalMessage[]

export default messagesState
