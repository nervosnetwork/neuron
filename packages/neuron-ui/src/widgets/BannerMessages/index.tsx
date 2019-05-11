import React from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { Alert } from 'react-bootstrap'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const Container = styled.div`
  width: 100%;
`
const AlertItem = styled(Alert)`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const Content = styled.p`
  margin: 0;
`

const ActionZone = styled.div`
  display: flex;
  justify-content: flex-end;
  a,
  button {
    margin-left: 15px;
  }
`

export interface Message {
  title: string
  content: string
  id: string | null
  time: number
  category: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'dark' | 'light'
  actions: { label: string; action: React.MouseEventHandler | string }[]
  dismiss: () => void
}

const BannerMessages = ({ messages, style = {} }: { messages: Message[]; style?: object }) => {
  return (
    <Container style={style}>
      {messages.map(({ content, time, category, actions, dismiss }) => (
        <AlertItem variant={category} key={time} dismissible onClose={dismiss}>
          <Content>{content}</Content>
          <ActionZone>
            {actions.map(({ label, action }) =>
              typeof action === 'string' ? (
                <Link key={label} className={`btn btn-outline-${category}`} to={action} onClick={dismiss}>
                  {label}
                </Link>
              ) : (
                <button key={label} type="button" className={`btn btn-outline-${category}`} onClick={action}>
                  {label}
                </button>
              ),
            )}
          </ActionZone>
        </AlertItem>
      ))}
    </Container>
  )
}

BannerMessages.displayName = 'BannerMessages'

export default BannerMessages
