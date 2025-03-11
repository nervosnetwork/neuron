import React, { ReactNode, useEffect, useState } from 'react'
import SuccessCircle from 'widgets/Icons/SuccessCircle.svg?react'

import styles from './toast.module.scss'

interface NotificationProps {
  type?: 'success' | 'error' | 'info'
  content: string | ReactNode
  onDismiss?: () => void
}

const Toast = ({ type = 'success', content, onDismiss }: NotificationProps) => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (content) {
      setShow(true)
      const timer = setTimeout(() => {
        onDismiss?.()
        setShow(false)
      }, 3000)
      return () => {
        clearTimeout(timer)
      }
    }
    return () => {}
  }, [content])

  return (
    <>
      {show ? (
        <div className={styles.container} data-type={type}>
          <div className={styles.content}>
            <SuccessCircle />
            {content}
          </div>
        </div>
      ) : null}
    </>
  )
}

Toast.displayName = 'Toast'

export default Toast
