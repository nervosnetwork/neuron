import { scriptToAddress } from '@nervosnetwork/ckb-sdk-utils'
import React, { FC } from 'react'
import { shannonToCKBFormatter } from 'utils'
import Tooltip from 'widgets/Tooltip'
import CopyZone from 'widgets/CopyZone'
import { ArrowDownRound } from 'widgets/Icons/icon'
import styles from './txTopology.module.scss'

const TopologyCellItem = ({
  inputStatus,
  label,
  address,
  amount,
}: {
  inputStatus?: string
  label: string
  address?: string
  amount: string
}) => {
  return (
    <div className={styles.cellItemRoot}>
      {inputStatus ? <div className={styles.inputStatus}>{inputStatus}</div> : null}
      <div className={styles.itemTable}>
        <div className={styles.label}>{label}</div>
        <div className={styles.amount}>{`${shannonToCKBFormatter(amount)} CKB`}</div>
        {address ? (
          <Tooltip
            tip={
              <CopyZone content={address} className={styles.copyAddress}>
                {address}
              </CopyZone>
            }
            className={styles.address}
            placement="top"
            showTriangle
            isTriggerNextToChild
          >
            <div>{`${address.slice(0, 8)}...${address.slice(-10)}`}</div>
          </Tooltip>
        ) : null}
      </div>
    </div>
  )
}

const TxTopology: FC<{
  tx: State.GeneratedTx
  isMainnet: boolean
}> = ({ tx, isMainnet }) => {
  return (
    <div className={styles.root}>
      <div className={styles.inputs}>
        {tx.inputs.map((v, idx) =>
          v.lock && v.capacity ? (
            <TopologyCellItem
              // eslint-disable-next-line react/no-array-index-key
              key={idx.toString()}
              label={`Input${idx + 1}`}
              address={scriptToAddress(v.lock, isMainnet)}
              amount={v.capacity}
              inputStatus={v.status === 'sent' ? 'Pending' : 'On-chain'}
            />
          ) : null
        )}
      </div>
      <div className={styles.center}>
        {tx.inputs.length > 1 ? (
          <>
            <div className={styles.inputConnection} style={{ height: `${(tx.inputs.length - 1) * 91}px` }}>
              {Array.from({ length: (tx.inputs.length - 1) * 4 }).map((_, idx) => (
                <div
                  data-idx={idx}
                  data-ignore-right={idx > 2 * tx.inputs.length - 4 && idx < 2 * tx.inputs.length - 1}
                  className={
                    tx.inputs.length % 2 !== 0 && idx === tx.inputs.length * 2 - 2 ? styles.centerLine : undefined
                  }
                />
              ))}
            </div>
            <div className={styles.inputConnectTx}>
              <div />
              <ArrowDownRound />
              <div />
            </div>
          </>
        ) : (
          <div className={styles.onlyOneInput}>
            <ArrowDownRound />
          </div>
        )}
        <div className={styles.txBox}>Transaction</div>
        <div className={styles.outputConnectTx}>
          <div />
          <div />
        </div>
        <div className={styles.outputConnection} style={{ height: `${tx.outputs.length * 91}px` }}>
          {Array.from({ length: tx.outputs.length * 4 }).map((_, idx) => (
            <div
              data-idx={idx}
              data-ignore-left={idx > 2 * tx.outputs.length - 2 && idx <= 2 * tx.outputs.length}
              className={tx.outputs.length % 2 === 0 && idx === tx.outputs.length * 2 ? styles.centerLine : undefined}
            >
              {idx % 4 === 0 || idx === tx.outputs.length * 4 - 1 ? <ArrowDownRound /> : null}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.outputs}>
        {tx.outputs.map((v, idx) =>
          v.lock && v.capacity ? (
            <TopologyCellItem
              // eslint-disable-next-line react/no-array-index-key
              key={idx.toString()}
              label={v.isChangeCell ? 'Change' : 'Receive'}
              address={scriptToAddress(v.lock, isMainnet)}
              amount={v.capacity}
            />
          ) : null
        )}
        <TopologyCellItem label="Fee" amount={tx.fee} />
        <div className={styles.placeHolder} />
      </div>
    </div>
  )
}

TxTopology.displayName = 'TxTopology'

export default TxTopology
