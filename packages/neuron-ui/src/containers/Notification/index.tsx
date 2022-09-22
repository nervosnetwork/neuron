import React, { useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Stack, MessageBar, MessageBarType, IconButton, Panel, PanelType, Text } from 'office-ui-fabric-react'
import { Close, AttentionOutline } from 'widgets/Icons/icon'
import {
  useState as useGlobalState,
  useDispatch,
  toggleAllNotificationVisibility,
  toggleTopAlertVisibility,
  dismissNotification,
  dismissAlertDialog,
} from 'states'
import { useOnLocaleChange, useGlobalNotifications } from 'utils'

import AlertDialog from 'widgets/AlertDialog'
import styles from './Notification.module.scss'

export const NoticeContent = () => {
  const {
    app: { notifications = [], popups = [], showTopAlert = false, showAllNotifications = false, alertDialog },
  } = useGlobalState()
  const dispatch = useDispatch()
  const [t, i18n] = useTranslation()
  useOnLocaleChange(i18n)
  useGlobalNotifications(dispatch)

  const notificationsInDesc = useMemo(() => [...notifications].reverse(), [notifications])
  const notification: State.Message | undefined = notificationsInDesc[0]

  const onTopAlertDismiss = useCallback(() => {
    toggleTopAlertVisibility(false)(dispatch)
  }, [dispatch])

  const onPanelDismiss = useCallback(() => {
    toggleAllNotificationVisibility()(dispatch)
  }, [dispatch])

  const onNotificationDismiss = useCallback(
    (timestamp: number) => () => {
      dismissNotification(timestamp)(dispatch)
    },
    [dispatch]
  )

  const onDismissAlertDialog = useCallback(() => {
    dismissAlertDialog()(dispatch)
  }, [dispatch])

  return (
    <div className={styles.root}>
      {showTopAlert && notification ? (
        <div className={styles.notification}>
          <AttentionOutline className={styles.attention} />
          {notification.code
            ? t(`messages.codes.${notification.code}`, notification.meta)
            : notification.content || t('messages.unknown-error')}
          <Close className={styles.close} onClick={onTopAlertDismiss} />
        </div>
      ) : null}

      <div className={styles.autoDismissMessages}>
        {popups.map(popup => (
          <MessageBar key={`${popup.timestamp}`} messageBarType={MessageBarType.success}>
            {t(popup.text)}
          </MessageBar>
        ))}
      </div>

      <Panel
        isOpen={showAllNotifications}
        type={PanelType.smallFixedFar}
        onDismiss={onPanelDismiss}
        headerText={t('notification-panel.title')}
        isHiddenOnDismiss
        isLightDismiss
        styles={{
          header: {
            padding: '0 5px!important',
          },
          content: {
            padding: '0!important',
          },
          navigation: {
            display: 'none',
          },
        }}
      >
        {notificationsInDesc.map(n => {
          return (
            <Stack
              key={n.timestamp}
              styles={{
                root: {
                  padding: '5px 15px',
                  boxShadow: '1px 1px 3px rgba(0,0,0,0.1)',
                  borderLeft: `4px solid`,
                  borderLeftColor: n.type === 'warning' ? '#fff176ba' : '#ff3d00ba',
                  margin: '10px 0',
                },
              }}
            >
              <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
                <Text
                  styles={{
                    root: [{ textTransform: 'capitalize' }],
                  }}
                >
                  {t(`message-types.${n.type}`)}
                </Text>
                <IconButton iconProps={{ iconName: 'Dismiss' }} onClick={onNotificationDismiss(n.timestamp)} />
              </Stack>
              <Text as="p">
                {n.code ? t(`messages.codes.${n.code}`, n.meta) : n.content || t('messages.unknown-error')}
              </Text>
            </Stack>
          )
        })}
      </Panel>
      {alertDialog && <AlertDialog onCancel={onDismissAlertDialog} {...alertDialog} />}
    </div>
  )
}

NoticeContent.displayName = 'NoticeContent'

const Notification = (props: any) =>
  createPortal(<NoticeContent {...props} />, document.querySelector('#notification') as HTMLElement)

export default Notification
