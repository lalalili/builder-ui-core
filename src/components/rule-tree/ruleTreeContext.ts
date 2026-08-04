import type { InjectionKey } from 'vue'
import type { RuleNode } from './types'

export interface RuleTreeDragState {
  path: number[] | null
}

export interface RuleTreeKeyboardMoveState {
  path: number[] | null
}

export type RuleTreePathAction = (path: number[]) => void
export type RuleTreeKeyboardMoveAction = (direction: -1 | 1) => void
export type RuleTreeNodeKey = (node: RuleNode) => string
export type RuleTreeMoveNodeAction = (groupPath: number[], insertIndex: number) => void

export const rtbDragStateKey: InjectionKey<RuleTreeDragState> = Symbol('rtbDragState')
export const rtbStartDragKey: InjectionKey<RuleTreePathAction> = Symbol('rtbStartDrag')
export const rtbEndDragKey: InjectionKey<() => void> = Symbol('rtbEndDrag')
export const rtbMoveNodeKey: InjectionKey<RuleTreeMoveNodeAction> = Symbol('rtbMoveNode')
export const rtbKeyboardMoveStateKey: InjectionKey<RuleTreeKeyboardMoveState> = Symbol('rtbKeyboardMoveState')
export const rtbStartKeyboardMoveKey: InjectionKey<RuleTreePathAction> = Symbol('rtbStartKeyboardMove')
export const rtbMoveKeyboardNodeKey: InjectionKey<RuleTreeKeyboardMoveAction> = Symbol('rtbMoveKeyboardNode')
export const rtbDropKeyboardMoveKey: InjectionKey<() => void> = Symbol('rtbDropKeyboardMove')
export const rtbCancelKeyboardMoveKey: InjectionKey<() => void> = Symbol('rtbCancelKeyboardMove')
export const rtbNodeKeyKey: InjectionKey<RuleTreeNodeKey> = Symbol('rtbNodeKey')
