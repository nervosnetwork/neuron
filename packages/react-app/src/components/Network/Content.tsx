import React from 'react'
import styled from 'styled-components'
import { NetworkStatusModel } from './Model'
import { Button, Box, Grommet, TextInput, Text, Grid } from 'grommet'

const NetworkStatusContainer = styled.div`
  padding: 20px 0px;
`

enum Style {
  normal,
  edit
}

interface NetworkStatusContentProps {
  model: NetworkStatusModel
  didUpdateNodeUrl: (nodeUrl: string) => void
}

interface NetworkStatusContentState {
  style: Style
  inputErrorMessage?: string
}

const Theme = {
  button: {
    border: {
      radius: '6px',
      color: '#4cbc8e',
    },
    primary: {
      color: '#4cbc8e',
    },
    color: '#ffffff',
  },
}

class NetworkStatusContent extends React.Component<NetworkStatusContentProps> {
  state: NetworkStatusContentState = {
    style: Style.normal,
  }
  nodeInputRef = React.createRef()

  public render() {
    return (
      <NetworkStatusContainer id="NetworkStatusContent">
        <h3>Node:</h3>
        {
          this.state.style == Style.normal 
          ? <p>{this.props.model.node}</p> 
          : <div>
            <TextInput id='nodeTextInput' placeholder="Input node address"></TextInput>
            {this.state.inputErrorMessage 
            ? <Box margin={{
              top: '10px',
            }} gap='small' justify="center" height='40px' background={{
              color: 'neutral-4',
              opacity: 'weak',
            }} round='xsmall'>
              <Text margin='small' color='neutral-4'>{this.state.inputErrorMessage!}</Text>
            </Box>
            : <div />}
          </div>
        }
        <h3>Status:</h3>
        <p>
          {this.props.model.status}
        </p>
        <h3>Tip block number:</h3>
        <p>{this.props.model.tipBlockNumbe}</p>
        <h3>Update:</h3>
        <p>{this.props.model.date}</p>
        <Grommet theme={Theme}>
          {
            this.state.style == Style.normal
            ? <Button label="Switch node" primary onClick={this.onClickSwitchNode.bind(this)} />
            : <Grid fill="horizontal" gap="small" columns={{
              count: 2,
              size: 'xsmall',
            }}>
              <Button label="Save" onClick={this.onClickSave.bind(this)} primary />
              <Button label="Cancel" color="dark-5" onClick={this.onClickCancel.bind(this)} primary />
            </Grid>
          }
        </Grommet>
      </NetworkStatusContainer>
    )
  }

  onClickSwitchNode() {
    this.setState({
      style: Style.edit,
    })
  }

  onClickCancel() {
    this.setState({
      style: Style.normal,
      inputErrorMessage: undefined,
    })
  }

  onClickSave() {
    const nodeTextInput = document.getElementById('nodeTextInput') as HTMLInputElement
    const inputValue = nodeTextInput.value
    if (isURL(inputValue)) {
      this.props.didUpdateNodeUrl(inputValue)
      this.onClickCancel()
    } else {
      this.setState({
        inputErrorMessage: 'Please enter a valid node address.',
      })
    }
  }
}

function isURL(strUrl: string) {
  const strRegex = '^((https|http|ftp|rtsp|mms)?://)' +
  '?(([0-9a-z_!~*().&=+$%-]+: )?[0-9a-z_!~*().&=+$%-]+@)?' +
    '(([0-9]{1,3}.){3}[0-9]{1,3}' +
    '|' +
    '([0-9a-z_!~*()-]+.)*' +
    '([0-9a-z][0-9a-z-]{0,61})?[0-9a-z].' +
    '[a-z]{2,6})' +
    '(:[0-9]{1,5})?' +
    '((/?)|' +
    '(/[0-9a-z_!~*().;?:@&=+$,%#-]+)+/?)$'
  return RegExp(strRegex).test(strUrl)
}

export default NetworkStatusContent
