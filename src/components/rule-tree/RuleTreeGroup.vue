<script setup lang="ts">
import type { FieldDef, RuleGroup, RuleLeaf, RuleNode } from './types';
import { isGroup } from './types';
import RuleTreeLeaf from './RuleTreeLeaf.vue';

const props = defineProps<{
  group: RuleGroup;
  fields: FieldDef[];
  depth: number;
  canRemove?: boolean;
}>();

const emit = defineEmits<{
  update: [group: RuleGroup];
  remove: [];
}>();

function toggleOp() {
  emit('update', { ...props.group, op: props.group.op === 'AND' ? 'OR' : 'AND' });
}

function updateChild(index: number, node: RuleNode) {
  const children = [...props.group.children];
  children[index] = node;
  emit('update', { ...props.group, children });
}

function removeChild(index: number) {
  const children = props.group.children.filter((_, i) => i !== index);
  emit('update', { ...props.group, children });
}

function addRule() {
  const defaultField = props.fields[0];
  if (!defaultField) return;
  const leaf: RuleLeaf = { field: defaultField.key, operator: '=', value: '' };
  emit('update', { ...props.group, children: [...props.group.children, leaf] });
}

function addGroup() {
  const childGroup: RuleGroup = { op: 'AND', children: [] };
  emit('update', { ...props.group, children: [...props.group.children, childGroup] });
}
</script>

<template>
  <div class="rtb-group" :class="`rtb-depth-${depth}`">
    <!-- Group header -->
    <div class="rtb-group-header">
      <button
        class="rtb-op-toggle"
        :class="group.op === 'OR' ? 'is-or' : 'is-and'"
        type="button"
        @click="toggleOp"
      >{{ group.op }}</button>

      <span class="rtb-group-label">條件群組</span>

      <div class="rtb-group-actions">
        <button class="rtb-add-btn" type="button" @click="addRule">+ 規則</button>
        <button class="rtb-add-btn" type="button" @click="addGroup">+ 群組</button>
        <button v-if="canRemove" class="rtb-remove-btn" type="button" @click="emit('remove')">✕</button>
      </div>
    </div>

    <!-- Children -->
    <div class="rtb-group-body" v-if="group.children.length > 0">
      <template v-for="(child, i) in group.children" :key="i">
        <RuleTreeGroup
          v-if="isGroup(child)"
          :group="child as RuleGroup"
          :fields="fields"
          :depth="depth + 1"
          :can-remove="true"
          @update="updateChild(i, $event)"
          @remove="removeChild(i)"
        />
        <RuleTreeLeaf
          v-else
          :leaf="child as RuleLeaf"
          :fields="fields"
          :depth="depth"
          @update="updateChild(i, $event)"
          @remove="removeChild(i)"
        />
      </template>
    </div>
    <div class="rtb-group-empty" v-else>
      <span>無條件（點擊「+ 規則」新增）</span>
    </div>
  </div>
</template>
