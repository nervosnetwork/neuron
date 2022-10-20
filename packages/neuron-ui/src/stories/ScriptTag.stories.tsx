import React from 'react'
import { storiesOf } from '@storybook/react'
import { withRouter } from 'storybook-addon-react-router-v6'
import { action } from '@storybook/addon-actions'
import ScriptTag from 'components/ScriptTag'

const stories = storiesOf('Script Tag', module).addDecorator(withRouter())

const scripts: Record<string, CKBComponents.Script> = {
  secp256k1_blake160: {
    codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
    hashType: 'type',
    args: '0x2228dae340f587647362d31e3f04d7a51f8168dc',
  },
  anyone_can_pay: {
    codeHash: '0x3419a1c09eb2567f6552ee7a8ecffd64155cffe0f1796e6e61ec088d740c1356',
    hashType: 'type',
    args: '0xb2b8101595fe0ddeb9f4e1acead6107119497fe6',
  },
  multisig: {
    codeHash: '0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8',
    hashType: 'type',
    args: '0x3c12e68513a8731692607387fcfcfce4275b6ffa',
  },
  locktime: {
    codeHash: '0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8',
    hashType: 'type',
    args: '0x822f72beaac01b956d4ce5ac00a5806a8be356100310008700f00020',
  },
}

Object.entries(scripts).forEach(([title, script]) => {
  stories.add(title, () => <ScriptTag isMainnet={false} script={script} onClick={action('click')} />)
})
