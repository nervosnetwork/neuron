import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { showErrorMessage, signMessage, verifyMessage } from 'services/remote'
import { ControllerResponse } from 'services/remote/remoteApiWrapper'
import { ErrorCode, isMainnet as isMainnetUtil } from 'utils'
import { useState as useGlobalState } from 'states'
import Tooltip from 'widgets/Tooltip'
import { PartnerIcon, CkbIcon } from 'widgets/Icons/icon'
import Button from 'widgets/Button'
import Dialog from 'widgets/Dialog'
import styles from './perunCreationRequestList.module.scss'

export const CreationRequestCell = ({ data }: { data: string }) => {
  const [t] = useTranslation()

  const onDismiss = useCallback(() => {
    console.log(data)
  }, [])

  const onConfirm = useCallback(() => {}, [])

  return (
    <div className={styles.cellWrap}>
      <h2 className={styles.content}>
        <Tooltip tip={t('perun.partner')} showTriangle placement="top">
          <PartnerIcon />
        </Tooltip>
        <p className={styles.address}>ckb1ad...8457ju</p>
        <CkbIcon />
        <p>CKB</p>
        <p className={styles.amount}>34,000.1</p>
      </h2>
      <div className={styles.creationRequestBtnWrap}>
        <Button type="cancel" onClick={onDismiss}>
          {t('perun.dismiss')}
        </Button>
        <Button type="primary" onClick={onConfirm}>
          {t('common.confirm')}
        </Button>
      </div>
    </div>
  )
}

export const PerunCreationRequestList = ({ onCancel }: { onCancel: () => void }) => {
  const [t] = useTranslation()

  const list = [1, 2, 3, 4]

  return (
    <Dialog show title={t('perun.channel-creation-request-list')} showFooter={false} onCancel={onCancel}>
      <div className={styles.container}>
        {list.map(item => (
          <CreationRequestCell key={item} data={item} />
        ))}
      </div>
    </Dialog>
  )
}

PerunCreationRequestList.displayName = 'PerunCreationRequestList'

export default PerunCreationRequestList
