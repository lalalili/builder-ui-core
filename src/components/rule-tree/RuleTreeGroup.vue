<script setup lang="ts">
import { inject, reactive, ref } from 'vue';
import type { FieldDef, RuleGroup, RuleLeaf, RuleNode } from './types';
import { isGroup } from './types';
import RuleTreeLeaf from './RuleTreeLeaf.vue';

const props = defineProps<{
  group: RuleGroup;
  fields: FieldDef[];
  depth: number;
  canRemove?: boolean;
  groupPath: number[];
}>();

const emit = defineEmits<{
  update: [group: RuleGroup];
  remove: [];
}>();

// ── Drag-and-drop inject ─────────────────────────────────────────────────────
const dragState = inject<{ path: number[] | null }>('rtbDragState', reactive({ path: null }));
const startDrag = inject<(path: number[]) => void>('rtbStartDrag', () => {});
const endDrag = inject<() => void>('rtbEndDrag', () => {});
const moveNode = inject<(groupPath: number[], insertIndex: number) => void>('rtbMoveNode', () => {});

const activeDropZone = ref<number | null>(null);

function onDragOverZone(e: DragEvent, insertIndex: number) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  activeDropZone.value = insertIndex;
}

function onDragLeaveZone() {
  activeDropZone.value = null;
}

function onDropZone(e: DragEvent, insertIndex: number) {
  e.preventDefault();
  activeDropZone.value = null;
  moveNode(props.groupPath, insertIndex);
}

// Group header itself is draggable (drag the whole sub-group)
function onGroupDragStart(e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  }
  startDrag(props.groupPath);
}

function onGroupDragEnd() {
  endDrag();
}

// ── Group logic ──────────────────────────────────────────────────────────────
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

function isDraggingThis(): boolean {
  const p = dragState.path;
  return (
    p !== null &&
    p.length === props.groupPath.length &&
    p.every((v, i) => props.groupPath[i] === v)
  );
}
</script>

<template>
  <div class="rtb-group" :class="[`rtb-depth-${depth}`, { 'is-dragging': isDraggingThis() }]">
    <!-- Group header -->
    <div class="rtb-group-header">
      <span
        v-if="canRemove"
        class="rtb-drag-handle"
        title="拖曳移動群組"
        draggable="true"
        @dragstart="onGroupDragStart"
        @dragend="onGroupDragEnd"
      >⠿</span>

      <button
        class="rtb-op-toggle"
        :class="group.op === 'OR' ? 'is-or' : 'is-and'"
        type="button"
        :title="group.op === 'OR' ? '此群組內各條件「任一成立」即符合，點擊切換為 AND' : '此群組內各條件「全部成立」才符合，點擊切換為 OR'"
        @click="toggleOp"
      >{{ group.op }}</button>

      <span class="rtb-group-label">條件群組</span>
      <span class="rtb-op-hint">（{{ group.op === 'OR' ? '群組內任一條件成立' : '群組內所有條件都成立' }}）</span>

      <div class="rtb-group-actions">
        <button
          class="rtb-add-btn"
          type="button"
          :disabled="fields.length === 0"
          :title="fields.length === 0 ? '請先選擇名單，才能新增規則' : undefined"
          @click="addRule"
        >+ 規則</button>
        <button
          class="rtb-add-btn"
          type="button"
          :disabled="fields.length === 0"
          :title="fields.length === 0 ? '請先選擇名單，才能新增群組' : undefined"
          @click="addGroup"
        >+ 群組</button>
        <button v-if="canRemove" class="rtb-remove-btn" type="button" @click="emit('remove')">✕</button>
      </div>
    </div>

    <!-- Children with drop zones between each -->
    <div class="rtb-group-body" v-if="group.children.length > 0">
      <!-- Drop zone before first child -->
      <div
        class="rtb-drop-zone"
        :class="{ 'is-active': activeDropZone === 0 }"
        @dragover="onDragOverZone($event, 0)"
        @dragleave="onDragLeaveZone"
        @drop="onDropZone($event, 0)"
      ></div>

      <template v-for="(child, i) in group.children" :key="i">
        <RuleTreeGroup
          v-if="isGroup(child)"
          :group="child as RuleGroup"
          :fields="fields"
          :depth="depth + 1"
          :can-remove="true"
          :group-path="[...groupPath, i]"
          @update="updateChild(i, $event)"
          @remove="removeChild(i)"
        />
        <RuleTreeLeaf
          v-else
          :leaf="child as RuleLeaf"
          :fields="fields"
          :depth="depth"
          :leaf-path="[...groupPath, i]"
          @update="updateChild(i, $event)"
          @remove="removeChild(i)"
        />

        <!-- Drop zone after each child -->
        <div
          class="rtb-drop-zone"
          :class="{ 'is-active': activeDropZone === i + 1 }"
          @dragover="onDragOverZone($event, i + 1)"
          @dragleave="onDragLeaveZone"
          @drop="onDropZone($event, i + 1)"
        ></div>
      </template>
    </div>

    <!-- Empty group: acts as a drop zone when no children -->
    <div
      v-else
      class="rtb-group-empty"
      :class="{ 'is-drop-target': activeDropZone === 0 }"
      @dragover.prevent="onDragOverZone($event, 0)"
      @dragleave="onDragLeaveZone"
      @drop="onDropZone($event, 0)"
    >
      <span>無條件（點擊「+ 規則」新增）</span>
    </div>
  </div>
</template>
