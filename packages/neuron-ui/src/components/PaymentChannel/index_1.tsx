import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState } from 'states'
import { PerunState as PerunStateSubject } from 'services/subjects'
import { bytes } from '@ckb-lumos/codec'
import { blockchain } from '@ckb-lumos/base'
import Dialog from 'widgets/Dialog'
import Button from 'widgets/Button'
import Switch from 'widgets/Switch'
import Tooltip from 'widgets/Tooltip'
import PageContainer from 'components/PageContainer'
import {
  PerunIcon,
  AddSimple,
  DetailIcon,
  CkbIcon,
  InfoCircleOutlined,
  DepositTimeSort,
  PerunSend,
  PerunClose,
  LineDownArrow,
} from 'widgets/Icons/icon'
import TableNoData from 'widgets/Icons/TableNoData.png'
import { type CKBComponents } from '@ckb-lumos/lumos/rpc'
import {
  SerializeOffChainParticipant,
  SerializeSEC1EncodedPubKey,
} from '@ckb-connect/perun-wallet-wrapper/dist/ckb/serialization'
import { channelIdToString, channelIdFromString } from '@ckb-connect/perun-wallet-wrapper/dist/translator'
import * as wire from '@ckb-connect/perun-wallet-wrapper/dist/wire'

import { ControllerResponse } from 'services/remote/remoteApiWrapper'
import {
  OfflineSignStatus,
  OfflineSignType,
  getCurrentWalletAccountExtendedPubKey,
  perunServiceAction,
  respondPerunRequest,
  signRawMessage,
  signTransactionOnly,
  showErrorMessage,
} from 'services/remote'
import { addressToScript, scriptToAddress, bytesToHex, ErrorCode, errorFormatter, isSuccessResponse, clsx } from 'utils'
import { PasswordDialog } from 'components/SignAndVerify'
import PerunCreationRequestList, { CreationRequestCell } from 'components/PerunCreationRequestList'
import PerunLockedInChannels from 'components/PerunLockedInChannels'
import PerunCloseChannel from 'components/PerunCloseChannel'
import PerunOpenChannel from 'components/PerunOpenChannel'
import PerunSendPayment from 'components/PerunSendPayment'
import { State } from '@ckb-connect/perun-wallet-wrapper/wire'
import TextField from 'widgets/TextField'
import styles from './perun.module.scss'

const OverviewCard = ({
  channelId,
  key,
  onClose,
  onSend,
}: {
  channelId: string
  key: string
  onClose: (channelId: string) => void
  onSend: (channelId: string) => void
}) => {
  return (
    <div key={key} className={styles.overviewItem}>
      <div className={styles.overviewItemContent}>
        <div className={styles.itemCell}>
          <p>Channel with</p>
          <p>
            at <span className={styles.time}>0x241872 20:15:24</span>
          </p>
        </div>
        <h2 className={styles.address}>ckb1qz...588pj7</h2>
        <div className={styles.itemCell}>
          <p>My Token Locked</p>
          <p>Funds other party</p>
        </div>
        <div className={styles.itemCell}>
          <h2>34,000.01 CKB</h2>
          <h2>100 CKB</h2>
        </div>
      </div>

      <div className={styles.overviewItemActions}>
        <Button type="text" data-color="error" onClick={() => onClose(channelId)}>
          <PerunClose />
          Close
        </Button>
        <Button type="text" onClick={() => onSend(channelId)}>
          <PerunSend />
          Send
        </Button>
      </div>
    </div>
  )
}

const PaymentChannel = () => {
  const { wallet } = useGlobalState()
  const [t, _] = useTranslation()
  const [showCreationRequestDialog, setShowCreationRequestDialog] = useState(false)
  const [isGroupByPartner, setIsGroupByPartner] = useState(false)
  const [isSortByTime, setIsSortByTime] = useState(false)
  const [closedPartners, setClosedPartners] = useState<string[]>([])
  const [showLockedInChannelsDialog, setShowLockedInChannelsDialog] = useState(false)
  const [showCloseChannelDialog, setShowCloseChannelDialog] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [showOpenChannelDialog, setShowOpenChannelDialog] = useState(false)
  const handleDismissAll = useCallback(() => {}, [])

  const list = ['2', '3']
  const assets = ['CKB', 'xUDT', 'xCKB', 'xUDT2', 'xUDT3']
  const requestList = ['2']

  const partners = {
    'ckb1qz...588pj7': ['2', '3'],
    'ckb1qz...588pj8': ['22', '33'],
    'ckb1qz...588pj9': ['2a', 'a3'],
  }

  const handleExpandPartner = useCallback(
    (value: string) => {
      if (closedPartners.includes(value)) {
        setClosedPartners(closedPartners.filter(item => item !== value))
      } else {
        setClosedPartners([...closedPartners, value])
      }
    },
    [closedPartners, setClosedPartners]
  )

  return (
    <PageContainer
      head={
        <div className={styles.pageHeader}>
          <PerunIcon />
          <p>{t('navbar.perun')}</p>
        </div>
      }
    >
      <div className={styles.container}>
        {list.length === 0 ? (
          <div className={clsx(styles.panel, styles.noRecords)}>
            <img src={TableNoData} alt="No Data" />
            <p>{t('perun.no-data')}</p>
            <Button type="primary" className={styles.createBtn} onClick={() => setShowOpenChannelDialog(true)}>
              <AddSimple />
              {t('perun.create-new-channel')}
            </Button>
          </div>
        ) : (
          <div>
            <div className={styles.topWrap}>
              <div className={clsx(styles.panel, styles.leftWrap)}>
                <h2>{t('perun.of-open-channels')}</h2>
                <h1>{list.length}</h1>
                <Button type="primary" className={styles.createBtn} onClick={() => setShowOpenChannelDialog(true)}>
                  <AddSimple />
                  {t('perun.create-new-channel')}
                </Button>
              </div>
              <div className={clsx(styles.panel, styles.rightWrap)}>
                <h2>
                  {t('perun.locked-in-channels')}{' '}
                  <Button type="text" className={styles.detailBtn} onClick={() => setShowLockedInChannelsDialog(true)}>
                    <DetailIcon />
                  </Button>
                </h2>
                <div className={styles.sliderWrap}>
                  {assets.map(item => (
                    <div className={styles.sliderItem} key={item}>
                      <h2>
                        <CkbIcon />
                        {item}
                      </h2>
                      <p>34,000.01</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.panel}>
              <div className={styles.creationRequest}>
                <h2 className={styles.title}>
                  {t('perun.channel-creation-request')} <span className={styles.badge}>4</span>
                </h2>
                {requestList.length > 1 ? (
                  <div className={styles.creationRequestBtnWrap}>
                    <Button type="cancel" onClick={handleDismissAll}>
                      {t('perun.dismiss-all')}
                    </Button>
                    <Button type="primary" onClick={() => setShowCreationRequestDialog(true)}>
                      {t('perun.check-request')}
                    </Button>
                  </div>
                ) : (
                  <CreationRequestCell data={requestList[0]} />
                )}
              </div>
            </div>

            <div className={clsx(styles.panel, styles.overview)}>
              <div className={styles.header}>
                <h2>
                  {t('perun.channel-overview')}
                  <Tooltip tip={t('perun.channel-overview-tooltip')} showTriangle placement="top">
                    <InfoCircleOutlined />
                  </Tooltip>
                </h2>
                <div className={styles.actions}>
                  <p>{t('perun.group-by-partner')}</p>
                  <Switch checked={isGroupByPartner} onChange={setIsGroupByPartner} />
                  <Button
                    type="text"
                    className={styles.sort}
                    data-sort={isSortByTime}
                    onClick={() => setIsSortByTime(!isSortByTime)}
                  >
                    <DepositTimeSort />
                  </Button>
                </div>
              </div>

              <div className={styles.overviewContent}>
                {isGroupByPartner ? (
                  <div>
                    {Object.keys(partners).map(partner => (
                      <div key={partner}>
                        <Button
                          type="text"
                          className={styles.partnerAddress}
                          data-expanded={!closedPartners.includes(partner)}
                          onClick={() => handleExpandPartner(partner)}
                        >
                          {partner} <LineDownArrow />
                        </Button>

                        <div className={styles.overviewWrap}>
                          {!closedPartners.includes(partner) &&
                            partners[partner].map(item => (
                              <OverviewCard
                                channelId={item}
                                key={item}
                                onClose={() => setShowCloseChannelDialog(true)}
                                onSend={() => setShowSendDialog(true)}
                              />
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.overviewWrap}>
                    {list.map(item => (
                      <OverviewCard
                        channelId={item}
                        key={item}
                        onClose={() => setShowCloseChannelDialog(true)}
                        onSend={() => setShowSendDialog(true)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showCreationRequestDialog && <PerunCreationRequestList onCancel={() => setShowCreationRequestDialog(false)} />}
        {showLockedInChannelsDialog && <PerunLockedInChannels onClose={() => setShowLockedInChannelsDialog(false)} />}
        {showCloseChannelDialog && <PerunCloseChannel onClose={() => setShowCloseChannelDialog(false)} />}
        {showOpenChannelDialog && <PerunOpenChannel onClose={() => setShowOpenChannelDialog(false)} />}
        {showSendDialog && <PerunSendPayment onClose={() => setShowSendDialog(false)} />}
      </div>
    </PageContainer>
  )
}

PaymentChannel.displayName = 'PaymentChannel'

export default PaymentChannel
