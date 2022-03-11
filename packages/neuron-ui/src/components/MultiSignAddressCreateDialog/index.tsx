import React, { useState, useCallback } from 'react'

import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import InputSelect from 'widgets/InputSelect'
import { useState as useGlobalState } from 'states'
import { MultiSignConfig } from 'services/remote'
import MultiSignAddressInfo, { MultiSignAddressTable } from 'components/MultiSignAddressInfo'
import { isMainnet as isMainnetUtil } from 'utils'

import { useMAndN, useMultiAddress, Step, useViewMultiSignAddress } from './hooks'
import styles from './multi-sign-address-create-dialog.module.scss'

const keysCountArr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(number => ({ value: number.toString(), label: number }))

const SetMN = ({
  m,
  n,
  changeM,
  changeN,
}: {
  m: string
  n: string
  changeM: (v: string) => void
  changeN: (v: string) => void
}) => {
  const [t] = useTranslation()
  return (
    <div className={styles.setMNRoot}>
      <span>{t('multi-sign-address.create-dialog.m-n.title')}</span>
      <br />
      <div className={styles.countSelect}>
        <InputSelect options={keysCountArr} value={m} onChange={changeM} />
        &nbsp;&nbsp;&nbsp;&nbsp;of&nbsp;&nbsp;&nbsp;&nbsp;
        <InputSelect options={keysCountArr} value={n} onChange={changeN} />
      </div>
      {m && n && Number(m) > Number(n) && (
        <span className={styles.error}>{t('multi-sign-address.create-dialog.m-n.error')}</span>
      )}
    </div>
  )
}

const MultiSignAddressCreateDialog = ({
  closeDialog,
  confirm: saveConfig,
}: {
  closeDialog: () => void
  confirm: (v: Omit<MultiSignConfig, 'id' | 'walletId'>) => Promise<void>
}) => {
  const [step, changeStep] = useState(Step.setMN)
  const [t] = useTranslation()
  const { m, n, changeMBySelect, changeNBySelect, isError: mnErr } = useMAndN()
  const next = useCallback(() => {
    changeStep(step + 1)
  }, [changeStep, step])
  const back = useCallback(() => {
    changeStep(step - 1)
  }, [changeStep, step])
  const { r, blake160s, changeR, changeAddress, isError: addressErr } = useMultiAddress({ n: Number(n) })
  const {
    chain: { networkID },
    settings: { networks = [] },
  } = useGlobalState()
  const isMainnet = isMainnetUtil(networks, networkID)
  const multiSignAddress = useViewMultiSignAddress({
    m: Number(m),
    n: Number(n),
    r,
    blake160s,
    step,
    isMainnet,
  })

  const confirm = useCallback(() => {
    saveConfig({
      m: Number(m),
      n: Number(n),
      r,
      blake160s,
      fullPayload: multiSignAddress,
    }).then(() => {
      closeDialog()
    })
  }, [m, n, r, blake160s, multiSignAddress, saveConfig, closeDialog])

  return (
    <>
      <p>{t('multi-sign-address.create-dialog.title')}</p>
      {step === Step.setMN && <SetMN m={m} n={n} changeM={changeMBySelect} changeN={changeNBySelect} />}
      {step === Step.setMultiAddress && (
        <>
          <p>{t('multi-sign-address.create-dialog.multi-address-info.title', { m, n })}</p>
          <MultiSignAddressTable r={r} blake160s={blake160s} changeR={changeR} changeAddress={changeAddress} />
        </>
      )}
      {step === Step.viewMultiAddress && (
        <MultiSignAddressInfo m={m} n={n} r={r} blake160s={blake160s} multiSignAddress={multiSignAddress} />
      )}
      <div className={styles.actions}>
        <Button
          label={t(`multi-sign-address.create-dialog.actions.${step === Step.setMN ? 'cancel' : 'back'}`)}
          type="cancel"
          onClick={step === Step.setMN ? closeDialog : back}
        />
        <Button
          label={t(`multi-sign-address.create-dialog.actions.${step === Step.viewMultiAddress ? 'confirm' : 'next'}`)}
          type="primary"
          disabled={(step === Step.setMN && mnErr) || (step === Step.setMultiAddress && addressErr)}
          onClick={step === Step.viewMultiAddress ? confirm : next}
        />
      </div>
    </>
  )
}

MultiSignAddressCreateDialog.displayName = 'MultiSignAddressCreateDialog'

export default MultiSignAddressCreateDialog
