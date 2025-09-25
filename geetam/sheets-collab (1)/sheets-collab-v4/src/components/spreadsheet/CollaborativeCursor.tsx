import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface CollaborativeCursorProps {
  user: {
    userId: string;
    name: string;
    avatar?: string;
  };
  position: {
    x: number;
    y: number;
    cellId?: string;
  };
}

export function CollaborativeCursor({ user, position }: CollaborativeCursorProps) {
  const { userColors } = useSelector((state: RootState) => state.collaboration);
  const color = userColors[user.userId] || '#3b82f6';

  return (
    <div
      className="absolute pointer-events-none z-20 transition-all duration-150"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Cursor */}
      <div
        className="w-3 h-3 rounded-full border-2 border-white shadow-lg"
        style={{ backgroundColor: color }}
      />
      
      {/* User label */}
      <div
        className="absolute top-4 left-0 px-2 py-1 rounded text-xs text-white font-medium whitespace-nowrap shadow-lg"
        style={{ backgroundColor: color }}
      >
        {user.name}
      </div>
    </div>
  );
}