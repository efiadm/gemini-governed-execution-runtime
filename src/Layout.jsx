import React from "react";

export default function Layout({ children, currentPageName }) {
  return (
    <>
      <style>{`
        /* =========================
           LOTUS / GEMINI GOVERNED UI THEME (GLOBAL)
           Hunter Green + Dark Gray + Near-Black
           ========================= */

        :root{
          --bg-0: #070a0a;          /* page */
          --bg-1: #0b1010;          /* app shell */
          --bg-2: #0f1616;          /* primary surfaces */
          --bg-3: #141d1d;          /* elevated surfaces */
          --bg-4: #1a2525;          /* hover surfaces */
          --line-1: rgba(255,255,255,.08);
          --line-2: rgba(255,255,255,.12);

          --text-0: rgba(255,255,255,.92);
          --text-1: rgba(255,255,255,.78);
          --text-2: rgba(255,255,255,.62);
          --text-3: rgba(255,255,255,.45);

          --accent: #2d6b57;        /* hunter green */
          --accent-2: #3c8a73;      /* hover */
          --accent-soft: rgba(45,107,87,.20);

          --danger: #b84b4b;
          --warn: #b08a3a;
          --ok: #3f8f6f;

          --radius: 12px;
          --shadow: 0 10px 30px rgba(0,0,0,.45);
        }

        /* Base */
        html, body {
          background: var(--bg-0) !important;
          color: var(--text-0) !important;
        }

        * {
          border-color: var(--line-1);
        }

        a { color: rgba(120, 220, 190, .9); }
        a:hover { color: rgba(150, 255, 220, .95); }

        /* App shell / main containers */
        #root, .app, .App, .layout, .container, .page, main {
          background: var(--bg-1) !important;
          color: var(--text-0) !important;
        }

        /* Universal surface enforcement (prevents "white panels") */
        .card, .panel, .section, .box, .surface,
        [class*="Card"], [class*="Panel"], [class*="Section"], [class*="Container"],
        [class*="tab"], [class*="Tab"], [class*="Tabs"],
        [class*="summary"], [class*="Summary"],
        [class*="evidence"], [class*="Evidence"],
        [class*="performance"], [class*="Performance"],
        [class*="drift"], [class*="Drift"],
        [class*="artifact"], [class*="Artifact"],
        [class*="test"], [class*="Test"],
        [class*="table"], [class*="Table"],
        [class*="modal"], [class*="Modal"],
        [class*="dialog"], [class*="Dialog"] {
          background: var(--bg-2) !important;
          color: var(--text-0) !important;
          border-color: var(--line-1) !important;
        }

        /* Elevated panels */
        .card.elevated, .panel.elevated, .modal, .dialog,
        [class*="popover"], [class*="Popover"], [class*="dropdown"], [class*="Dropdown"] {
          background: var(--bg-3) !important;
          box-shadow: var(--shadow) !important;
          border: 1px solid var(--line-2) !important;
          border-radius: var(--radius) !important;
        }

        /* Headings / labels */
        h1,h2,h3,h4,h5,h6 { color: var(--text-0) !important; }
        label, .label, .field-label, [class*="Label"] { color: var(--text-1) !important; }
        small, .muted, .hint, [class*="muted"], [class*="Hint"] { color: var(--text-2) !important; }

        /* Inputs */
        input, textarea, select,
        .input, .textarea, .select,
        [class*="Input"], [class*="Textarea"], [class*="Select"] {
          background: var(--bg-3) !important;
          color: var(--text-0) !important;
          border: 1px solid var(--line-2) !important;
          border-radius: 10px !important;
          outline: none !important;
        }

        input::placeholder, textarea::placeholder {
          color: var(--text-3) !important;
        }

        /* Focus ring (subtle hunter green) */
        input:focus, textarea:focus, select:focus,
        .input:focus, .textarea:focus, .select:focus {
          border-color: rgba(60,138,115,.85) !important;
          box-shadow: 0 0 0 3px rgba(45,107,87,.28) !important;
        }

        /* Dropdown menus / options */
        option { background: var(--bg-3) !important; color: var(--text-0) !important; }
        .menu, .dropdown-menu, [role="listbox"], [role="menu"] {
          background: var(--bg-3) !important;
          color: var(--text-0) !important;
          border: 1px solid var(--line-2) !important;
        }

        /* Buttons */
        button, .btn, [class*="Button"]{
          background: var(--bg-3) !important;
          color: var(--text-0) !important;
          border: 1px solid var(--line-2) !important;
          border-radius: 10px !important;
        }

        button:hover, .btn:hover, [class*="Button"]:hover{
          background: var(--bg-4) !important;
        }

        button.primary, .btn-primary, [class*="primary"]{
          background: rgba(45,107,87,.55) !important;
          border-color: rgba(60,138,115,.75) !important;
        }
        button.primary:hover, .btn-primary:hover, [class*="primary"]:hover{
          background: rgba(60,138,115,.65) !important;
        }

        /* Tabs (top row + inner panel tabs) */
        .tabs, [role="tablist"], [class*="TabList"] {
          background: transparent !important;
        }

        [role="tab"], .tab, [class*="Tab"]{
          background: var(--bg-2) !important;
          color: var(--text-1) !important;
          border: 1px solid var(--line-1) !important;
          border-bottom: none !important;
          border-radius: 10px 10px 0 0 !important;
        }

        [role="tab"][aria-selected="true"], .tab.active, [class*="active"]{
          color: var(--text-0) !important;
          background: var(--bg-3) !important;
          border-color: rgba(60,138,115,.55) !important;
          box-shadow: inset 0 -2px 0 rgba(60,138,115,.8) !important;
        }

        /* Tab panel content area (fix "white interior sections") */
        [role="tabpanel"], .tab-panel, .tabpanel, [class*="TabPanel"]{
          background: var(--bg-2) !important;
          border: 1px solid var(--line-1) !important;
          border-radius: 0 12px 12px 12px !important;
          color: var(--text-0) !important;
        }

        /* Tables (fix "too white") */
        table, .table, [class*="Table"]{
          background: var(--bg-2) !important;
          color: var(--text-0) !important;
          border-collapse: collapse !important;
        }

        th, thead th{
          background: var(--bg-3) !important;
          color: var(--text-1) !important;
          border-bottom: 1px solid var(--line-2) !important;
        }

        td{
          background: var(--bg-2) !important;
          border-bottom: 1px solid var(--line-1) !important;
          color: var(--text-0) !important;
        }

        tr:hover td{
          background: rgba(255,255,255,.03) !important;
        }

        /* Badges / status pills */
        .badge, .pill, [class*="Badge"], [class*="Pill"]{
          background: rgba(255,255,255,.06) !important;
          color: var(--text-0) !important;
          border: 1px solid var(--line-1) !important;
          border-radius: 999px !important;
        }

        .badge.ok, .pill.ok, [class*="success"]{
          background: rgba(63,143,111,.18) !important;
          border-color: rgba(63,143,111,.45) !important;
        }

        .badge.warn, .pill.warn, [class*="warning"]{
          background: rgba(176,138,58,.18) !important;
          border-color: rgba(176,138,58,.45) !important;
        }

        .badge.danger, .pill.danger, [class*="error"], [class*="failed"]{
          background: rgba(184,75,75,.18) !important;
          border-color: rgba(184,75,75,.45) !important;
        }

        /* Code blocks / trace areas */
        pre, code, .code, [class*="Code"], [class*="Trace"]{
          background: #0a1111 !important;
          color: rgba(220,255,245,.9) !important;
          border: 1px solid rgba(120,220,190,.18) !important;
          border-radius: 10px !important;
        }

        /* Scrollbars (optional, subtle) */
        *::-webkit-scrollbar { height: 10px; width: 10px; }
        *::-webkit-scrollbar-thumb { background: rgba(255,255,255,.10); border-radius: 999px; }
        *::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.16); }
        *::-webkit-scrollbar-track { background: rgba(255,255,255,.03); }

        /* Override all white/light backgrounds */
        .bg-white { background: var(--bg-2) !important; }
        .bg-slate-50 { background: var(--bg-2) !important; }
        .bg-slate-100 { background: var(--bg-3) !important; }
        .bg-slate-200 { background: var(--bg-3) !important; }
        .bg-gray-50 { background: var(--bg-2) !important; }
        .bg-gray-100 { background: var(--bg-3) !important; }
        
        /* Text color overrides */
        .text-slate-900, .text-slate-800 { color: var(--text-0) !important; }
        .text-slate-700, .text-slate-600 { color: var(--text-1) !important; }
        .text-slate-500, .text-slate-400 { color: var(--text-2) !important; }
      `}</style>
      <div className="min-h-screen">
        {children}
      </div>
    </>
  );
}