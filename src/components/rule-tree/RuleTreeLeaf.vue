<script setup lang="ts">
import { computed } from 'vue';
import type { FieldDef, RuleLeaf, Operator } from './types';
import { OPERATORS_BY_TYPE } from './types';

const props = defineProps<{
  leaf: RuleLeaf;
  fields: FieldDef[];
  depth: number;
}>();

const emit = defineEmits<{
  update: [leaf: RuleLeaf];
  remove: [];
}>();

const fieldDef = computed(() => props.fields.find((f) => f.key === props.leaf.field) ?? null);

const operators = computed(() => {
  if (!fieldDef.value) return [];
  return OPERATORS_BY_TYPE[fieldDef.value.type] ?? [];
});

const noValue = computed(() =>
  props.leaf.operator === 'is_null' || props.leaf.operator === 'is_not_null',
);

const isMultiValue = computed(() =>
  props.leaf.operator === 'in' || props.leaf.operator === 'not_in',
);

const isEnum = computed(() => fieldDef.value?.type === 'enum');
const isBoolean = computed(() => fieldDef.value?.type === 'boolean');

// enum with options → multi-select; string/number → comma-separated text input
const useEnumMultiSelect = computed(
  () => isEnum.value && isMultiValue.value && (fieldDef.value?.options?.length ?? 0) > 0,
);
const useTagInput = computed(
  () => isMultiValue.value && !useEnumMultiSelect.value,
);

function onFieldChange(key: string) {
  const newField = props.fields.find((f) => f.key === key);
  const ops = newField ? OPERATORS_BY_TYPE[newField.type] : [];
  const firstOp = ops[0]?.value ?? '=';
  emit('update', { field: key, operator: firstOp, value: undefined });
}

function onOperatorChange(op: string) {
  const noVal = op === 'is_null' || op === 'is_not_null';
  emit('update', {
    ...props.leaf,
    operator: op as Operator,
    value: noVal ? undefined : props.leaf.value,
  });
}

function onValueChange(val: unknown) {
  emit('update', { ...props.leaf, value: val });
}

function multiValueAsArray(): string[] {
  const v = props.leaf.value;
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string' && v) return v.split(',').map((s) => s.trim());
  return [];
}

function onMultiValueChange(e: Event) {
  const select = e.target as HTMLSelectElement;
  const selected = Array.from(select.selectedOptions).map((o) => o.value);
  emit('update', { ...props.leaf, value: selected });
}

function tagInputDisplay(): string {
  return multiValueAsArray().join(', ');
}

function onTagInputChange(e: Event) {
  const raw = (e.target as HTMLInputElement).value;
  const arr = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  emit('update', { ...props.leaf, value: arr });
}
</script>

<template>
  <div class="rtb-leaf">
    <!-- Field select -->
    <select class="rtb-select rtb-field-select" :value="leaf.field" @change="onFieldChange(($event.target as HTMLSelectElement).value)">
      <option value="" disabled>選擇欄位</option>
      <option v-for="f in fields" :key="f.key" :value="f.key">{{ f.label }}</option>
    </select>

    <!-- Operator select -->
    <select class="rtb-select rtb-op-select" :value="leaf.operator" @change="onOperatorChange(($event.target as HTMLSelectElement).value)">
      <option v-for="op in operators" :key="op.value" :value="op.value">{{ op.label }}</option>
    </select>

    <!-- Value input -->
    <template v-if="!noValue">
      <!-- Enum multi-select (in / not_in with predefined options) -->
      <select
        v-if="useEnumMultiSelect"
        class="rtb-select rtb-value-select"
        multiple
        :value="multiValueAsArray()"
        @change="onMultiValueChange"
      >
        <option v-for="opt in fieldDef?.options" :key="opt.value" :value="String(opt.value)">
          {{ opt.label }}
        </option>
      </select>

      <!-- Comma-separated tag input (in / not_in for string/number, or enum without options) -->
      <input
        v-else-if="useTagInput"
        class="rtb-input rtb-value-input rtb-tag-input"
        type="text"
        :value="tagInputDisplay()"
        @change="onTagInputChange"
        placeholder="D31, D21（逗號分隔）"
        title="多個值請用逗號分隔，例如：D31, D21"
      />

      <!-- Enum single select -->
      <select
        v-else-if="isEnum"
        class="rtb-select rtb-value-select"
        :value="String(leaf.value ?? '')"
        @change="onValueChange(($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled>選擇值</option>
        <option v-for="opt in fieldDef?.options" :key="opt.value" :value="String(opt.value)">
          {{ opt.label }}
        </option>
      </select>

      <!-- Boolean select -->
      <select
        v-else-if="isBoolean"
        class="rtb-select rtb-value-select"
        :value="String(leaf.value ?? 'true')"
        @change="onValueChange(($event.target as HTMLSelectElement).value === 'true')"
      >
        <option value="true">是</option>
        <option value="false">否</option>
      </select>

      <!-- Text / number input -->
      <input
        v-else
        class="rtb-input rtb-value-input"
        :type="fieldDef?.type === 'number' ? 'number' : 'text'"
        :value="String(leaf.value ?? '')"
        @input="onValueChange(fieldDef?.type === 'number' ? Number(($event.target as HTMLInputElement).value) : ($event.target as HTMLInputElement).value)"
        placeholder="值"
      />
    </template>

    <button class="rtb-remove-btn" type="button" @click="emit('remove')" title="刪除規則">✕</button>
  </div>
</template>
