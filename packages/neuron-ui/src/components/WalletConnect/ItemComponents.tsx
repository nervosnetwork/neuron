import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import { clsx, shannonToCKBFormatter, isMainnet as isMainnetUtil } from 'utils'
import { scriptToAddress } from '@nervosnetwork/ckb-sdk-utils'
import { useState as useGlobalState } from 'states'
import { Proposal, Session, SessionRequest, SignTransactionParams } from '@ckb-connect/walletconnect-wallet-sdk'
import { DetailIcon } from 'widgets/Icons/icon'
import styles from './walletConnect.module.scss'

interface PrososalItemProps {
  data: Proposal
  key: string
  onApproveSession: (id: string, scriptBases: string[]) => void
  onRejectSession: (e: React.SyntheticEvent<HTMLButtonElement>) => void
  userName: string
  supportedScriptBases: Record<string, string>
}

export const PrososalItem = ({
  data,
  key,
  onApproveSession,
  onRejectSession,
  userName,
  supportedScriptBases,
}: PrososalItemProps) => {
  const [t] = useTranslation()
  const scriptBases =
    Object.values(supportedScriptBases).filter(item => data?.params?.sessionProperties?.scriptBases?.includes(item)) ||
    []

  const initScriptBases = scriptBases.length ? scriptBases : Object.keys(scriptBases)
  const [selectHashes, setSelectHashes] = useState<string[]>(initScriptBases)
  const metadata = data?.params?.proposer?.metadata || {}

  const onChangeChecked = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { hash } = e.target.dataset
      if (hash) {
        if (e.target.checked && !selectHashes.includes(hash)) {
          setSelectHashes([...selectHashes, hash])
        } else {
          setSelectHashes(selectHashes.filter(v => v !== hash))
        }
      }
    },
    [selectHashes, setSelectHashes]
  )

  const handleApprove = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id } = e.target.dataset
      if (id) {
        await onApproveSession(id, selectHashes)
      }
    },
    [onApproveSession, selectHashes]
  )

  return (
    <div className={styles.itemWrap} key={key}>
      <div className={styles.itemContent}>
        <p className={styles.title}>{metadata.name}</p>
        <div className={styles.nameWrap}>
          <p>
            {t('wallet-connect.user-name')}: {userName}
          </p>
          <div>Lock Hash:</div>
          <div className={styles.hashWrap}>
            {Object.entries(supportedScriptBases).map(([hashName, hash]) => (
              <label htmlFor={hash}>
                <input
                  type="checkbox"
                  data-hash={hash}
                  id={hash}
                  onChange={onChangeChecked}
                  checked={selectHashes.includes(hash)}
                />
                <span>{hashName}</span>
              </label>
            ))}
          </div>
        </div>
        <p>{metadata.url}</p>
      </div>
      <div>
        <Button type="cancel" data-id={data.id} onClick={onRejectSession}>
          {t('wallet-connect.reject')}
        </Button>
        <Button type="primary" className={styles.ml12} data-id={data.id} onClick={handleApprove}>
          {t('wallet-connect.approve')}
        </Button>
      </div>
    </div>
  )
}

interface SessionItemProps {
  data: Session
  key: string
  onDisconnect: (e: React.SyntheticEvent<HTMLButtonElement>) => void
  userName: string
  supportedScriptBases: Record<string, string>
}

export const SessionItem = ({ data, key, onDisconnect, userName, supportedScriptBases }: SessionItemProps) => {
  const [t] = useTranslation()
  const scriptBases = data?.sessionProperties?.scriptBases || ''
  const { name = '', url = '' } = data?.peer?.metadata || {}

  return (
    <div className={styles.itemWrap} key={key}>
      <div className={styles.itemContent}>
        <p className={styles.title}>{name}</p>
        <div className={styles.nameWrap}>
          <p>
            {t('wallet-connect.user-name')}: {userName}
          </p>
          <div>Lock Hash:</div>
          <div className={styles.hashWrap}>
            {Object.entries(supportedScriptBases).map(([hashName, hash]) => (
              <label htmlFor={hash}>
                <input type="checkbox" id={hash} checked={scriptBases.includes(hash)} disabled />
                <span>{hashName}</span>
              </label>
            ))}
          </div>
        </div>
        <p>{url}</p>
      </div>

      <Button type="cancel" className={styles.dangerBtn} data-topic={data.topic} onClick={onDisconnect}>
        {t('wallet-connect.disconnect')}
      </Button>
    </div>
  )
}

interface MessageItemProps {
  data: SessionRequest
  key: string
  approve: (e: React.SyntheticEvent<HTMLButtonElement>) => void
  sessions: Session[]
  onRejectRequest: (e: React.SyntheticEvent<HTMLButtonElement>) => void
}

export const MessageItem = ({ data, approve, sessions, onRejectRequest, key }: MessageItemProps) => {
  const [t] = useTranslation()
  const session = sessions.find(item => item.topic === data.topic)
  const { name = '', url = '' } = session?.peer?.metadata || {}

  return (
    <div className={styles.itemWrap} key={key}>
      <div className={styles.itemContent}>
        <p className={styles.title}>
          {name} <span>{url}</span>
        </p>
        <p>
          {t('wallet-connect.sign-info')}: {data.params.request.params.message}
        </p>
      </div>
      <div>
        <Button type="cancel" data-id={data.id} onClick={onRejectRequest}>
          {t('wallet-connect.reject')}
        </Button>
        <Button type="primary" className={styles.ml12} data-id={data.id} onClick={approve}>
          {t('wallet-connect.next')}
        </Button>
      </div>
    </div>
  )
}

interface TransactionItemProps {
  data: SessionRequest
  key: string
  approve: (e: React.SyntheticEvent<HTMLButtonElement>) => void
  sessions: Session[]
  onRejectRequest: (e: React.SyntheticEvent<HTMLButtonElement>) => void
}

export const TransactionItem = ({ data, approve, sessions, onRejectRequest, key }: TransactionItemProps) => {
  const {
    chain: { networkID },
    settings: { networks },
  } = useGlobalState()
  const [t] = useTranslation()
  const isMainnet = isMainnetUtil(networks, networkID)
  const session = sessions.find(item => item.topic === data.topic)
  const { name = '', url = '' } = session?.peer?.metadata || {}
  const params = data.params.request.params as SignTransactionParams

  const { outputs = [], fee, description } = params.transaction
  const firstOutputAddress = outputs.length ? scriptToAddress(outputs[0].lock, isMainnet) : ''
  const capacity = outputs.reduce((pre, cur) => BigInt(pre) + BigInt(cur.capacity), BigInt(0)).toString()

  return (
    <div className={clsx(styles.itemWrap, styles.transactionItem)} key={key}>
      <div className={styles.itemContent}>
        <p className={styles.title}>
          {name} <span>{url}</span>
        </p>
        <p>
          {t('wallet-connect.transfer-info')}: {params.description}
        </p>

        <div className={styles.infoContent}>
          <div>
            <h3>{t('transaction.address')}</h3>
            <p>
              <span className={styles.address}>
                {firstOutputAddress.slice(0, 16)}...{firstOutputAddress.slice(-16)}
              </span>{' '}
              (+{outputs.length} addresses)
            </p>
            <h3>{t('send.fee')}</h3>
            <p>{shannonToCKBFormatter(fee)}</p>
            <h3>{t('send.description')}</h3>
            <p>{description}</p>
            <button type="button" className={styles.detailButton} onClick={() => {}} data-hash="hash00000">
              <DetailIcon />
              {t('wallet-connect.view-details')}
            </button>
          </div>
          <div>
            <h3>{t('transaction.amount')}</h3>
            <p>{shannonToCKBFormatter(capacity)}</p>
            <h3>{t('wallet-connect.locked-period')}</h3>
            <p>-</p>
          </div>
        </div>

        <div className={styles.rightActions}>
          <Button type="cancel" data-id={data.id} onClick={onRejectRequest}>
            {t('wallet-connect.reject')}
          </Button>
          <Button type="primary" data-id={data.id} onClick={approve}>
            {t('wallet-connect.next')}
          </Button>
        </div>
      </div>
    </div>
  )
}
