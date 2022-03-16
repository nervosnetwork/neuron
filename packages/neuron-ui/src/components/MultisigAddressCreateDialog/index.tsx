import React, { useState, useCallback } from 'react'

import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import InputSelect from 'widgets/InputSelect'
import { useState as useGlobalState } from 'states'
import { MultisigConfig } from 'services/remote'
import MultisigAddressInfo, { MultisigAddressTable } from 'components/MultisigAddressInfo'
import { isMainnet as isMainnetUtil } from 'utils'

import { useMAndN, useMultiAddress, Step, useViewMultisigAddress } from './hooks'
import styles from './multisig-address-create-dialog.module.scss'

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
      <span>{t('multisig-address.create-dialog.m-n.title')}</span>
      <br />
      <div className={styles.countSelect}>
        <InputSelect options={keysCountArr} value={m} onChange={changeM} />
        &nbsp;&nbsp;&nbsp;&nbsp;of&nbsp;&nbsp;&nbsp;&nbsp;
        <InputSelect options={keysCountArr} value={n} onChange={changeN} />
      </div>
      {m && n && Number(m) > Number(n) && (
        <span className={styles.error}>{t('multisig-address.create-dialog.m-n.error')}</span>
      )}
    </div>
  )
}

const MultisigAddressCreateDialog = ({
  closeDialog,
  confirm: saveConfig,
}: {
  closeDialog: () => void
  confirm: (v: Omit<MultisigConfig, 'id' | 'walletId'>) => Promise<void>
}) => {
  const [step, changeStep] = useState(Step.setMN)
  const [t] = useTranslation()
  const { m, n, setMBySelect, setNBySelect, isError: mnErr } = useMAndN()
  const next = useCallback(() => {
    changeStep(step + 1)
  }, [changeStep, step])
  const back = useCallback(() => {
    changeStep(step - 1)
  }, [changeStep, step])
  const {
    chain: { networkID },
    settings: { networks = [] },
  } = useGlobalState()
  const isMainnet = isMainnetUtil(networks, networkID)
  const { r, addresses, changeR, changeAddress, isError: addressErr, addressErrors } = useMultiAddress({
    n: Number(n),
    isMainnet,
  })
  const multisigAddress = useViewMultisigAddress({
    m: Number(m),
    n: Number(n),
    r,
    addresses,
    step,
    isMainnet,
  })

  const confirm = useCallback(() => {
    saveConfig({
      m: Number(m),
      n: Number(n),
      r,
      addresses,
      fullPayload: multisigAddress,
    }).then(() => {
      closeDialog()
    })
  }, [m, n, r, addresses, multisigAddress, saveConfig, closeDialog])

  return (
    <>
      <p>{t('multisig-address.create-dialog.title')}</p>
      {step === Step.setMN && <SetMN m={m} n={n} changeM={setMBySelect} changeN={setNBySelect} />}
      {step === Step.setMultiAddress && (
        <>
          <p>{t('multisig-address.create-dialog.multi-address-info.title', { m, n })}</p>
          <MultisigAddressTable
            r={r}
            addresses={addresses}
            changeR={changeR}
            changeAddress={changeAddress}
            addressErrors={addressErrors}
          />
        </>
      )}
      {step === Step.viewMultiAddress && (
        <MultisigAddressInfo m={m} n={n} r={r} addresses={addresses} multisigAddress={multisigAddress} />
      )}
      <div className={styles.actions}>
        <Button
          label={t(`multisig-address.create-dialog.actions.${step === Step.setMN ? 'cancel' : 'back'}`)}
          type="cancel"
          onClick={step === Step.setMN ? closeDialog : back}
        />
        <Button
          label={t(`multisig-address.create-dialog.actions.${step === Step.viewMultiAddress ? 'confirm' : 'next'}`)}
          type="primary"
          disabled={(step === Step.setMN && mnErr) || (step === Step.setMultiAddress && addressErr)}
          onClick={step === Step.viewMultiAddress ? confirm : next}
        />
      </div>
    </>
  )
}

MultisigAddressCreateDialog.displayName = 'MultisigAddressCreateDialog'

export default MultisigAddressCreateDialog
