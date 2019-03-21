import React, { useState, useEffect } from 'react'
import styled from 'styled-components'

const ActionFlowStyle = styled.div`
  display: flex;
  flex-direction: column;
  padding-top: 100px;
  width: 100%;
  min-height: 500px;
  .actionFlowHeader {
    height: 80px;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    >div: nth-child(n + ${(props: { step: number }) => props.step + 1}) {
      color: lightgrey;
      > div:nth-child(1) {
        background-color: white;
      }
    }
  }
  .actionFlowBody {
    flex: 1;
    display: flex;
    justify-content: center;
    & > div {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }
  }
  .actionFlowFooter {
    border-top: 2px solid lightgrey;
    height: 60px;
    padding: 20px 20px 0 20px;
    button {
      height: 40px;
      width: 100px;
    }
  }
`

const ActionStep: React.SFC<{
  title: string
  onBeforeBack?: Function
  onBeforeNext?: Function
  onAfterNext?: Function
  onAfterBack?: Function
  children: any
}> = ({ children }: { children: any }) => <div>{children}</div>

ActionStep.defaultProps = {
  title: 'StepName',
}

ActionStep.displayName = 'ActionStep'

const ActionFlow = ({ children }: { children: Array<ActionStep> }) => {
  const [step, setStep] = useState(1)
  useEffect(() => {}, [step])

  return (
    <ActionFlowStyle step={step}>
      <div className="actionFlowBody">{children[step - 1]}</div>
      <div className="actionFlowFooter">
        <button
          style={{
            float: 'left',
          }}
          type="button"
          onKeyPress={() => {
            //   for users with physical disabilities who cannot use a mouse
          }}
          onClick={() => {
            const currentActionStep = children[step - 1].props
            if (currentActionStep.onBeforeBack) currentActionStep.onBeforeBack()
            if (step > 1) {
              setStep(step - 1)
            }
            if (currentActionStep.onAfterBack) currentActionStep.onAfterBack()
          }}
        >
          Back
        </button>
        <button
          style={{
            float: 'right',
          }}
          type="button"
          onKeyPress={() => {
            //   for users with physical disabilities who cannot use a mouse
          }}
          onClick={() => {
            const currentActionStep = children[step - 1].props
            if (currentActionStep.onBeforeNext) {
              const result: boolean = currentActionStep.onBeforeNext()
              if (result) {
                // enable button
              } else {
                // disable button
                return
              }
            }
            if (step < children.length) {
              setStep(step + 1)
            }
            if (currentActionStep.onAfterNext) currentActionStep.onAfterNext()
          }}
        >
          Next
        </button>
      </div>
    </ActionFlowStyle>
  )
}
export { ActionStep }
export default ActionFlow
