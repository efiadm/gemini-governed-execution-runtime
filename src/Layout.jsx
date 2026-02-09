import React, { useEffect } from "react";

export default function Layout({ children, currentPageName }) {
  // Apply lotus theme class to HTML element on mount
  useEffect(() => {
    document.documentElement.classList.add('lotus');
    return () => {
      document.documentElement.classList.remove('lotus');
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}