import React from 'react'
import { createPortal } from 'react-dom'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { useNeuronWallet } from '../../utils/hooks'
import BannerMessages from '../../widgets/BannerMessages'

dayjs.extend(relativeTime)

const NoticeContent = () => {
  const { messages } = useNeuronWallet()
  return <BannerMessages messages={messages} style={{ paddingTop: '20px', paddingRight: '40px' }} />
}

NoticeContent.displayName = 'NoticeContent'

const Notification = () => createPortal(<NoticeContent />, document.querySelector('#notification') as HTMLElement)

export default Notification
