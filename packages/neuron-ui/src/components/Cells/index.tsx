import React, { useState, useContext, useEffect } from 'react'
import ChainContext, { Cell } from '../../contexts/Chain'
import ipc from '../../utils/ipc'

const headers = ['outPoint', 'reference', 'args', 'signedArgs', 'version']

const Cells = () => {
  const [typeHash] = useState('')
  const chain = useContext(ChainContext)
  useEffect(() => {
    ipc.getCellsByTypeHash(typeHash)
  }, [typeHash])
  return (
    <div>
      Cells
      <table>
        <thead>
          <tr>
            {headers.map(header => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chain.cells.map(cell => (
            <tr key={JSON.stringify(cell.outPoint)}>
              {headers.map(header => (
                <td key={header}>{JSON.stringify(cell[header as keyof Cell])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
export default Cells
