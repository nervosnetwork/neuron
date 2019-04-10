import React from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { useNeuronWallet } from '../../utils/hooks'

const Container = styled.div`
  position: relative;
  display: grid;
  grid-template:
    'type type time' 20px
    'title title title' 32px
    'message message message' 22px
    'action1 action2 action3' 22px /
    1fr 1fr 30px;
  border: none;
  border-radius: 16px;
  overflow: hidden;
  overflow: hidden;
  height: 116px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.7);
`

const Type = styled.div`
  grid-area: type;
  text-transform: uppercase;
`

const Time = styled.div`
  grid-area: time;
`

const Title = styled.h1`
  grid-area: title;
  font-size: 16px;
  margin: 0;
`

const Message = styled.p`
  grid-area: message;
  font-size: 12px;
`

const NotificationContainer = ({
  type,
  title,
  time,
  message,
}: {
  type: 'error' | 'notice'
  title: string
  time: string
  message: string
  actions: string
}) => (
  <Container>
    <Type>{type}</Type>
    <Time>{time}</Time>
    <Title>{title}</Title>
    <Message>{message}</Message>
  </Container>
)

const NoticeContent = () => {
  const {
    wallet: { message },
  } = useNeuronWallet()
  return message ? (
    <NotificationContainer type="error" title="Wallet Notification" time="now" message={message} actions="actions" />
  ) : null
}

NoticeContent.displayName = 'NoticeContent'

const Notification = () => createPortal(<NoticeContent />, document.querySelector('#notification') as HTMLElement)

export default Notification
