import { createContext } from 'react'

export interface Modal {
  show: boolean
  content: React.ComponentType | null
  actions: {
    showModal: Function
    hideModal: Function
  }
}
export const initModal: Modal = {
  show: false,
  content: null,
  actions: {
    showModal: () => {},
    hideModal: () => {},
  },
}

export enum MODAL_ACTION_TYPES {
  SHOW,
  HIDE,
}

export const modalReducer = (state: Modal, action: { type: MODAL_ACTION_TYPES; value?: any }) => {
  switch (action.type) {
    case MODAL_ACTION_TYPES.SHOW: {
      return { ...state, show: true, content: action.value }
    }
    case MODAL_ACTION_TYPES.HIDE: {
      return { ...state, show: false, content: null }
    }
    default: {
      return state
    }
  }
}

const ModalContext = createContext<Modal>(initModal)
export default ModalContext
