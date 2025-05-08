import React from 'react';

export default function Sidebar({ children }) {
  return (
    <div className="sidebar bg-base-800 border-r border-base-600 overflow-y-auto">
      {children}
    </div>
  );
}
