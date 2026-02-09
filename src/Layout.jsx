import React from "react";

export default function Layout({ children, currentPageName }) {
  return (
    <>
      <style>{`
        :root {
          --color-bg-primary: #0E1113;
          --color-bg-secondary: #14181B;
          --color-bg-tertiary: #1E2429;
          --color-accent-primary: #1F7A5A;
          --color-accent-secondary: #2B8A9C;
          --color-text-primary: #E6E8EA;
          --color-text-secondary: #A9B0B6;
          --color-text-muted: #7A8288;
          --color-border: #2A3038;
          --color-error: #C85A54;
        }
        
        body {
          background-color: var(--color-bg-primary);
          color: var(--color-text-primary);
        }
        
        /* Override shadcn defaults */
        .bg-white { background-color: var(--color-bg-secondary) !important; }
        .bg-slate-50 { background-color: var(--color-bg-tertiary) !important; }
        .bg-slate-100 { background-color: var(--color-bg-tertiary) !important; }
        .bg-gray-50 { background-color: var(--color-bg-tertiary) !important; }
        
        .text-slate-900 { color: var(--color-text-primary) !important; }
        .text-slate-800 { color: var(--color-text-primary) !important; }
        .text-slate-700 { color: var(--color-text-secondary) !important; }
        .text-slate-600 { color: var(--color-text-muted) !important; }
        .text-slate-500 { color: var(--color-text-muted) !important; }
        
        .border-slate-200 { border-color: var(--color-border) !important; }
        .border-slate-300 { border-color: var(--color-border) !important; }
        
        .bg-green-50 { background-color: rgba(31, 122, 90, 0.1) !important; }
        .bg-green-100 { background-color: rgba(31, 122, 90, 0.15) !important; }
        .bg-green-600 { background-color: var(--color-accent-primary) !important; }
        .text-green-600 { color: var(--color-accent-primary) !important; }
        .text-green-700 { color: var(--color-accent-primary) !important; }
        .text-green-800 { color: var(--color-accent-primary) !important; }
        
        .bg-blue-50 { background-color: rgba(43, 138, 156, 0.1) !important; }
        .bg-blue-100 { background-color: rgba(43, 138, 156, 0.15) !important; }
        .text-blue-600 { color: var(--color-accent-secondary) !important; }
        .text-blue-700 { color: var(--color-accent-secondary) !important; }
        
        .bg-red-50 { background-color: rgba(200, 90, 84, 0.1) !important; }
        .bg-red-100 { background-color: rgba(200, 90, 84, 0.15) !important; }
        .bg-red-600 { background-color: var(--color-error) !important; }
        .text-red-600 { color: var(--color-error) !important; }
        .text-red-700 { color: var(--color-error) !important; }
        
        .bg-orange-50 { background-color: rgba(200, 120, 84, 0.1) !important; }
        .text-orange-600 { color: #D69563 !important; }
        .text-orange-700 { color: #D69563 !important; }
        
        .bg-violet-50 { background-color: rgba(43, 138, 156, 0.08) !important; }
        .bg-indigo-50 { background-color: rgba(43, 138, 156, 0.08) !important; }
        .bg-amber-50 { background-color: rgba(200, 120, 84, 0.08) !important; }
        
        .shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.4) !important; }
        .shadow-lg { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4) !important; }
        
        /* Card borders */
        .border { border-color: var(--color-border) !important; }
        
        /* Gradients */
        .bg-gradient-to-br { background: linear-gradient(to bottom right, var(--color-bg-secondary), var(--color-bg-tertiary)) !important; }
        .bg-gradient-to-r { background: linear-gradient(to right, rgba(43, 138, 156, 0.1), rgba(31, 122, 90, 0.1)) !important; }
        
        /* Table backgrounds */
        .bg-violet-50 { background-color: rgba(43, 138, 156, 0.05) !important; }
        
        /* Input and select backgrounds */
        input, textarea, select, [role="combobox"] {
          background-color: var(--color-bg-tertiary) !important;
          border-color: var(--color-border) !important;
          color: var(--color-text-primary) !important;
        }
        
        /* Button adjustments */
        button { color: var(--color-text-primary); }
        button:disabled { opacity: 0.4; }
      `}</style>
      <div className="min-h-screen">
        {children}
      </div>
    </>
  );
}