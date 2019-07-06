import React, { useContext, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MessageBar, MessageBarType, IconButton } from 'office-ui-fabric-react'
import { NeuronWalletContext } from 'states/stateProvider'
import { StateWithDispatch, AppActions } from 'states/stateProvider/reducer'
import { Close } from 'grommet-icons'

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
  <IconButton onClick={onDismiss}>
    <Close />
  </IconButton>
)

const NoticeContent = ({ dispatch }: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const {
    app: { notifications = [] },
  } = useContext(NeuronWalletContext)
  const [t] = useTranslation()
  const onDismiss = useCallback(() => {
    dispatch({
      type: AppActions.ClearNotifications,
      payload: null,
    })
  }, [dispatch])
  if (!notifications.length) return null

  const notification = notifications[0]

  return (
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
  )
}

NoticeContent.displayName = 'NoticeContent'

const Notification = (props: any) =>
  createPortal(<NoticeContent {...props} />, document.querySelector('#notification') as HTMLElement)

export default Notification
