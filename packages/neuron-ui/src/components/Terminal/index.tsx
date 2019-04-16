import React, { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'

import TerminalChannel from '../../services/Terminal'
import { useNeuronWallet } from '../../utils/hooks'

const prompt = '=>'
enum Hightlight {
  Normal = 'white',
  Dim = 'grey',
}

const Screen = styled.div`
  position: relative;
  width: 100%;
  height: 90%;
  background: #000;
`

const Print = styled.pre`
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 15px;
`

const CodeBlock = styled.span<{ type: Hightlight }>`
  color: ${({ type }) => type};
`

const CommandLine = styled.div`
  position: absolute;
  display: flex;
  bottom: 0;
  width: 100%;
  background: #ccc;
  padding-left: 15px;
`

const InputLine = styled.input.attrs({
  autoFocus: true,
})`
  flex: 1;
  background: transparent;
  outline: none;
  border: none;
`
interface TerminalState {
  history: string[]
  print: string[]
  command: string
}
const initTerminal = {
  history: [],
  print: [
    'welcome to neuron terminal',
    'you can enter command like',
    '- notification title body',
    '- printCommand sentense to show',
    '- clear',
  ],
  command: '',
}

const Terminal = () => {
  const [terminal, setTerminal] = useState<TerminalState>(initTerminal)
  const { wallet } = useNeuronWallet()

  useEffect(() => {
    TerminalChannel.on((_e: Event, args: ChannelResponse<{ msg: string }>) => {
      if (args.status) {
        setTerminal((t: TerminalState) => {
          return {
            ...t,
            print: [...t.print, `-> ${args.result.msg}`],
          }
        })
      } else {
        setTerminal((t: TerminalState) => {
          return {
            ...t,
            print: [...t.print, `-> warning: ${args.msg}`],
          }
        })
      }
    })

    return () => {
      TerminalChannel.removeSelf()
    }
  }, [])

  const onKeyUp = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      switch (terminal.command) {
        case 'clear': {
          setTerminal(initTerminal)
          return
        }
        default: {
          setTerminal(({ history, print, command }) => ({
            history: [...history, command],
            print: [...print, `=> ${command}`],
            command: '',
          }))
          TerminalChannel.send(terminal.command)
        }
      }
    }
  }

  const handleInput = useCallback((e: any) => {
    const { value } = e.currentTarget
    setTerminal((t: TerminalState) => ({
      ...t,
      command: value,
    }))
  }, [])

  return (
    <Screen>
      <Print>
        {terminal.print.map(code => (
          <CodeBlock key={code} type={+code.startsWith('->') ? Hightlight.Dim : Hightlight.Normal}>
            {code}
          </CodeBlock>
        ))}
      </Print>
      <CommandLine>
        <div>{`${wallet.name} ${prompt}`}</div>
        <InputLine value={terminal.command} onChange={handleInput} onKeyUp={onKeyUp} />
      </CommandLine>
    </Screen>
  )
}

Terminal.displayName = 'Terminal'

export default Terminal
