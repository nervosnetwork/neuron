import React, { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, SuccessNoBorder } from 'widgets/Icons/icon'
import styles from './copyZone.module.scss'

type CopyZoneProps = React.PropsWithChildren<{
  name?: string
  content: string
  style?: React.CSSProperties
  className?: string
  maskRadius?: number
  title?: string
}>
const CopyZone = ({
  children,
  content,
  name,
  style,
  className = '',
  maskRadius = 16,
  title = content,
}: CopyZoneProps) => {
  const [t] = useTranslation()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const prompt = copied ? t('common.copied') : name || t(`common.copy`)

  const onCopy = useCallback(
    (e: React.SyntheticEvent) => {
      e.stopPropagation()
      setCopied(true)
      window.navigator.clipboard.writeText(content)
      clearTimeout(timer.current!)
      timer.current = setTimeout(() => {
        setCopied(false)
      }, 1000)
    },
    [setCopied, content]
  )

  return (
    <div
      role="presentation"
      data-copied={copied}
      onClick={onCopy}
      className={`${styles.container} ${className}`}
      style={style}
      title={title}
    >
      {children}
      <div className={styles.hoverShow} style={{ borderRadius: `${maskRadius}px` }}>
        {copied ? <SuccessNoBorder className={styles.copyIcon} /> : <Copy className={styles.copyIcon} />}
        <span className={styles.copytext}>{prompt}</span>
      </div>
    </div>
  )
}

CopyZone.displayName = 'CopyZone'

export default CopyZone
