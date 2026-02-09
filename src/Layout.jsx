import React, { useEffect } from "react";

export default function Layout({ children, currentPageName }) {
  useEffect(() => {
    // Activate dark theme
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}