import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Dialog from 'widgets/Dialog'
import { setLocale } from 'services/remote'
import { CONSTANTS } from 'utils'
import Arrow from 'widgets/Icons/Arrow.svg?react'
import Select from 'widgets/Icons/Select.svg?react'
import Button from 'widgets/Button'

import styles from './languageDialog.module.scss'

const { LOCALES } = CONSTANTS

// The dropdown is fixed-positioned so it is not clipped by the dialog content,
// which means its placement has to be computed from the trigger and kept inside the window.
const DROPDOWN_GAP = 8
const WINDOW_MARGIN = 16
const MIN_DROPDOWN_HEIGHT = 120

interface SelectItemProps {
  locale: string
  className?: string
  onClick: () => void
  sufIcon?: React.ReactNode
}

const SelectItem = ({ locale, className, sufIcon, ...res }: SelectItemProps) => {
  const [t] = useTranslation()
  return (
    <Button type="text" className={`${className} ${styles.selectItem}`} {...res}>
      <div className={styles.wrap}>
        <p className={styles.title}>{t(`settings.locale.${locale}`)}</p>
        <p>{sufIcon}</p>
      </div>
    </Button>
  )
}

const LanguageDialog = ({ show, close }: { show: boolean; close: () => void }) => {
  const [t, i18n] = useTranslation()
  const [lng, setLng] = useState(i18n.language as (typeof LOCALES)[number])

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>()
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const onSubmit = useCallback(() => {
    setLocale(lng)
    close()
  }, [close, lng])

  const updateDropdownPosition = useCallback(() => {
    if (!dropdownRef.current) {
      return
    }
    const { top, bottom, left, width } = dropdownRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - bottom - DROPDOWN_GAP - WINDOW_MARGIN
    const spaceAbove = top - DROPDOWN_GAP - WINDOW_MARGIN
    const openUpward = spaceBelow < MIN_DROPDOWN_HEIGHT && spaceAbove > spaceBelow
    setDropdownStyle({
      left,
      width,
      maxHeight: Math.max(openUpward ? spaceAbove : spaceBelow, MIN_DROPDOWN_HEIGHT),
      ...(openUpward ? { bottom: window.innerHeight - top + DROPDOWN_GAP } : { top: bottom + DROPDOWN_GAP }),
    })
  }, [])

  useLayoutEffect(() => {
    if (!isDropdownOpen) {
      return undefined
    }
    updateDropdownPosition()
    window.addEventListener('resize', updateDropdownPosition)
    // the dialog content scrolls, so the dropdown has to follow its trigger
    window.addEventListener('scroll', updateDropdownPosition, true)
    return () => {
      window.removeEventListener('resize', updateDropdownPosition)
      window.removeEventListener('scroll', updateDropdownPosition, true)
    }
  }, [isDropdownOpen, updateDropdownPosition])

  useEffect(() => {
    if (!show) {
      setIsDropdownOpen(false)
    }
  }, [show])

  return (
    <Dialog
      show={show}
      title={t('settings.general.language')}
      onCancel={close}
      onConfirm={onSubmit}
      disabled={lng === i18n.language}
      cancelText={t('common.cancel')}
      confirmText={t('settings.general.apply')}
    >
      <div className={styles.container}>
        <p className={styles.title}>{t('settings.general.select-language')}</p>
        <div className={styles.dropdown} ref={dropdownRef}>
          <SelectItem
            locale={lng}
            className={styles.content}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            data-active={isDropdownOpen}
            sufIcon={<Arrow />}
          />
          {isDropdownOpen ? (
            <div className={styles.selects} style={dropdownStyle}>
              {LOCALES.map(item => (
                <SelectItem
                  locale={item}
                  key={item}
                  sufIcon={item === lng && <Select />}
                  onClick={() => {
                    setIsDropdownOpen(false)
                    setLng(item)
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Dialog>
  )
}

LanguageDialog.displayName = 'LanguageDialog'
export default LanguageDialog
