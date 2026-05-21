import { defineCustomElement, ref, computed, watch, h } from 'vue';
import RuleTreeBuilderVue from '../RuleTreeBuilder.vue';
import type { FieldDef, RuleNode, RuleGroup } from './types';
import { isGroup } from './types';
import ruleTreeStyles from './rule-tree-builder.css?inline';

const RuleTreeBuilderElement = defineCustomElement({
  styles: [ruleTreeStyles],

  props: {
    availableFields: { type: String, default: '[]' },
    value: { type: String, default: '' },
  },

  emits: ['change'],

  setup(props: { availableFields: string; value: string }, { emit }: { emit: (e: 'change', v: string) => void }) {
    const fields = computed<FieldDef[]>(() => {
      try { return JSON.parse(props.availableFields) ?? []; } catch { return []; }
    });

    const tree = ref<RuleGroup>(parseTree(props.value));

    watch(() => props.value, (v) => {
      const parsed = parseTree(v);
      if (JSON.stringify(parsed) !== JSON.stringify(tree.value)) {
        tree.value = parsed;
      }
    });

    function parseTree(v: string): RuleGroup {
      try {
        const node = v ? JSON.parse(v) : null;
        return node && isGroup(node) ? (node as RuleGroup) : { op: 'AND', children: [] };
      } catch {
        return { op: 'AND', children: [] };
      }
    }

    function onChange(node: RuleNode) {
      if (isGroup(node)) tree.value = node as RuleGroup;
      emit('change', JSON.stringify(node));
    }

    return () =>
      h(RuleTreeBuilderVue, {
        modelValue: tree.value,
        availableFields: fields.value,
        'onUpdate:modelValue': onChange,
        onChange,
      });
  },
});

export function registerRuleTreeBuilder(): void {
  if (!customElements.get('rule-tree-builder')) {
    customElements.define('rule-tree-builder', RuleTreeBuilderElement);
  }
}
