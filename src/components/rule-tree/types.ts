export type FieldType = 'string' | 'boolean' | 'number' | 'enum'

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  options?: Array<{ value: string | number; label: string }>
}

export type Operator =
  | '='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'in'
  | 'not_in'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_null'
  | 'is_not_null'

export interface RuleLeaf {
  field: string
  operator: Operator
  value?: unknown
}

export interface RuleGroup {
  op: 'AND' | 'OR'
  children: Array<RuleLeaf | RuleGroup>
}

export type RuleNode = RuleLeaf | RuleGroup

export function isGroup(node: RuleNode): node is RuleGroup {
  return 'op' in node
}

export const OPERATORS_BY_TYPE: Record<FieldType, Array<{ value: Operator; label: string }>> = {
  string: [
    { value: '=', label: '等於' },
    { value: '!=', label: '不等於' },
    { value: 'in', label: '包含於（IN）' },
    { value: 'not_in', label: '不包含於（NOT IN）' },
    { value: 'contains', label: '包含' },
    { value: 'starts_with', label: '開頭為' },
    { value: 'ends_with', label: '結尾為' },
    { value: 'is_null', label: '為空' },
    { value: 'is_not_null', label: '不為空' },
  ],
  boolean: [
    { value: '=', label: '等於' },
    { value: '!=', label: '不等於' },
  ],
  number: [
    { value: '=', label: '等於' },
    { value: '!=', label: '不等於' },
    { value: 'in', label: '包含於（IN）' },
    { value: 'not_in', label: '不包含於（NOT IN）' },
    { value: '>', label: '大於' },
    { value: '>=', label: '大於等於' },
    { value: '<', label: '小於' },
    { value: '<=', label: '小於等於' },
    { value: 'is_null', label: '為空' },
    { value: 'is_not_null', label: '不為空' },
  ],
  enum: [
    { value: 'in', label: '包含於' },
    { value: 'not_in', label: '不包含於' },
    { value: '=', label: '等於' },
    { value: '!=', label: '不等於' },
  ],
}
