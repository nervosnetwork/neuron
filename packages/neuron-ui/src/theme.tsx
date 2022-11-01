import React from 'react'
import { loadTheme } from 'office-ui-fabric-react'
import {
  Explorer,
  Search,
  FirstPage,
  PreviousPage,
  LastPage,
  NextPage,
  Matched,
  InfoCircleOutlined,
  Close,
  More,
  ArrowDown,
  Alert,
  Check,
  CopyOutlined,
  RightOutlined,
  Plus,
  ArrowLeftOutlined,
  Connected,
  PendingIcon,
  Keystore,
  ScanOutlined,
  UploadOutlined,
} from 'widgets/Icons/icon'

import { registerIcons } from 'utils/icons'

loadTheme({
  defaultFontStyle: { fontFamily: 'inherit' },
  fonts: {
    tiny: { fontSize: '11px' },
    xSmall: { fontSize: '12px', lineHeight: '12px' },
    small: { fontSize: '14px' },
    smallPlus: { fontSize: '15px' },
    medium: { fontSize: '16px' },
    mediumPlus: { fontSize: '17px' },
    large: { fontSize: '18px' },
    xLarge: { fontSize: '22px' },
    xxLarge: { fontSize: '28px' },
    superLarge: { fontSize: '42px' },
    mega: { fontSize: '72px' },
  },
})

registerIcons({
  icons: {
    info: <InfoCircleOutlined />,
    errorbadge: <Alert />,
    completed: <Check />,
    cancel: <Close />,
    MiniCopy: <CopyOutlined type="activity" />,
    Search: <Search />,
    FirstPage: <FirstPage type="activity" />,
    LastPage: <LastPage type="activity" />,
    PrevPage: <PreviousPage type="activity" />,
    NextPage: <NextPage type="activity" />,
    ArrowDown: <ArrowDown />,
    ChevronRightMed: <RightOutlined />,
    Scan: <ScanOutlined />,
    Import: <UploadOutlined />,
    Create: <Plus />,
    Clear: <Close style={{ height: '14px', width: '14px' }} />,
    Dismiss: <Close />,
    Leave: <ArrowLeftOutlined />,
    Connected: <Connected />,
    Disconnected: <Alert type="error" />,
    Updating: <PendingIcon style={{ animation: 'rotate360 3s linear infinite' }} />,
    More: <More />,
    Matched: <Matched />,
    Unmatched: <InfoCircleOutlined type="error" />,
    TransactionSuccess: <Check type="success" />,
    TransactionFailure: <Close type="error" />,
    TransactionPending: (
      <PendingIcon style={{ animation: 'rotate360 3s linear infinite', width: '14px', height: '14px' }} />
    ),
    Keystore: <Keystore />,
    Explorer: <Explorer />,
  },
})

export default undefined
