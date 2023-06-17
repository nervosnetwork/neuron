import React from 'react'
import { ComponentStory } from '@storybook/react'
import CompensationProgressBar from 'components/CompensationProgressBar'

export default {
  title: 'Compensation Progress Bar',
  component: CompensationProgressBar,
}

const Template: ComponentStory<typeof CompensationProgressBar> = (args: any) => (
  <CompensationProgressBar style={{ width: '300px' }} {...args} />
)

export const Normal = Template.bind({})
Normal.args = { currentEpochValue: 0, endEpochValue: 180 }

export const Suggested = Template.bind({})
Suggested.args = { currentEpochValue: 139, endEpochValue: 180 }

export const Requested = Template.bind({})
Requested.args = { currentEpochValue: 175, endEpochValue: 180 }

export const End = Template.bind({})
End.args = { currentEpochValue: 180, endEpochValue: 180 }

export const WithdrawnInPeriod = Template.bind({})
WithdrawnInPeriod.args = { currentEpochValue: 160, endEpochValue: 180, withdrawEpochValue: 30 }

export const WithdrawnOuterPeriod = Template.bind({})
WithdrawnOuterPeriod.args = { currentEpochValue: 181, endEpochValue: 180, withdrawEpochValue: 30 }

export const CurrentLessThanEnd = Template.bind({})
CurrentLessThanEnd.args = { currentEpochValue: 181, endEpochValue: 180 }

export const CurrentLessThanBegin = Template.bind({})
CurrentLessThanBegin.args = { currentEpochValue: 0, endEpochValue: 181 }

export const Pending = Template.bind({})
Pending.args = { pending: true, currentEpochValue: 0, endEpochValue: 0 }
