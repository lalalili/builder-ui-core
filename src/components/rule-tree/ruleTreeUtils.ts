import type { RuleGroup, RuleNode } from './types'
import { isGroup } from './types'

export function getNodeAtPath(root: RuleGroup, path: number[]): RuleNode | null {
  if (path.length === 0) return root
  let current: RuleNode = root
  for (const idx of path) {
    if (!isGroup(current)) return null
    const group = current as RuleGroup
    if (idx < 0 || idx >= group.children.length) return null
    current = group.children[idx]
  }
  return current
}

export function removeAtPath(root: RuleGroup, path: number[]): RuleGroup {
  if (path.length === 1) {
    return { ...root, children: root.children.filter((_, i) => i !== path[0]) }
  }
  return {
    ...root,
    children: root.children.map((child, i) => {
      if (i !== path[0] || !isGroup(child)) return child
      return removeAtPath(child as RuleGroup, path.slice(1))
    }),
  }
}

export function insertAtPath(
  root: RuleGroup,
  groupPath: number[],
  insertIndex: number,
  node: RuleNode,
): RuleGroup {
  if (groupPath.length === 0) {
    const children = [...root.children]
    children.splice(insertIndex, 0, node)
    return { ...root, children }
  }
  return {
    ...root,
    children: root.children.map((child, i) => {
      if (i !== groupPath[0] || !isGroup(child)) return child
      return insertAtPath(child as RuleGroup, groupPath.slice(1), insertIndex, node)
    }),
  }
}

/** Returns true if `ancestor` is a strict prefix of `descendant`. */
export function isAncestorPath(ancestor: number[], descendant: number[]): boolean {
  if (ancestor.length >= descendant.length) return false
  return ancestor.every((v, i) => descendant[i] === v)
}

export interface MoveNodeWithinParentResult {
  tree: RuleGroup
  path: number[]
  position: number
  total: number
}

export function moveNodeWithinParent(
  root: RuleGroup,
  sourcePath: number[],
  direction: -1 | 1,
): MoveNodeWithinParentResult | null {
  if (sourcePath.length === 0) return null

  const sourceIndex = sourcePath[sourcePath.length - 1]
  if (sourceIndex === undefined) return null
  const parentPath = sourcePath.slice(0, -1)
  const parent = getNodeAtPath(root, parentPath)

  if (!parent || !isGroup(parent)) return null

  const targetIndex = sourceIndex + direction
  if (targetIndex < 0 || targetIndex >= parent.children.length) return null

  const node = parent.children[sourceIndex]
  let tree = removeAtPath(root, sourcePath)
  tree = insertAtPath(tree, parentPath, targetIndex, node)

  return {
    tree,
    path: [...parentPath, targetIndex],
    position: targetIndex + 1,
    total: parent.children.length,
  }
}
