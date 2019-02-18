import React from 'react'

export default () => (
  <>
    <h1>You wallet seed is</h1>
    <textarea
      readOnly
      style={{
        width: '80vw',
        height: 200,
        borderRadius: '2px 2px',
        backgroundColor: 'lightgrey',
      }}
      defaultValue="mnemonic word list (12 words)"
    />
  </>
)
