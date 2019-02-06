import React, { useState, useContext, useEffect } from 'react'
import ChainContext from '../../contexts/chain'
import ipc from '../../utils/ipc'

const Cells = () => {
  const [typeHash] = useState('')
  const chain = useContext(ChainContext)
  useEffect(() => {
    ipc.getCellsByTypeHash(typeHash)
  }, [typeHash])
  return (
    <div>
      Cells
      {chain.cells.map(cell => (
        <button
          key={cell}
          onClick={() => ipc.getLiveCell({ hash: '1', index: 1 })}
          onKeyDown={() => ipc.getLiveCell({ hash: '1', index: 1 })}
          type="button"
        >
          {cell}
        </button>
      ))}
    </div>
  )
}
export default Cells
