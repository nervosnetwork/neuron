import React, { useRef, useContext } from 'react'
import styled from 'styled-components'
import SettingsContext from '../../contexts/Settings'

const InputDiv = styled.div`
  input {
    height: 30px;
    line-height: 30px;
    font-size: 16px;
    margin-top: 10px;
    width: 400px;
  }
`
export default () => {
  const settingsContext = useContext(SettingsContext)
  const refP1: { current: HTMLInputElement | null } = useRef(null)
  const refP2: { current: HTMLInputElement | null } = useRef(null)
  const refName: { current: HTMLInputElement | null } = useRef(null)

  const checking = () => {
    if (!refP1.current || !refP2.current || !refName.current) return
    if (refP1.current.value.length < 2 || refP2.current.value.length < 2) {
      settingsContext.passwordValid = false
      return
    }
    if (refP1.current.value !== refP2.current.value) {
      settingsContext.passwordValid = false
      return
    }
    settingsContext.name = refName.current.value
    if (!refName.current.value) {
      settingsContext.passwordValid = false
      return
    }
    settingsContext.passwordValid = true
  }
  return (
    <>
      <h1>set a strong password for your wallet</h1>
      <InputDiv>
        <div>password</div>
        <input
          type="password"
          ref={refP1}
          placeholder="ge 2"
          onChange={() => {
            checking()
          }}
        />
      </InputDiv>
      <InputDiv>
        <div>confirm password</div>
        <input
          type="password"
          ref={refP2}
          placeholder="ge 2"
          onChange={() => {
            checking()
          }}
        />
      </InputDiv>
      <InputDiv>
        <div>wallet name</div>
        <input
          type="text"
          ref={refName}
          placeholder="autoValue"
          onChange={() => {
            checking()
          }}
        />
      </InputDiv>
    </>
  )
}
