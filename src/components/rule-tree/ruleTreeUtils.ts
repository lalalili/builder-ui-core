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
