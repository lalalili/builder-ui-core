import { computed, inject } from 'vue'
import {
  rtbCancelKeyboardMoveKey,
  rtbDropKeyboardMoveKey,
  rtbKeyboardMoveStateKey,
  rtbMoveKeyboardNodeKey,
  rtbStartKeyboardMoveKey,
} from './ruleTreeContext'

function pathsMatch(left: number[] | null, right: number[]): boolean {
  return left !== null && left.length === right.length && left.every((value, index) => value === right[index])
}

export function useRuleTreeKeyboardMove(getPath: () => number[]) {
  const keyboardMoveState = inject(rtbKeyboardMoveStateKey, { path: null })
  const startKeyboardMove = inject(rtbStartKeyboardMoveKey, () => {})
  const moveKeyboardNode = inject(rtbMoveKeyboardNodeKey, () => {})
  const dropKeyboardMove = inject(rtbDropKeyboardMoveKey, () => {})
  const cancelKeyboardMove = inject(rtbCancelKeyboardMoveKey, () => {})

  const isMoving = computed(() => pathsMatch(keyboardMoveState.path, getPath()))

  function onKeydown(event: KeyboardEvent): void {
    const isSpace = event.key === ' ' || event.code === 'Space'
    const isActivationKey = event.key === 'Enter' || isSpace

    if (isActivationKey) {
      event.preventDefault()
      event.stopPropagation()

      if (isMoving.value) {
        dropKeyboardMove()
      } else {
        startKeyboardMove(getPath())
      }

      return
    }

    if (event.key === 'Escape' && isMoving.value) {
      event.preventDefault()
      event.stopPropagation()
      cancelKeyboardMove()
      return
    }

    if (isMoving.value && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault()
      event.stopPropagation()
      moveKeyboardNode(event.key === 'ArrowUp' ? -1 : 1)
    }
  }

  return { isMoving, onKeydown }
}
