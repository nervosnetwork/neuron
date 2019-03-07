import React, { useContext } from 'react'
import ChainContext, { Cell } from '../../contexts/Chain'

const headers = ['capacity']

const Cells = () => {
  const chain = useContext(ChainContext)

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
