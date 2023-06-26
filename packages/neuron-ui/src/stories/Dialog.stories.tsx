import React from 'react'
import { storiesOf } from '@storybook/react'
import Dialog from 'widgets/Dialog'

const stories = storiesOf('Dialog', module)

stories.add('Basic Dialog', () => (
  <Dialog show title="title" subTitle="subTitle" onConfirm={console.info} onCancel={() => {}}>
    是否开始下载
  </Dialog>
))

stories.add('Confirm Dialog', () => (
  <Dialog
    show
    title="dialog title"
    subTitle="dialog subTitle"
    showHeader={false}
    showCancel={false}
    onConfirm={console.info}
    onCancel={() => {}}
  >
    当前已是最新版本
  </Dialog>
))
