import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Draggable from 'react-draggable';

export default function TerminalWindow({ isOpen, onClose, title, content }) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 800, height: 500 });
  const nodeRef = useRef(null);
  const resizingRef = useRef(false);
  
  const handleDrag = (e, ui) => {
    if (!resizingRef.current) {
      setPosition({
        x: ui.x,
        y: ui.y
      });
    }
  };

  const initResize = (direction) => (e) => {
    e.preventDefault();
    resizingRef.current = true;
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;
    const startLeft = position.x;
    const startTop = position.y;

    const handleMouseMove = (e) => {
      if (direction.includes('e')) {
        setSize(prev => ({ ...prev, width: startWidth + (e.clientX - startX) }));
      }
      if (direction.includes('s')) {
        setSize(prev => ({ ...prev, height: startHeight + (e.clientY - startY) }));
      }
      if (direction.includes('w')) {
        const newWidth = startWidth - (e.clientX - startX);
        if (newWidth > 300) {
          setSize(prev => ({ ...prev, width: newWidth }));
          setPosition(prev => ({ ...prev, x: startLeft + (e.clientX - startX) }));
        }
      }
      if (direction.includes('n')) {
        const newHeight = startHeight - (e.clientY - startY);
        if (newHeight > 200) {
          setSize(prev => ({ ...prev, height: newHeight }));
          setPosition(prev => ({ ...prev, y: startTop + (e.clientY - startY) }));
        }
      }
    };

    const handleMouseUp = () => {
      resizingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0" style={{ zIndex: 99999 }}>
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <Draggable 
        handle=".terminal-handle"
        nodeRef={nodeRef}
        position={position}
        onDrag={handleDrag}
        bounds="parent"
      >
        <div
          ref={nodeRef}
          style={{
            position: 'absolute',
            width: `${size.width}px`,
            height: `${size.height}px`,
            minWidth: '300px',
            minHeight: '200px',
            zIndex: 100000
          }}
          className="bg-base-800 rounded-lg shadow-xl border border-base-600"
        >
          {/* Terminal Header */}
          <div className="terminal-handle flex items-center justify-between p-3 border-b border-base-600 bg-base-900 select-none">
            <div className="flex items-center gap-2">
              <button 
                onClick={onClose}
                className="w-3 h-3 rounded-full bg-critical-500 hover:bg-critical-400"
              />
              <span className="ml-2 text-sm text-gray-400">{title}</span>
            </div>
          </div>

          {/* Terminal Content */}
          <div className="p-3 font-mono text-sm h-[calc(100%-48px)] bg-base-900 text-data-400 overflow-y-auto whitespace-pre-wrap">
            {content || '> Terminal ready...'}
          </div>

          {/* Resize handles */}
          <div className="absolute top-0 left-0 w-2 h-2 cursor-nw-resize" onMouseDown={initResize('nw')} />
          <div className="absolute top-0 right-0 w-2 h-2 cursor-ne-resize" onMouseDown={initResize('ne')} />
          <div className="absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize" onMouseDown={initResize('sw')} />
          <div className="absolute bottom-0 right-0 w-2 h-2 cursor-se-resize" onMouseDown={initResize('se')} />
          <div className="absolute top-0 left-2 right-2 h-2 cursor-n-resize" onMouseDown={initResize('n')} />
          <div className="absolute bottom-0 left-2 right-2 h-2 cursor-s-resize" onMouseDown={initResize('s')} />
          <div className="absolute left-0 top-2 bottom-2 w-2 cursor-w-resize" onMouseDown={initResize('w')} />
          <div className="absolute right-0 top-2 bottom-2 w-2 cursor-e-resize" onMouseDown={initResize('e')} />
        </div>
      </Draggable>
    </div>
  );

  return createPortal(modalContent, document.getElementById('modal-root'));
}
