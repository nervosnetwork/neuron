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
  return (
    <div
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} 0%, ${color} ${percents}%, ${backgroundColor} ${percents}%, ${backgroundColor} 100%)`,
        borderRadius: '50%',
        WebkitMask: `radial-gradient(transparent calc(${size}/2 - ${strokeWidth}), #000 calc(${size}/2 - ${strokeWidth}))`,
      }}
    />
  )
}

RingProgressBar.displayName = 'RingProgressBar'

export default RingProgressBar
