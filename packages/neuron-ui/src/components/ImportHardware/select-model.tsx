import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import Select from 'widgets/Select'
import { Text } from 'office-ui-fabric-react'
import { useHistory } from 'react-router-dom'
import { useGoBack } from 'utils'
import styles from './findDevice.module.scss'
import { ActionType, Model, ImportStep } from './common'

const supportedHardwareModels = [
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
]

const SelectModel = ({ dispatch }: { dispatch: React.Dispatch<ActionType> }) => {
  const [t] = useTranslation()
  const [model, setModel] = useState<Model>()
  const history = useHistory()
  const onBack = useGoBack(history)
  const onNext = useCallback(() => {
    dispatch({
      model,
      step: ImportStep.DetectDevice,
    })
  }, [dispatch, model])

  const onDropDownChange = useCallback(({ data }) => {
    setModel(data)
  }, [])

  return (
    <form onSubmit={onNext} className={styles.container}>
      <header className={styles.title}>{t('import-hardware.title.select-model')}</header>
      <section className={styles.main}>
        <Select
          onChange={onDropDownChange}
          placeholder={t('import-hardware.select-model')}
          options={supportedHardwareModels}
        />
        <Text variant="tiny">{t('messages.experimental-message-hardware')}</Text>
      </section>
      <footer className={styles.footer}>
        <Button type="cancel" label={t('import-hardware.actions.cancel')} onClick={onBack} />
        <Button
          type="submit"
          label={t('import-hardware.actions.next')}
          onClick={onNext}
          disabled={model === undefined}
        />
      </footer>
    </form>
  )
}

SelectModel.displayName = 'SelectModel'

export default SelectModel
