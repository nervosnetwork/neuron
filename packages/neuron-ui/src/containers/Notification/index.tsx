import React, { useContext, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MessageBar, MessageBarType, IconButton } from 'office-ui-fabric-react'
import { NeuronWalletContext } from 'states/stateProvider'
import { StateWithDispatch, AppActions } from 'states/stateProvider/reducer'
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

const DismissButton = ({ onDismiss }: { onDismiss: React.MouseEventHandler<HTMLButtonElement> }) => (
  <IconButton iconProps={{ iconName: 'Dismiss' }} onClick={onDismiss} />
)

const NoticeContent = ({ dispatch }: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const {
    app: { notifications = [], popups = [] },
  } = useContext(NeuronWalletContext)
  const [t] = useTranslation()
  const onDismiss = useCallback(() => {
    dispatch({
      type: AppActions.ClearNotifications,
      payload: null,
    })
  }, [dispatch])

  const notification = notifications[0]

  return (
    <div>
      {notifications.length ? (
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
          actions={<DismissButton onDismiss={onDismiss} />}
        >
          {t(notification.content)}
        </MessageBar>
      ) : null}
      <div className={styles.autoDismissMessages}>
        {popups.map(popup => (
          <MessageBar key={`${popup.timestamp}`} messageBarType={MessageBarType.success}>
            {t(popup.text)}
          </MessageBar>
        ))}
      </div>
    </div>
  )
}

NoticeContent.displayName = 'NoticeContent'

const Notification = (props: any) =>
  createPortal(<NoticeContent {...props} />, document.querySelector('#notification') as HTMLElement)

export default Notification
