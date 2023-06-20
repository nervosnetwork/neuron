import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import { CreateFirstWalletNav } from 'components/WalletWizard'
import { useGoBack } from 'utils'
import { AttentionOutline } from 'widgets/Icons/icon'
import TextField from 'widgets/TextField'
import styles from './findDevice.module.scss'
import { ActionType, ImportStep, Model } from './common'

const supportedHardwareModels = [
  {
    label: 'Ledger Nano S Plus',
    value: 'Ledger Nano S Plus',
    data: {
      manufacturer: 'Ledger',
      product: 'Nano S Plus',
    },
  },
  {
    label: 'Ledger Nano S',
    value: 'Ledger Nano S',
    data: {
      manufacturer: 'Ledger',
      product: 'Nano S',
    },
  },
  {
    label: 'Ledger Nano X',
    value: 'Ledger Nano X',
    data: {
      manufacturer: 'Ledger',
      product: 'Nano X',
    },
  },
  {
    labelI18n: 'import-hardware.other-device',
    value: 'Other Device',
    data: null,
  },
]

const SelectModel = ({ dispatch }: { dispatch: React.Dispatch<ActionType> }) => {
  const [t] = useTranslation()
  const [model, setModel] = useState<Model | null>()
  const onBack = useGoBack()
  const onNext = useCallback(() => {
    dispatch({
      model,
      step: ImportStep.DetectDevice,
    })
  }, [dispatch, model])

  const onClickDeviceType = useCallback(e => {
    const { dataset } = e.target
    setModel(
      dataset.manufacturer && dataset.product
        ? {
            manufacturer: dataset.manufacturer,
            product: dataset.product,
          }
        : null
    )
  }, [])
  const options = useMemo(
    () =>
      supportedHardwareModels.map(v =>
        v.labelI18n
          ? {
              ...v,
              label: t(v.labelI18n),
            }
          : v
      ),
    []
  )

  return (
    <div className={styles.container}>
      <header className={styles.title}>{t('import-hardware.title.select-model')}</header>
      <CreateFirstWalletNav />
      <section className={styles.selectDevice}>
        {options.map(v => (
          <TextField
            key={v.value}
            data-manufacturer={v.data?.manufacturer}
            data-product={v.data?.product}
            type="button"
            value={v.label}
            onClick={onClickDeviceType}
            selected={
              model === v.data ||
              (!!model && model.manufacturer === v.data?.manufacturer && model.product === v.data?.product)
            }
          />
        ))}
      </section>
      <div className={styles.attention}>
        <AttentionOutline />
        {t('messages.experimental-message-hardware')}
      </div>
      <footer className={styles.footer}>
        <Button
          type="submit"
          label={t('import-hardware.actions.next')}
          onClick={onNext}
          disabled={model === undefined}
        />
        <Button type="text" label={t('import-hardware.actions.cancel')} onClick={onBack} />
      </footer>
    </div>
  )
}

SelectModel.displayName = 'SelectModel'

export default SelectModel
