import { describe, expect, it } from 'vitest'
import {
  getNodeAtPath,
  insertAtPath,
  isAncestorPath,
  removeAtPath,
} from '../src/components/rule-tree/ruleTreeUtils'
import type { RuleGroup, RuleLeaf } from '../src/components/rule-tree/types'

const leaf = (field: string): RuleLeaf => ({ field, operator: '=', value: field })

const tree = (): RuleGroup => ({
  op: 'AND',
  children: [
    leaf('a'),
    {
      op: 'OR',
      children: [leaf('b'), leaf('c')],
    },
  ],
})

describe('getNodeAtPath', () => {
  it('returns the root for an empty path', () => {
    const root = tree()
    expect(getNodeAtPath(root, [])).toBe(root)
  })

  it('resolves nested paths', () => {
    expect(getNodeAtPath(tree(), [1, 1])).toEqual(leaf('c'))
  })

  it('returns null for out-of-range or through-leaf paths', () => {
    expect(getNodeAtPath(tree(), [5])).toBeNull()
    expect(getNodeAtPath(tree(), [-1])).toBeNull()
    expect(getNodeAtPath(tree(), [0, 0])).toBeNull() // path through a leaf
  })
})

describe('removeAtPath', () => {
  it('removes a top-level child without mutating the original', () => {
    const root = tree()
    const result = removeAtPath(root, [0])

    expect(result.children).toHaveLength(1)
    expect(root.children).toHaveLength(2)
  })

  it('removes a nested child', () => {
    const result = removeAtPath(tree(), [1, 0])
    const group = result.children[1] as RuleGroup

    expect(group.children).toEqual([leaf('c')])
  })
})

describe('insertAtPath', () => {
  it('inserts at the root at the given index', () => {
    const result = insertAtPath(tree(), [], 1, leaf('x'))

    expect(result.children[1]).toEqual(leaf('x'))
    expect(result.children).toHaveLength(3)
  })

  it('inserts into a nested group', () => {
    const result = insertAtPath(tree(), [1], 2, leaf('x'))
    const group = result.children[1] as RuleGroup

    expect(group.children[2]).toEqual(leaf('x'))
  })
})

describe('isAncestorPath', () => {
  it('detects strict prefixes only', () => {
    expect(isAncestorPath([1], [1, 0])).toBe(true)
    expect(isAncestorPath([1, 0], [1, 0])).toBe(false) // same path is not an ancestor
    expect(isAncestorPath([1, 0], [1])).toBe(false)
    expect(isAncestorPath([0], [1, 0])).toBe(false)
  })
})
