<script setup lang="ts">
import { ref, watch } from 'vue';
import type { FieldDef, RuleGroup, RuleNode } from './rule-tree/types';
import { isGroup } from './rule-tree/types';
import RuleTreeGroup from './rule-tree/RuleTreeGroup.vue';

const props = defineProps<{
  modelValue?: RuleNode | null;
  availableFields: FieldDef[];
}>();

const emit = defineEmits<{
  'update:modelValue': [node: RuleNode];
  change: [node: RuleNode];
}>();

function makeRoot(): RuleGroup {
  return { op: 'AND', children: [] };
}

const tree = ref<RuleGroup>(
  props.modelValue && isGroup(props.modelValue)
    ? (props.modelValue as RuleGroup)
    : makeRoot(),
);

watch(
  () => props.modelValue,
  (val) => {
    if (val && isGroup(val)) tree.value = val as RuleGroup;
  },
);

function onUpdate(updated: RuleGroup) {
  tree.value = updated;
  emit('update:modelValue', updated);
  emit('change', updated);
}
</script>

<template>
  <div class="rtb-root">
    <RuleTreeGroup
      :group="tree"
      :fields="availableFields"
      :depth="0"
      :can-remove="false"
      @update="onUpdate"
    />
  </div>
</template>

<style>
.rtb-root {
  font-family: "Helvetica Neue", Helvetica, "Noto Sans TC", "PingFang TC", sans-serif;
  font-size: 13px;
  color: oklch(22% 0.008 80);
  --c-line: oklch(91% 0.005 95);
  --c-s2: oklch(97% 0.004 95);
  --c-accent: oklch(54% 0.16 268);
  --c-accent2: oklch(95% 0.04 268);
  --c-danger: oklch(58% 0.18 27);
  --c-and: oklch(54% 0.16 268);
  --c-or: oklch(60% 0.16 150);
}

/* ── Group ── */
.rtb-group {
  border: 1px solid var(--c-line);
  border-radius: 8px;
  background: white;
  overflow: hidden;
}
.rtb-depth-0 { border-color: oklch(85% 0.008 80); }
.rtb-depth-1 { border-color: oklch(88% 0.008 80); }
.rtb-depth-2 { border-color: oklch(91% 0.005 95); }

.rtb-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: oklch(97.5% 0.003 95);
  border-bottom: 1px solid var(--c-line);
}
.rtb-group-label { font-size: 12px; color: oklch(55% 0.006 80); flex: 1; }

.rtb-op-toggle {
  padding: 3px 10px;
  border-radius: 4px;
  border: 1.5px solid;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all 120ms;
}
.rtb-op-toggle.is-and {
  background: var(--c-accent2);
  border-color: var(--c-accent);
  color: var(--c-accent);
}
.rtb-op-toggle.is-or {
  background: oklch(94% 0.05 150);
  border-color: var(--c-or);
  color: var(--c-or);
}

.rtb-group-actions { display: flex; gap: 6px; }

.rtb-group-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 8px;
  background: oklch(98% 0.003 95);
}

.rtb-group-empty {
  padding: 12px 16px;
  font-size: 12px;
  color: oklch(65% 0.005 80);
  font-style: italic;
}

/* Nested group inside body */
.rtb-group-body > .rtb-group {
  margin-left: 16px;
}

/* ── Leaf ── */
.rtb-leaf {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: white;
  border: 1px solid var(--c-line);
  border-radius: 6px;
}

/* ── Controls ── */
.rtb-select, .rtb-input {
  height: 30px;
  border: 1px solid oklch(88% 0.005 80);
  border-radius: 5px;
  padding: 0 8px;
  font-size: 12.5px;
  background: white;
  color: oklch(22% 0.008 80);
  outline: none;
  transition: border-color 120ms;
}
.rtb-select:focus, .rtb-input:focus { border-color: var(--c-accent); }

.rtb-field-select { min-width: 110px; }
.rtb-op-select { min-width: 80px; }
.rtb-value-select { min-width: 110px; }
.rtb-value-input { flex: 1; min-width: 80px; }

.rtb-value-select[multiple] { height: auto; min-height: 60px; padding: 4px; }

.rtb-add-btn {
  padding: 3px 10px;
  border: 1px solid oklch(88% 0.005 80);
  border-radius: 5px;
  background: white;
  font-size: 12px;
  cursor: pointer;
  color: oklch(40% 0.008 80);
  transition: all 120ms;
}
.rtb-add-btn:hover {
  background: var(--c-accent2);
  border-color: var(--c-accent);
  color: var(--c-accent);
}

.rtb-remove-btn {
  width: 24px; height: 24px;
  border: none;
  background: none;
  color: oklch(65% 0.005 80);
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
  display: grid;
  place-items: center;
  transition: all 120ms;
  flex-shrink: 0;
  margin-left: auto;
}
.rtb-remove-btn:hover {
  background: oklch(94% 0.05 27);
  color: var(--c-danger);
}
</style>
