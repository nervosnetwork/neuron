import React from 'react'
import { useDescription } from 'utils'
import { Edit } from 'widgets/Icons/icon'
import styles from './showOrEditDesc.module.scss'

interface ShowOrEditDescProps {
  onSubmitDescription: (param: { key: string; description: string }) => void
  onChangeEditStatus?: (isEditing: boolean) => void
  description?: string
  descKey: string
}

const ShowOrEditDesc = (props: ShowOrEditDescProps) => {
  const { onSubmitDescription, onChangeEditStatus, description, descKey } = props
  const { localDescription, onDescriptionPress, onDescriptionChange, onDescriptionFieldBlur, onDescriptionSelected } =
    useDescription(onSubmitDescription, onChangeEditStatus, 'textarea')
  const isSelected = localDescription.key === descKey
  return (
    <div className={styles.descTipRoot}>
      <div className={styles.autoHeight}>
        <textarea
          className={styles.descInput}
          data-is-selected={isSelected}
          data-description-key={descKey}
          value={isSelected ? localDescription.description : description}
          onChange={onDescriptionChange}
          onKeyDown={onDescriptionPress}
          onBlur={onDescriptionFieldBlur}
          onClick={e => e.stopPropagation()}
        />
        <Edit data-description-key={descKey} data-description-value={description} onClick={onDescriptionSelected} />
      </div>
      <div className={styles.hidden}>
        {isSelected ? localDescription.description : description}
        <Edit />
      </div>
    </div>
  )
}

ShowOrEditDesc.displayName = 'ShowOrEditDesc'
export default React.memo(ShowOrEditDesc)
