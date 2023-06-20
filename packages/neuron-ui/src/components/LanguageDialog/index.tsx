import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Dialog from 'widgets/Dialog'
import { setLocale } from 'services/remote'
import { CONSTANTS } from 'utils'
import { ReactComponent as Arrow } from 'widgets/Icons/Arrow.svg'
import { ReactComponent as Select } from 'widgets/Icons/Select.svg'
import Button from 'widgets/Button'

import styles from './languageDialog.module.scss'

const { LOCALES } = CONSTANTS

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
  const [lng, setLng] = useState(i18n.language as typeof LOCALES[number])

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const onSubmit = useCallback(() => {
    setLocale(lng)
    close()
  }, [close, lng])

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
        <div className={styles.dropdown}>
          <SelectItem
            locale={lng}
            className={styles.content}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            data-active={isDropdownOpen}
            sufIcon={<Arrow />}
          />
          {isDropdownOpen ? (
            <div className={styles.selects}>
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
