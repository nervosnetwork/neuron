import React from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { useNeuronWallet } from '../../utils/hooks'
import { GlobalMessage } from '../../contexts/NeuronWallet'

dayjs.extend(relativeTime)

const Container = styled.div`
  position: relative;
  display: grid;
  grid-template:
    'type type time' 20px
    'title title title' 32px
    'message message message' 22px
    'actions actions actions' 22px /
    1fr 1fr 150px;
  border: none;
  border-radius: 5px;
  overflow: hidden;
  overflow: hidden;
  padding: 16px;
  padding-bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  margin: 12px;
  box-shadow: 3px 3px 15px rgba(0, 0, 0, 0.3);
`

const Category = styled.div`
  grid-area: type;
  text-transform: uppercase;
`

const Time = styled.div`
  grid-area: time;
  font-size: 12px;
  text-align: right;
`

const Title = styled.h1`
  grid-area: title;
  font-size: 16px;
  margin: 0;
`

const Content = styled.p`
  grid-area: message;
  font-size: 12px;
  margin: 0;
`

const Actions = styled.div`
  grid-area: actions;
  display: flex;
  justify-content: space-between;
  align-content: stretch;
  a,
  button {
    flex: 1;
    text-decoration: none;
    color: #000;
    text-align: center;
    border: none;
    background: transparent;
    transition: background 0.3s ease-out;
    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }
  }
  margin-left: -16px;
  margin-right: -16px;
`

const NotificationContainer = ({ category, title, time, content, actions, dismiss }: GlobalMessage) => (
  <Container>
    <Category>{category}</Category>
    <Time>{dayjs(time).fromNow()}</Time>
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
      {messages.map(({ category, title, content, time, actions, dismiss }) => (
        <NotificationContainer
          key={time}
          category={category}
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
