import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RuleTreeBuilder from '../src/components/RuleTreeBuilder.vue';
import type { FieldDef, RuleGroup, RuleLeaf } from '../src/components/rule-tree/types';
import { isGroup } from '../src/components/rule-tree/types';

const fields: FieldDef[] = [
  { key: 'has_app', label: 'App 用戶', type: 'boolean' },
  { key: 'email', label: 'Email', type: 'string' },
  { key: 'score', label: '分數', type: 'number' },
  { key: 'status', label: '狀態', type: 'enum', options: [{ value: 'active', label: '啟用' }, { value: 'inactive', label: '停用' }] },
  { key: 'purchase_at', label: '購買日期', type: 'date' },
];

const emptyTree: RuleGroup = { op: 'AND', children: [] };

describe('RuleTreeBuilder', () => {
  it('renders with empty tree', () => {
    const wrapper = mount(RuleTreeBuilder, {
      props: { modelValue: emptyTree, availableFields: fields },
    });
    expect(wrapper.find('.rtb-root').exists()).toBe(true);
    expect(wrapper.find('.rtb-group').exists()).toBe(true);
    expect(wrapper.find('.rtb-group-empty').exists()).toBe(true);
  });

  it('renders existing leaf rule', () => {
    const tree: RuleGroup = {
      op: 'AND',
      children: [{ field: 'has_app', operator: '=', value: true }],
    };
    const wrapper = mount(RuleTreeBuilder, {
      props: { modelValue: tree, availableFields: fields },
    });
    expect(wrapper.find('.rtb-leaf').exists()).toBe(true);
    expect(wrapper.find('.rtb-group-empty').exists()).toBe(false);
  });

  it('emits change when AND/OR toggled', async () => {
    const wrapper = mount(RuleTreeBuilder, {
      props: { modelValue: emptyTree, availableFields: fields },
    });
    await wrapper.find('.rtb-op-toggle').trigger('click');
    const changeEvents = wrapper.emitted('change') as Array<[RuleGroup]>;
    expect(changeEvents).toBeTruthy();
    expect(changeEvents[0][0].op).toBe('OR');
  });

  it('adds rule when + 規則 clicked', async () => {
    const wrapper = mount(RuleTreeBuilder, {
      props: { modelValue: emptyTree, availableFields: fields },
    });
    await wrapper.findAll('.rtb-add-btn')[0].trigger('click');
    const emitted = wrapper.emitted('change') as Array<[RuleGroup]>;
    expect(emitted).toBeTruthy();
    const newTree = emitted[0][0];
    expect(newTree.children).toHaveLength(1);
    expect(isGroup(newTree.children[0])).toBe(false);
  });

  it('adds nested group when + 群組 clicked', async () => {
    const wrapper = mount(RuleTreeBuilder, {
      props: { modelValue: emptyTree, availableFields: fields },
    });
    await wrapper.findAll('.rtb-add-btn')[1].trigger('click');
    const emitted = wrapper.emitted('change') as Array<[RuleGroup]>;
    expect(emitted).toBeTruthy();
    const newTree = emitted[0][0];
    expect(newTree.children).toHaveLength(1);
    expect(isGroup(newTree.children[0])).toBe(true);
    expect((newTree.children[0] as RuleGroup).op).toBe('AND');
  });

  it('removes leaf rule', async () => {
    const tree: RuleGroup = {
      op: 'AND',
      children: [
        { field: 'has_app', operator: '=', value: true },
        { field: 'email', operator: 'contains', value: '@' },
      ],
    };
    const wrapper = mount(RuleTreeBuilder, {
      props: { modelValue: tree, availableFields: fields },
    });
    await wrapper.findAll('.rtb-leaf .rtb-remove-btn')[0].trigger('click');
    const emitted = wrapper.emitted('change') as Array<[RuleGroup]>;
    expect(emitted[0][0].children).toHaveLength(1);
    expect((emitted[0][0].children[0] as RuleLeaf).field).toBe('email');
  });

  it('updates operator based on field type change', async () => {
    const tree: RuleGroup = {
      op: 'AND',
      children: [{ field: 'has_app', operator: '=', value: true }],
    };
    const wrapper = mount(RuleTreeBuilder, {
      props: { modelValue: tree, availableFields: fields },
    });
    const fieldSelect = wrapper.find('.rtb-field-select') as any;
    await fieldSelect.setValue('status');
    const emitted = wrapper.emitted('change') as Array<[RuleGroup]>;
    const updated = emitted[0][0].children[0] as RuleLeaf;
    expect(updated.field).toBe('status');
    expect(updated.operator).toBe('in');
  });

  it('no value input shown for is_null operator', async () => {
    const tree: RuleGroup = {
      op: 'AND',
      children: [{ field: 'email', operator: 'is_null' }],
    };
    const wrapper = mount(RuleTreeBuilder, {
      props: { modelValue: tree, availableFields: fields },
    });
    expect(wrapper.find('.rtb-value-input').exists()).toBe(false);
    expect(wrapper.find('.rtb-value-select').exists()).toBe(false);
  });

  it('renders date input for date field type', () => {
    const tree: RuleGroup = {
      op: 'AND',
      children: [{ field: 'purchase_at', operator: '>', value: '2024-01-01' }],
    };
    const wrapper = mount(RuleTreeBuilder, {
      props: { modelValue: tree, availableFields: fields },
    });
    expect(wrapper.find('input[type="date"]').exists()).toBe(true);
    expect((wrapper.find('input[type="date"]').element as HTMLInputElement).value).toBe('2024-01-01');
  });

  it('date operators include 晚於 and 早於', () => {
    const tree: RuleGroup = {
      op: 'AND',
      children: [{ field: 'purchase_at', operator: '>', value: '2024-01-01' }],
    };
    const wrapper = mount(RuleTreeBuilder, {
      props: { modelValue: tree, availableFields: fields },
    });
    const opOptions = wrapper.find('.rtb-op-select').findAll('option');
    const labels = opOptions.map((o) => o.text());
    expect(labels).toContain('晚於');
    expect(labels).toContain('早於');
    expect(labels).toContain('等於');
    expect(labels).toContain('為空');
  });

  it('emits update:modelValue on change', async () => {
    const wrapper = mount(RuleTreeBuilder, {
      props: { modelValue: emptyTree, availableFields: fields },
    });
    await wrapper.find('.rtb-op-toggle').trigger('click');
    const mvEvents = wrapper.emitted('update:modelValue') as Array<[RuleGroup]>;
    expect(mvEvents).toBeTruthy();
    expect(mvEvents[0][0].op).toBe('OR');
  });
});
