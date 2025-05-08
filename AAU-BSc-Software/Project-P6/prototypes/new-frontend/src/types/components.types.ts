import React from 'react';

export interface StatusItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}

export interface TerminalLogsProps {
  logs: any[];
}
