<script setup lang="ts">
defineProps<{
  isPreviewMode?: boolean;
}>();
</script>

<template>
  <div class="sb-root" :class="{ 'is-preview': isPreviewMode }">
    <header class="sb-topbar">
      <slot name="topbar" />
    </header>
    <slot />
  </div>
</template>

<style>
@import '../styles/builder-tokens.css';

.sb-root {
  font-family: var(--font);
  color: var(--c-ink);
  font-size: 14px;
  line-height: 1.5;
  background: var(--c-bg);
  border-radius: var(--r3);
  border: 1px solid var(--c-line);
  overflow: hidden;
  height: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* ── Topbar ── */
.sb-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 52px;
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-line);
  flex-shrink: 0;
  z-index: 10;
}
.sb-topbar-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.sb-logo-spacer { width: 28px; height: 28px; flex-shrink: 0; }
.sb-title-input {
  background: transparent; border: none;
  font-size: 14px; font-weight: 500; font-family: var(--font);
  color: var(--c-ink);
  padding: 4px 8px; border-radius: var(--r1);
  min-width: 0; flex: 1; max-width: 300px;
}
.sb-title-input:hover { background: var(--c-s2); }
.sb-title-input:focus { outline: none; background: var(--c-s2); box-shadow: 0 0 0 1.5px var(--c-accent) inset; }
.sb-topbar-spacer { flex: 1; }
.sb-topbar-right { display: flex; align-items: center; gap: 8px; }

/* ── Save status ── */
.sb-save-status {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--c-ink3);
  padding: 4px 10px; border-radius: 999px;
  background: var(--c-s2);
  font-family: var(--mono);
}
.sb-save-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c-accent); }
.sb-save-status.saving .sb-save-dot { background: var(--c-warn); animation: sb-pulse 1.2s infinite; }
.sb-save-status.error .sb-save-dot { background: var(--c-danger); }
@keyframes sb-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

/* ── Common buttons ── */
.sb-icon-btn {
  width: 32px; height: 32px;
  display: inline-grid; place-items: center;
  border-radius: var(--r1);
  color: var(--c-ink2);
  background: none; border: none; cursor: pointer;
  transition: background 120ms;
}
.sb-icon-btn:hover, .sb-icon-btn.active { background: var(--c-s2); color: var(--c-ink); }

.sb-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: var(--r2);
  font-size: 13px; font-weight: 500; font-family: var(--font);
  border: 1px solid var(--c-line2);
  background: var(--c-surface); color: var(--c-ink);
  cursor: pointer; transition: all 120ms;
}
.sb-btn:hover { background: var(--c-s2); }
.sb-btn.primary { background: var(--c-ink); color: var(--c-surface); border-color: var(--c-ink); }
.sb-btn.primary:hover { background: var(--c-ink-h); }
.sb-btn.accent { background: var(--c-accent); color: white; border-color: var(--c-accent); }
.sb-btn.accent:hover { background: var(--c-accent-h); }
.sb-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Errors panel ── */
.sb-errors {
  padding: 10px 20px;
  background: var(--c-danger-bg);
  border-bottom: 2px solid var(--c-danger-line);
  font-size: 12.5px; color: var(--c-danger-ink);
  flex-shrink: 0;
}
.sb-errors-header { display: flex; align-items: center; gap: 7px; margin-bottom: 8px; }
.sb-errors-icon { font-size: 15px; line-height: 1; color: var(--c-danger); flex-shrink: 0; }
.sb-errors-title { font-weight: 700; font-size: 13px; color: var(--c-danger-ink); }
.sb-errors-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 4px; }
.sb-errors-item {
  display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;
  padding: 5px 8px; border-radius: 6px;
  border: 1px solid var(--c-danger-line);
  background: var(--c-surface);
}
.sb-errors-item.clickable { cursor: pointer; transition: background 120ms; }
.sb-errors-item.clickable:hover { background: var(--c-danger-bg); }
.sb-errors-location { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
.sb-errors-badge {
  display: inline-flex; align-items: center;
  padding: 1px 6px; border-radius: 4px;
  font-size: 11px; font-weight: 600;
  background: var(--c-danger-line); color: var(--c-danger-ink);
}
.sb-errors-badge.element { background: var(--c-danger-line); color: var(--c-danger-ink); }
.sb-errors-element-name {
  font-weight: 500; color: var(--c-danger-ink);
  max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.sb-errors-field {
  font-size: 11px; color: var(--c-danger-ink);
  padding: 1px 5px; background: var(--c-danger-bg); border-radius: 3px;
}
.sb-errors-messages { font-size: 12px; color: var(--c-danger-ink); flex: 1; }

/* ── Loading ── */
.sb-loading {
  display: grid; place-items: center;
  min-height: 56vh; font-size: 13px; color: var(--c-ink3);
  flex: 1;
}

/* ── Body layout ── */
.sb-body {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) 360px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.is-preview .sb-body { grid-template-columns: 1fr; }
@media (max-width: 1365px) {
  .sb-body { grid-template-columns: 56px minmax(0, 1fr) 320px; }
}

/* ── Left rail ── */
.sb-rail {
  background: var(--c-surface);
  border-right: 1px solid var(--c-line);
  display: flex; flex-direction: column; align-items: center;
  padding: 12px 0; gap: 2px;
  overflow: hidden;
}
.sb-rail-btn {
  width: 36px; height: 36px;
  display: grid; place-items: center;
  border-radius: var(--r2);
  color: var(--c-ink3);
  background: none; border: none; cursor: pointer;
  transition: all 120ms;
  position: relative;
}
.sb-rail-btn:hover { background: var(--c-s2); color: var(--c-ink); }
.sb-rail-btn.active { background: var(--c-ink); color: var(--c-surface); }
.sb-rail-tip {
  position: absolute; left: calc(100% + 10px); top: 50%; transform: translateY(-50%);
  background: var(--c-ink); color: var(--c-surface);
  font-size: 11px; padding: 4px 8px; border-radius: var(--r1);
  white-space: nowrap; opacity: 0; pointer-events: none;
  transition: opacity 120ms; z-index: 100;
}
.sb-rail-btn:hover .sb-rail-tip { opacity: 1; }
.sb-rail-divider { width: 24px; height: 1px; background: var(--c-line); margin: 6px 0; }

/* ── Canvas base ── */
.sb-canvas { background: var(--c-bg); overflow-y: auto; display: flex; flex-direction: column; }
.sb-canvas-inner { max-width: 780px; margin: 0 auto; padding: 16px 28px 100px; width: 100%; }
</style>
