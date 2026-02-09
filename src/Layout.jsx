import React from "react";

export default function Layout({ children, currentPageName }) {
  return (
    <>
      <style>{`
/* =========================================================
   LOTUS DARK (Hunter Green) — GLOBAL OVERRIDES
   ========================================================= */

:root {
  --bg-0: #070a09;
  --bg-1: #0b0f0d;
  --bg-2: #0f1512;
  --bg-3: #131b16;
  --panel: #0c110f;

  --text-0: #e7f0ea;
  --text-1: #c7d6cc;
  --text-2: #8ea597;

  --border-0: rgba(231, 240, 234, 0.10);
  --border-1: rgba(231, 240, 234, 0.16);

  --shadow-0: 0 10px 30px rgba(0,0,0,0.45);
  --shadow-1: 0 1px 0 rgba(255,255,255,0.04) inset;

  --green-0: #1a6f4b;
  --green-1: #1f8a5c;
  --green-2: #2db37a;
  --green-glow: rgba(45, 179, 122, 0.25);

  --warn-0: #f6c453;
  --bad-0: #f26b6b;
  --good-0: #3bd18a;

  --radius-0: 14px;
  --radius-1: 18px;

  --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --sans: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";
}

html, body {
  background: var(--bg-0) !important;
  color: var(--text-0) !important;
  font-family: var(--sans) !important;
}

:where(body) * {
  scrollbar-color: rgba(231,240,234,0.25) transparent;
}

:where(main, .app, .App, #root, .page, .container, .content, .layout, .shell) {
  background: var(--bg-0) !important;
  color: var(--text-0) !important;
}

:where(
  .panel, .card, .section, .box, .widget, .tile,
  .tab-panel, .tabpanel, .tabs-panel, .tabContent, .tab-content,
  .summary, .summary-panel, .summary-card,
  .under-the-hood, .evidence, .performance, .drift, .artifacts, .tests
) {
  background: linear-gradient(180deg, var(--bg-2), var(--bg-1)) !important;
  color: var(--text-0) !important;
  border: 1px solid var(--border-0) !important;
  border-radius: var(--radius-1) !important;
  box-shadow: var(--shadow-1), var(--shadow-0) !important;
}

:where(.panel .panel, .card .card, .tab-content .panel, .tab-panel .card, .summary .card) {
  background: linear-gradient(180deg, var(--bg-3), var(--bg-2)) !important;
  border-color: var(--border-0) !important;
}

h1, h2, h3, h4, h5, h6 {
  color: var(--text-0) !important;
  letter-spacing: 0.2px;
}
label, .label, .muted, .helptext, .hint, small {
  color: var(--text-2) !important;
}

button, .btn, .button {
  background: var(--bg-2) !important;
  color: var(--text-0) !important;
  border: 1px solid var(--border-0) !important;
  border-radius: 12px !important;
  padding: 10px 14px !important;
  box-shadow: var(--shadow-1) !important;
}
button:hover, .btn:hover, .button:hover {
  background: var(--bg-3) !important;
  border-color: var(--border-1) !important;
}
button:active, .btn:active, .button:active {
  transform: translateY(1px);
}

:where(.primary, .btn-primary, .button-primary, .run, .cta) {
  background: linear-gradient(180deg, rgba(31,138,92,0.95), rgba(26,111,75,0.95)) !important;
  border-color: rgba(45,179,122,0.35) !important;
  box-shadow: 0 10px 26px rgba(0,0,0,0.45), 0 0 0 2px rgba(45,179,122,0.10) inset !important;
}
:where(.primary, .btn-primary, .button-primary, .run, .cta):hover {
  box-shadow: 0 10px 26px rgba(0,0,0,0.45), 0 0 0 2px rgba(45,179,122,0.16) inset, 0 0 0 6px rgba(45,179,122,0.10) !important;
}

input, textarea, select {
  background: rgba(11, 15, 13, 0.95) !important;
  color: var(--text-0) !important;
  border: 1px solid rgba(231,240,234,0.18) !important;
  border-radius: 12px !important;
  outline: none !important;
}
textarea { font-family: var(--sans) !important; }

input::placeholder, textarea::placeholder {
  color: rgba(142,165,151,0.75) !important;
}

input:focus, textarea:focus, select:focus {
  border-color: rgba(45,179,122,0.55) !important;
  box-shadow: 0 0 0 4px rgba(45,179,122,0.18) !important;
}

:where(.dropdown-menu, .menu, .select-menu, .Select-menu, .Select__menu, .MuiMenu-paper, .MuiPopover-paper) {
  background: var(--bg-2) !important;
  color: var(--text-0) !important;
  border: 1px solid var(--border-0) !important;
  border-radius: 14px !important;
  box-shadow: var(--shadow-0) !important;
}
:where(.dropdown-item, .menu-item, .select-item, .Select__option, .MuiMenuItem-root) {
  color: var(--text-0) !important;
}
:where(.dropdown-item:hover, .menu-item:hover, .select-item:hover, .Select__option--is-focused, .MuiMenuItem-root:hover) {
  background: rgba(45,179,122,0.14) !important;
}

:where(.preset, .preset-select, .prompt-preset, .PresetSelect, .select-control, .Select__control, .MuiSelect-select) {
  background: linear-gradient(180deg, var(--bg-3), var(--bg-2)) !important;
  border: 1px solid rgba(231,240,234,0.22) !important;
  box-shadow: 0 0 0 1px rgba(45,179,122,0.10) inset, var(--shadow-1) !important;
}

:where(.tabs, .Tabs, .tabbar, .tab-bar, .nav-tabs, .tablist, .tab-list) {
  background: transparent !important;
}

:where(.tab, .Tab, .tab-item, .nav-link) {
  color: var(--text-1) !important;
  background: transparent !important;
  border: 1px solid transparent !important;
  border-radius: 999px !important;
  padding: 8px 12px !important;
}

:where(.tab.active, .Tab--active, .tab-item.active, .nav-link.active, [aria-selected="true"]) {
  color: var(--text-0) !important;
  background: rgba(45,179,122,0.12) !important;
  border-color: rgba(45,179,122,0.25) !important;
  box-shadow: 0 0 0 4px rgba(45,179,122,0.08) !important;
}

:where(.tab-panel, .tabpanel, .tab-content, .TabPanel, .tabs-content, [role="tabpanel"]) {
  background: linear-gradient(180deg, var(--bg-2), var(--bg-1)) !important;
  color: var(--text-0) !important;
  border: 1px solid var(--border-0) !important;
  border-radius: var(--radius-1) !important;
}

table {
  width: 100%;
  border-collapse: separate !important;
  border-spacing: 0 !important;
  background: var(--bg-1) !important;
  color: var(--text-0) !important;
  border: 1px solid var(--border-0) !important;
  border-radius: var(--radius-1) !important;
  overflow: hidden !important;
}
thead th {
  background: linear-gradient(180deg, rgba(19,27,22,0.95), rgba(15,21,18,0.95)) !important;
  color: var(--text-1) !important;
  border-bottom: 1px solid var(--border-0) !important;
}
tbody td {
  border-bottom: 1px solid rgba(231,240,234,0.06) !important;
  color: var(--text-0) !important;
}
tbody tr:hover td {
  background: rgba(45,179,122,0.06) !important;
}

:where(.badge, .pill, .tag, .chip) {
  background: rgba(231,240,234,0.08) !important;
  color: var(--text-0) !important;
  border: 1px solid rgba(231,240,234,0.14) !important;
  border-radius: 999px !important;
  padding: 4px 10px !important;
  font-size: 12px !important;
}
:where(.badge.good, .pill.good, .status-pass, .passed) {
  background: rgba(59,209,138,0.14) !important;
  border-color: rgba(59,209,138,0.28) !important;
}
:where(.badge.warn, .pill.warn, .status-warn) {
  background: rgba(246,196,83,0.14) !important;
  border-color: rgba(246,196,83,0.28) !important;
}
:where(.badge.bad, .pill.bad, .status-fail, .failed) {
  background: rgba(242,107,107,0.14) !important;
  border-color: rgba(242,107,107,0.28) !important;
}

pre, code, .code, .json, .mono {
  font-family: var(--mono) !important;
}
pre, .code-block, .json-block {
  background: rgba(7,10,9,0.9) !important;
  color: var(--text-0) !important;
  border: 1px solid rgba(231,240,234,0.10) !important;
  border-radius: 12px !important;
  padding: 12px !important;
  overflow: auto !important;
}

:where(.modal, .dialog, .popover, .sheet, .drawer, [role="dialog"]) {
  background: linear-gradient(180deg, var(--bg-3), var(--bg-2)) !important;
  color: var(--text-0) !important;
  border: 1px solid var(--border-0) !important;
  border-radius: var(--radius-1) !important;
  box-shadow: var(--shadow-0) !important;
}

*::-webkit-scrollbar { width: 10px; height: 10px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb {
  background: rgba(231,240,234,0.18);
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: content-box;
}
*::-webkit-scrollbar-thumb:hover { background: rgba(231,240,234,0.28); }

:where(
  .panel, .card, .section, .tab-panel, .tab-content, [role="tabpanel"],
  .summary, .under-the-hood, .evidence, .performance, .drift, .artifacts, .tests
) :where(div, section, article) {
  background-color: transparent;
}
      `}</style>
      <div className="min-h-screen">
        {children}
      </div>
    </>
  );
}