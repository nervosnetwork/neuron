import React from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useNeuronWallet } from '../../utils/hooks'
import { GlobalMessage } from '../../contexts/NeuronWallet'

const Container = styled.div`
  position: relative;
  display: grid;
  grid-template:
    'type type time' 20px
    'title title title' 32px
    'message message message' 22px
    'actions actions actions' 22px /
    1fr 1fr 30px;
  border: none;
  border-radius: 5px;
  overflow: hidden;
  overflow: hidden;
  height: 116px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.7);
  margin-bottom: 5px;
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

const Content = styled.p`
  grid-area: message;
  font-size: 12px;
`

const Actions = styled.div`
  grid-area: actions;
  display: flex;
  justify-content: space-between;
  align-content: center;
  a,
  button {
    flex: 1;
    text-decoration: none;
    color: #000;
    border: 1px solid #ccc;
    background: rgba(0, 0, 0, 0.1);
    text-align: center;
  }
`

const NotificationContainer = ({ type, title, time, content, actions, dismiss }: GlobalMessage) => (
  <Container>
    <Type>{type}</Type>
    <Time>{new Date(time).getSeconds()}</Time>
    <Title>{title}</Title>
    <Content>{content}</Content>
    <Actions>
      {[...actions, { label: 'dismiss', action: dismiss }].map(({ label, action }) =>
        typeof action === 'string' ? (
          <Link key={label} to={action} onClick={dismiss}>
            {label}
          </Link>
        ) : (
          <button key={label} type="button" onClick={action}>
            {label}
          </button>
        ),
      )}
    </Actions>
  </Container>
)

const NoticeContent = () => {
  const { messages } = useNeuronWallet()
  return messages.length ? (
    <>
      {messages.map(({ type, title, content, time, actions, dismiss }) => (
        <NotificationContainer
          key={time}
          type={type}
          title={title}
          time={time}
          content={content}
          actions={actions}
          dismiss={dismiss}
        />
      ))}
    </>
  ) : null
}

NoticeContent.displayName = 'NoticeContent'

const Notification = () => createPortal(<NoticeContent />, document.querySelector('#notification') as HTMLElement)

export default Notification
