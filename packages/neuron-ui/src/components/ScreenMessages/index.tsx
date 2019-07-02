import React from 'react'
import BannerMessages, { Message } from 'widgets/BannerMessages'

const style = {
  position: 'absolute',
  top: '0',
  left: '0',
  zIndex: 999,
}

const ScreenMessages = ({ messages }: { messages: Message[] }) => <BannerMessages messages={messages} style={style} />

ScreenMessages.displayName = 'ScreenMessages'

export default ScreenMessages
