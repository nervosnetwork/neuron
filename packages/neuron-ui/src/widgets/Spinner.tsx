import React, { CSSProperties } from 'react'
import { ReactComponent as Loading } from 'widgets/Icons/Loading.svg'

export enum SpinnerSize {
  /**
   * 12px Spinner diameter
   */
  xSmall = 0,
  /**
   * 16px Spinner diameter
   */
  small = 1,
  /**
   * 20px Spinner diameter
   */
  medium = 2,
  /**
   * 28px Spinner diameter
   */
  large = 3,
}
const fontSizes = [12, 16, 20, 28]
const rotate360Animation: CSSProperties = {
  animation: '4s linear rotate360 infinite forwards',
}

export default ({
  className = '',
  style = {},
  label,
  labelPosition,
  size,
}: {
  className?: string
  style?: CSSProperties
  label?: React.ReactNode
  labelPosition?: 'left' | 'right'
  size?: SpinnerSize
}) => {
  const localStyles: CSSProperties = {
    ...style,
    fontSize: size !== undefined ? fontSizes[size] : '14px',
  }
  if (label) {
    return (
      <div style={localStyles} className={className}>
        {labelPosition !== 'right' ? label : null}
        <Loading style={rotate360Animation} />
        {labelPosition === 'right' ? label : null}
      </div>
    )
  }
  return <Loading style={{ ...rotate360Animation, ...localStyles }} className={className} />
}
