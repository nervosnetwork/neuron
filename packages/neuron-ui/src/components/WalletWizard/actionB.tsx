import React, { useContext } from 'react'
import SettingsContext from '../../contexts/Settings'

export default () => {
  const settingsContext = useContext(SettingsContext)
  return (
    <>
      <h1>Input your seed</h1>
      <textarea
        style={{
          width: '80vw',
          height: 200,
          borderRadius: '2px 2px',
          backgroundColor: 'white',
        }}
        defaultValue={settingsContext.seeds}
        onChange={e => {
          settingsContext.seeds = e.target.value
          if (settingsContext.seeds === '1') {
            settingsContext.seedsValid = true
          }
        }}
      />
    </>
  )
}
