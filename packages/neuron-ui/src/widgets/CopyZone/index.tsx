import React, { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './copyZone.module.scss'

type CopyZoneProps = React.PropsWithChildren<{ name?: string; content: string; style?: React.CSSProperties }>
const CopyZone = ({ children, content, name, style }: CopyZoneProps) => {
  const [t] = useTranslation()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const prompt = copied ? t('common.copied') : name || t(`common.copy`)

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
      data-prompt={prompt}
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
