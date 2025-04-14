'use client';

import { useState, useEffect, useRef } from 'react';

export interface TextBlockProps {
  id: string;
  title: string;
  content: string;
  position: { x: number; y: number };
  onUpdate: (id: string, title: string, content: string) => void;
  onDelete: (id: string) => void;
  onPositionChange?: (id: string, position: { x: number; y: number }) => void;
}

const TextBlock = ({ 
  id, 
  title: initialTitle, 
  content: initialContent, 
  position: initialPosition,
  onUpdate,
  onDelete,
  onPositionChange
}: TextBlockProps) => {
  // State for title and content
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  
  // State for position and dragging
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // State for editing title and content
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  
  // Refs for DOM elements
  const blockRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Sync position with props when they change
  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Skip dragging if we're editing text
    if (isEditingTitle || isEditingContent) return;
    
    setIsDragging(true);
    const rect = blockRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newPosition = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    };
    
    setPosition(newPosition);
  };

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      // Notify parent component of position change
      if (onPositionChange) {
        onPositionChange(id, position);
      }
    }
  };

  // Add and remove global event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Start editing title
  const startEditingTitle = () => {
    setIsEditingTitle(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 0);
  };

  // Save title changes
  const saveTitle = () => {
    setIsEditingTitle(false);
    onUpdate(id, title, content);
  };

  // Start editing content
  const startEditingContent = () => {
    setIsEditingContent(true);
    setTimeout(() => {
      contentTextareaRef.current?.focus();
      contentTextareaRef.current?.select();
    }, 0);
  };

  // Save content changes
  const saveContent = () => {
    setIsEditingContent(false);
    onUpdate(id, title, content);
  };

  // Handle key press in input fields
  const handleKeyPress = (e: React.KeyboardEvent, field: 'title' | 'content') => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (field === 'title') {
        saveTitle();
      } else {
        saveContent();
      }
    } else if (e.key === 'Escape') {
      if (field === 'title') {
        setTitle(initialTitle);
        setIsEditingTitle(false);
      } else {
        setContent(initialContent);
        setIsEditingContent(false);
      }
    }
  };

  return (
    <div
      ref={blockRef}
      className={`absolute bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-80 border border-gray-300 dark:border-gray-700 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: isDragging ? 10 : 1,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Delete button */}
      <button 
        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
        onClick={() => onDelete(id)}
      >
        ✕
      </button>
      
      {/* Title */}
      <div className="mb-2">
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => handleKeyPress(e, 'title')}
            className="w-full p-1 font-bold text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
          />
        ) : (
          <h3 
            className="font-bold text-gray-800 dark:text-white truncate" 
            onClick={startEditingTitle}
          >
            {title || 'Untitled'}
          </h3>
        )}
      </div>
      
      {/* Content */}
      <div>
        {isEditingContent ? (
          <textarea
            ref={contentTextareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={saveContent}
            onKeyDown={(e) => handleKeyPress(e, 'content')}
            className="w-full p-2 h-32 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded resize-none"
          />
        ) : (
          <p 
            className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap"
            onClick={startEditingContent}
          >
            {content || 'Click to add content...'}
          </p>
        )}
      </div>
    </div>
  );
};

export default TextBlock; 