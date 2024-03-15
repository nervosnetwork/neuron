import React from 'react'

const RingProgressBar = ({
  percents,
  color,
  backgroundColor = 'transparent',
  strokeWidth = '10px',
  size = '30px',
}: {
  percents: number
  color: React.CSSProperties['color']
  backgroundColor?: React.CSSProperties['backgroundColor']
  strokeWidth?: React.CSSProperties['strokeWidth']
  size?: React.CSSProperties['width']
}) => {
  // declare background as a string to avoid type error "Expression produces a union type that is too complex to represent."
  const background: string = `conic-gradient(${color} 0%, ${color} ${percents}%, ${backgroundColor} ${percents}%, ${backgroundColor} 100%)`
  return (
    <div
      style={{
        width: size,
        height: size,
        background,
        borderRadius: '50%',
        WebkitMask: `radial-gradient(transparent calc(${size}/2 - ${strokeWidth}), #000 calc(${size}/2 - ${strokeWidth}))`,
      }}
    />
  )
}

RingProgressBar.displayName = 'RingProgressBar'

export default RingProgressBar
