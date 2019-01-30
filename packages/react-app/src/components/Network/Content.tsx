import React from 'react'
import styled from 'styled-components'
import SwitchNode from './SwitchNode'
import NetworkStatusModel from './Model'

const NetworkStatusContainer = styled.div`
  padding: 20px 0px;
`

const P = styled.p``

interface NetworkStatusContentProps {
  model: NetworkStatusModel
  didUpdateNodeUrl: (nodeUrl: string) => void
}

class NetworkStatusContent extends React.Component<NetworkStatusContentProps> {
  public render() {
    return (
      <NetworkStatusContainer id="NetworkStatusContent">
        <h3>Node:</h3>
        <P>{this.props.model.node}</P>
        <h3>Status:</h3>
        <P>
          {this.props.model.status
            ? 'Connection succeeded'
            : 'Connection failed'}
        </P>
        <h3>Tip block number:</h3>
        <P>{this.props.model.tipBlockNumbe}</P>
        <h3>Update:</h3>
        <P>{this.props.model.date}</P>
        <SwitchNode didUpdateNodeUrl={this.props.didUpdateNodeUrl} />
      </NetworkStatusContainer>
    )
  }
}

export default NetworkStatusContent
