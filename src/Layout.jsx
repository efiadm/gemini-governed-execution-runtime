import React from "react";

export default function Layout({ children, currentPageName }) {
  return (
    <>
      <style>{`
        :root {
          --app-bg: #0f1113;
          --panel-bg: #1a1f22;
          --panel-secondary: #20262a;
          --panel-border: #2a3238;
          --output-bg: #1e2226;
          --input-bg: #1e2428;
          --input-border: #2a3238;
          --input-focus: #1f6f5b;
          --text-primary: #e6e8eb;
          --text-secondary: #9aa1a9;
          --text-muted: #6f7679;
          --accent-primary: #1f6f5b;
          --accent-secondary: #8b7abf;
          --error-red: #c85a54;
        }
        
        body {
          background-color: var(--app-bg);
          color: var(--text-primary);
        }
        
        /* Override shadcn defaults - panels and cards */
        .bg-white { background-color: var(--panel-bg) !important; }
        .bg-slate-50 { background-color: var(--panel-bg) !important; }
        .bg-slate-100 { background-color: var(--panel-secondary) !important; }
        .bg-gray-50 { background-color: var(--panel-bg) !important; }
        .bg-background { background-color: var(--app-bg) !important; }
        
        /* Text colors */
        .text-slate-900 { color: var(--text-primary) !important; }
        .text-slate-800 { color: var(--text-primary) !important; }
        .text-slate-700 { color: var(--text-secondary) !important; }
        .text-slate-600 { color: var(--text-muted) !important; }
        .text-slate-500 { color: var(--text-muted) !important; }
        .text-slate-400 { color: var(--text-muted) !important; }
        
        /* Borders */
        .border-slate-200 { border-color: var(--panel-border) !important; }
        .border-slate-300 { border-color: var(--panel-border) !important; }
        .border { border-color: var(--panel-border) !important; }
        
        /* Success/green states */
        .bg-green-50 { background-color: rgba(31, 111, 91, 0.1) !important; }
        .bg-green-100 { background-color: rgba(31, 111, 91, 0.15) !important; }
        .bg-green-600 { background-color: var(--accent-primary) !important; }
        .text-green-600 { color: var(--accent-primary) !important; }
        .text-green-700 { color: var(--accent-primary) !important; }
        .text-green-800 { color: var(--accent-primary) !important; }
        .border-green-200 { border-color: var(--accent-primary) !important; }
        
        /* Blue/teal states */
        .bg-blue-50 { background-color: rgba(46, 139, 117, 0.08) !important; }
        .bg-blue-100 { background-color: rgba(46, 139, 117, 0.12) !important; }
        .text-blue-600 { color: var(--accent-secondary) !important; }
        .text-blue-700 { color: var(--accent-secondary) !important; }
        .border-blue-200 { border-color: var(--panel-border) !important; }
        
        /* Error/red states */
        .bg-red-50 { background-color: rgba(200, 90, 84, 0.1) !important; }
        .bg-red-100 { background-color: rgba(200, 90, 84, 0.12) !important; }
        .bg-red-600 { background-color: var(--error-red) !important; }
        .text-red-600 { color: var(--error-red) !important; }
        .text-red-700 { color: var(--error-red) !important; }
        .border-red-200 { border-color: var(--error-red) !important; }
        
        /* Orange/warning states */
        .bg-orange-50 { background-color: rgba(200, 120, 84, 0.08) !important; }
        .text-orange-600 { color: #c0866d !important; }
        .text-orange-700 { color: #c0866d !important; }
        
        /* Violet/purple accents */
        .bg-violet-50 { background-color: rgba(31, 111, 91, 0.05) !important; }
        .bg-indigo-50 { background-color: rgba(31, 111, 91, 0.05) !important; }
        .bg-amber-50 { background-color: rgba(200, 120, 84, 0.06) !important; }
        .border-violet-600 { border-color: var(--accent-primary) !important; }
        .bg-violet-600 { background-color: var(--accent-secondary) !important; }
        .text-violet-600 { color: var(--accent-secondary) !important; }
        .text-violet-700 { color: var(--accent-secondary) !important; }
        
        /* Shadows - subtle only */
        .shadow { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3) !important; }
        .shadow-lg { box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.3) !important; }
        .shadow-sm { box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.2) !important; }
        
        /* Gradients - minimal */
        .bg-gradient-to-br { background: var(--app-bg) !important; }
        .bg-gradient-to-r { background: rgba(31, 111, 91, 0.08) !important; }
        
        /* Input fields */
        input, textarea, select, [role="combobox"] {
          background-color: var(--input-bg) !important;
          border-color: var(--input-border) !important;
          color: var(--text-primary) !important;
        }
        
        input:focus, textarea:focus, select:focus, [role="combobox"]:focus {
          border-color: var(--input-focus) !important;
          box-shadow: none !important;
          outline: none !important;
        }
        
        /* Buttons */
        button { color: var(--text-primary); }
        button:disabled { opacity: 0.3; }
        
        /* Output panel - slightly lighter */
        .bg-slate-900 { background-color: var(--output-bg) !important; }
        
        /* Additional surface variants */
        .bg-slate-800 { background-color: var(--panel-secondary) !important; }
        
        /* Table rows - alternating shades for readability */
        tbody tr { background-color: var(--panel-bg); }
        tbody tr:nth-child(even) { background-color: rgba(0, 0, 0, 0.2); }
        
        /* Ensure proper contrast on all surfaces */
        .text-slate-100 { color: var(--text-primary) !important; }
        
        /* Empty states should not be white */
        .text-slate-400 { color: var(--text-muted) !important; }
        
        /* Popover and dropdown backgrounds */
        [role="menu"], [role="dialog"], [role="listbox"] {
          background-color: var(--panel-secondary) !important;
          border-color: var(--panel-border) !important;
        }
      `}</style>
      <div className="min-h-screen">
        {children}
      </div>
    </>
  );
}