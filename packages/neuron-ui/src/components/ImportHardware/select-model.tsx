import React, { useCallback, useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import Select from 'widgets/Select'
import { Text } from 'office-ui-fabric-react'
import styles from './findDevice.module.scss'
import { LocationState, Model, RoutePath } from './common'

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

const SelectModel = ({ match, history }: RouteComponentProps<{}, {}, LocationState>) => {
  const [t] = useTranslation()
  const [model, setModel] = useState<Model>()

  const onBack = useCallback(() => {
    history.push(match.url.replace(RoutePath.ImportHardware, ''))
  }, [history, match.url])

  const onNext = useCallback(() => {
    history.push({
      pathname: match.url + RoutePath.DetectDevice,
      state: {
        model: model!,
        entryPath: match.url,
      },
    })
  }, [history, match.url, model])

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
        <Text variant="tiny">{t('import-hardware.review-warning')}</Text>
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
