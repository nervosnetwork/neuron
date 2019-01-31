import React from 'react'
import {
  Toggler,
  Modal,
  ModalDialog,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Typography,
  Button,
  Input,
  Alert,
} from '@smooth-ui/core-sc'

interface SwitchNodeProps {
  didUpdateNodeUrl: (nodeUrl: string) => void
}

interface SwitchNodeState {
  inputErrorMessage?: string
}

class SwitchNode extends React.Component<SwitchNodeProps> {
  state: SwitchNodeState

  constructor(props: SwitchNodeProps) {
    super(props)
    this.state = {}
  }

  public render() {
    return (
      <Toggler>
        {({ toggled, onToggle }) => (
          <div>
            <Button variant="info" onClick={() => onToggle(true)}>
              Switch Node
            </Button>
            <Modal opened={toggled} onClose={() => onToggle(false)}>
              <ModalDialog>
                <ModalContent>
                  <ModalHeader>
                    <Typography variant="h5" m={0}>
                      Switch node
                    </Typography>
                  </ModalHeader>
                  <ModalBody>
                    {this.state.inputErrorMessage != undefined ? (
                      <Alert>{this.state.inputErrorMessage!}</Alert>
                    ) : (
                      <div />
                    )}
                    <Input
                      id="inputNode"
                      size="md"
                      width="95%"
                      placeholder="Input node url"
                    />
                  </ModalBody>
                  <ModalFooter>
                    <Button
                      variant="success"
                      onClick={() => this.onSaveNode(onToggle)}
                    >
                      Save
                    </Button>
                    <Button variant="secondary" onClick={() => onToggle(false)}>
                      Close
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </ModalDialog>
            </Modal>
          </div>
        )}
      </Toggler>
    )
  }

  onSaveNode(onToggle: (state?: boolean | undefined) => void) {
    const inputElement = document.getElementById(
      'inputNode',
    ) as HTMLInputElement
    const inputValue = inputElement.value
    if (IsURL(inputValue)) {
      onToggle(false)
      this.props.didUpdateNodeUrl(inputValue)
      this.setState({
        inputErrorMessage: undefined,
      })
    } else {
      this.setState({
        inputErrorMessage: 'Please enter a valid node address',
      })
    }
  }
}

function ssURL(strUrl: string) {
  const strRegex = '^((https|http|ftp|rtsp|mms)?://)'
  '?(([0-9a-z_!~*().&=+$%-]+: )?[0-9a-z_!~*().&=+$%-]+@)?' +
    '(([0-9]{1,3}.){3}[0-9]{1,3}' +
    '|' +
    '([0-9a-z_!~*()-]+.)*' +
    '([0-9a-z][0-9a-z-]{0,61})?[0-9a-z].' +
    '[a-z]{2,6})' +
    '(:[0-9]{1,5})?' +
    '((/?)|' +
    '(/[0-9a-z_!~*().;?:@&=+$,%#-]+)+/?)$'
  const re = new RegExp(strRegex)
  if (re.test(str_url)) {
    return true
  }
  return false
}

export default SwitchNode
