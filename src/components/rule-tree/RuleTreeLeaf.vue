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
  return [];
}

function onMultiValueChange(e: Event) {
  const select = e.target as HTMLSelectElement;
  const selected = Array.from(select.selectedOptions).map((o) => o.value);
  emit('update', { ...props.leaf, value: selected });
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
      <!-- Enum multi-select (in / not_in) -->
      <select
        v-if="isEnum && isMultiValue"
        class="rtb-select rtb-value-select"
        multiple
        :value="multiValueAsArray()"
        @change="onMultiValueChange"
      >
        <option v-for="opt in fieldDef?.options" :key="opt.value" :value="String(opt.value)">
          {{ opt.label }}
        </option>
      </select>

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
