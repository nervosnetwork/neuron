import React from 'react'
import { loadTheme, getTheme } from 'office-ui-fabric-react'

import {
  AddCircle as AddIcon,
  Alert as AlertIcon,
  Checkmark as SuccessIcon,
  Close as DismissIcon,
  Copy as CopyIcon,
  Down as ArrowDownIcon,
  FormClose as ClearIcon,
  FormAdd as CreateIcon,
  FormPreviousLink as LeaveIcon,
  FormUp as ExpandIcon,
  FormUpload as ImportIcon,
  LinkBottom as LinkBottomIcon,
  LinkDown as LinkDownIcon,
  LinkTop as LinkTopIcon,
  LinkUp as LinkUpIcon,
  Nodes as ConnectedIcon,
  Scan as ScanIcon,
  Search as SearchIcon,
  SubtractCircle as RemoveIcon,
  Update as UpdateIcon,
} from 'grommet-icons'

import { registerIcons } from 'utils/icons'

loadTheme({
  fonts: {
    tiny: { fontSize: '11px' },
    xSmall: { fontSize: '12px' },
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

const theme = getTheme()
const { semanticColors } = theme

registerIcons({
  icons: {
    errorbadge: <AlertIcon size="16px" />,
    completed: <SuccessIcon size="16px" />,
    MiniCopy: <CopyIcon size="small" />,
    Search: <SearchIcon size="16px" color={semanticColors.menuIcon} />,
    FirstPage: <LinkTopIcon size="16px" color={semanticColors.menuIcon} style={{ transform: 'rotate(-90deg)' }} />,
    LastPage: <LinkBottomIcon size="16px" color={semanticColors.menuIcon} style={{ transform: 'rotate(-90deg)' }} />,
    PrevPage: <LinkUpIcon size="16px" color={semanticColors.menuIcon} style={{ transform: 'rotate(-90deg)' }} />,
    NextPage: <LinkDownIcon size="16px" color={semanticColors.menuIcon} style={{ transform: 'rotate(-90deg)' }} />,
    ArrowDown: <ArrowDownIcon size="small" />,
    ChevronRightMed: <ExpandIcon size="16px" style={{ transform: 'rotate(90deg) translate(2px, 0px)' }} />,
    Scan: <ScanIcon />,
    Import: <ImportIcon color="white" />,
    Create: <CreateIcon />,
    Add: <AddIcon />,
    Remove: <RemoveIcon color="red" />,
    Copy: <CopyIcon />,
    Clear: <ClearIcon size="16px" />,
    Dismiss: <DismissIcon size="16px" />,
    Leave: <LeaveIcon />,
    Connected: <ConnectedIcon size="small" color="green" />,
    Disconnected: <AlertIcon size="small" color="red" />,
    Updating: <UpdateIcon size="16px" style={{ animation: 'rotate360 3s linear infinite' }} />,
  },
})

export default undefined
