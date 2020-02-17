import React, { useMemo, useCallback, MouseEventHandler } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Stack, MessageBar, MessageBarType, IconButton, Panel, PanelType, Text } from 'office-ui-fabric-react'
import { useState as useGlobalState, useDispatch } from 'states/stateProvider'
import { StateDispatch } from 'states/stateProvider/reducer'
import {
  toggleAllNotificationVisibility,
  toggleTopAlertVisibility,
  dismissNotification,
} from 'states/stateProvider/actionCreators'
import AlertDialog from 'widgets/AlertDialog'
import styles from './Notification.module.scss'

const notificationType = (type: 'success' | 'warning' | 'alert') => {
  switch (type) {
    case 'success': {
      return MessageBarType.success
    }
    case 'warning': {
      return MessageBarType.warning
    }
    case 'alert': {
      return MessageBarType.error
    }
    default: {
      return MessageBarType.info
    }
  }
}

const DismissTopAlertButton = ({ onDismiss }: { onDismiss: React.MouseEventHandler<HTMLButtonElement> }) => (
  <IconButton iconProps={{ iconName: 'Dismiss' }} onClick={onDismiss} />
)

const TopAlertActions = ({
  count = 0,
  dispatch,
  onDismiss,
}: {
  count: number
  dispatch: StateDispatch
  onDismiss: MouseEventHandler
}) => (
  <Stack horizontal verticalAlign="center">
    {count > 1 ? (
      <IconButton
        iconProps={{ iconName: 'More' }}
        onClick={() => {
          toggleAllNotificationVisibility()(dispatch)
        }}
      >
        more
      </IconButton>
    ) : null}
    <DismissTopAlertButton onDismiss={onDismiss} />
  </Stack>
)

export const NoticeContent = () => {
  const {
    app: { notifications = [], alertDialog = null, popups = [], showTopAlert = false, showAllNotifications = false },
  } = useGlobalState()
  const dispatch = useDispatch()
  const [t] = useTranslation()

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

  return (
    <div>
      {showTopAlert && notification ? (
        <MessageBar
          messageBarType={notificationType(notification.type)}
          styles={{
            root: {
              flexDirection: 'row',
            },
            actions: {
              margin: 0,
              marginRight: '12px',
            },
          }}
          actions={
            <TopAlertActions dispatch={dispatch} count={notificationsInDesc.length} onDismiss={onTopAlertDismiss} />
          }
        >
          {notification.code
            ? t(`messages.codes.${notification.code}`, notification.meta)
            : notification.content || t('messages.unknown-error')}
        </MessageBar>
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
      <AlertDialog content={alertDialog} dispatch={dispatch} />
    </div>
  )
}

NoticeContent.displayName = 'NoticeContent'

const Notification = (props: any) =>
  createPortal(<NoticeContent {...props} />, document.querySelector('#notification') as HTMLElement)

export default Notification
