<script setup lang="ts">
import { provide, reactive, ref, watch } from 'vue';
import type { FieldDef, RuleGroup, RuleNode, RulePreviewResponse } from './rule-tree/types';
import { isGroup } from './rule-tree/types';
import { getNodeAtPath, insertAtPath, isAncestorPath, removeAtPath } from './rule-tree/ruleTreeUtils';
import RuleTreeGroup from './rule-tree/RuleTreeGroup.vue';

const props = defineProps<{
  modelValue?: RuleNode | null;
  availableFields: FieldDef[];
  previewEnabled?: boolean;
  previewResponse?: RulePreviewResponse | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [node: RuleNode];
  change: [node: RuleNode];
  preview: [detail: { path: number[] }];
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

// ── Drag-and-drop state ──────────────────────────────────────────────────────

const dragState = reactive<{ path: number[] | null }>({ path: null });

provide('rtbDragState', dragState);
provide('rtbStartDrag', (path: number[]) => {
  dragState.path = [...path];
});
provide('rtbEndDrag', () => {
  dragState.path = null;
});
provide('rtbMoveNode', (targetGroupPath: number[], insertIndex: number) => {
  const sourcePath = dragState.path;
  if (!sourcePath) return;

  // Prevent dropping a group into its own descendant
  if (isAncestorPath(sourcePath, targetGroupPath)) return;

  // Prevent no-op: same parent, same position
  const sourceParent = sourcePath.slice(0, -1);
  const sourceIndex = sourcePath[sourcePath.length - 1];
  const sameParent =
    sourceParent.length === targetGroupPath.length &&
    sourceParent.every((v, i) => targetGroupPath[i] === v);
  if (sameParent && (insertIndex === sourceIndex || insertIndex === sourceIndex + 1)) return;

  const node = getNodeAtPath(tree.value, sourcePath);
  if (!node) return;

  let newTree = removeAtPath(tree.value, sourcePath);

  // Removing source shifts later indices down by 1 within the same parent
  let adjustedIndex = insertIndex;
  if (sameParent && sourceIndex < insertIndex) {
    adjustedIndex = insertIndex - 1;
  }

  newTree = insertAtPath(newTree, targetGroupPath, adjustedIndex, node);
  onUpdate(newTree);
  dragState.path = null;
});
</script>

<template>
  <div class="rtb-root">
    <RuleTreeGroup
      :group="tree"
      :fields="availableFields"
      :depth="0"
      :can-remove="false"
      :group-path="[]"
      :ancestor-disabled="false"
      :preview-enabled="previewEnabled"
      :preview-response="previewResponse"
      @update="onUpdate"
      @preview="emit('preview', $event)"
    />
  </div>
</template>
