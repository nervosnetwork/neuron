import { } from "@smooth-ui/core-sc";
import React from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import NetworkStatusContent from './Content';
import NetworkStatusModel from './Model';

const Status = styled.div`
    width: 8px;
    height: 8px;
    background: ${(props: {status: boolean}) => props.status ? 'green' : 'red'};
    border-radius: 50%;
    vertical-align: middle;
    transform: translate(-6px, 6px);
`;

const FlexDiv = styled.div`
    display: flex;
`;

class NetworkStatus extends React.Component {
    updateInterval?: NodeJS.Timeout = undefined;
    state: NetworkStatusModel

    constructor(props: any) {
        super(props);
        this.state = {
            node: "127.0.0.1:8114",
            status: false,
            date: ""
        };
    }

    componentDidMount() {
        this.updateInterval = setInterval(() => this.update(), 1000);
    }

    componentWillUnmount() {
        if (this.updateInterval != undefined) {
            clearInterval(this.updateInterval!);
        }
    }

    public render() {
        return (
            <FlexDiv>
                <Status status={this.state.status}/>
                <div onClick={() => this.displayContent()}>
                    Network status
                </div>
            </FlexDiv>
        );
    }

    update() {
        // getTipBlockNumber
        this.setState({
            tipBlockNumbe: this.state.tipBlockNumbe! + Math.floor(Math.random()*3),
            status: false,
            date: Date()
        });
        this.updateContent()
    }

    displayContent() {
        ReactDOM.render(this.getContentElement(), document.getElementById('MainContent'))
    }

    updateContent() {
        if (document.getElementById("NetworkStatusContent") != null) {
            ReactDOM.render(this.getContentElement(), document.getElementById('MainContent'));
        }
    }

    getContentElement() {
        return <NetworkStatusContent 
            model={this.state} 
            didUpdateNodeUrl={this.didUpdateNodeUrl.bind(this)}
        />
    }

    didUpdateNodeUrl(nodeUrl: string) {
        this.setState({
            node: nodeUrl
        })
        this.updateContent()
    }
}

export default NetworkStatus;
