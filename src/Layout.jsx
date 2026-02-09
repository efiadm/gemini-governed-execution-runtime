import React, { useEffect } from "react";

export default function Layout({ children, currentPageName }) {
  // Apply Gemini 3 theme class to HTML element on mount
  useEffect(() => {
    document.documentElement.classList.add('gemini3');
    return () => {
      document.documentElement.classList.remove('gemini3');
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}