import React, { useState, useCallback, useRef } from 'react'
import styles from './copyZone.module.scss'

type CopyZoneProps = React.PropsWithChildren<{ content: string; style?: React.CSSProperties }>
const CopyZone = ({ children, content, style }: CopyZoneProps) => {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const onCopy = useCallback(() => {
    setCopied(true)
    window.navigator.clipboard.writeText(content)
    clearTimeout(timer.current!)
    timer.current = setTimeout(() => {
      setCopied(false)
    }, 1000)
  }, [setCopied, content])

  return (
    <div
      role="presentation"
      data-copied={copied}
      data-prompt={copied ? 'copied' : 'copy'}
      onClick={onCopy}
      className={styles.container}
      style={style}
    >
      {children}
    </div>
  )
}

CopyZone.displayName = 'CopyZone'

export default CopyZone
