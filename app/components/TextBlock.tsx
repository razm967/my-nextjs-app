'use client';

import { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';

// Define text formatting options interface
interface TextFormat {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  fontStyle: string;
  textAlign: string;
  textColor: string;
  backgroundColor: string;
  isUnderlined: boolean;
  isStrikethrough: boolean;
}

export interface TextBlockProps {
  id: string;
  title: string;
  content: string;
  position: { x: number; y: number };
  format: TextFormat;
  onUpdate: (id: string, title: string, content: string) => void;
  onDelete: (id: string) => void;
  onPositionChange?: (id: string, position: { x: number; y: number }) => void;
  onActivate?: (id: string | null, editingField?: 'title' | 'content' | null) => void;
  isActive?: boolean;
}

const TextBlock = ({ 
  id, 
  title: initialTitle, 
  content: initialContent, 
  position: initialPosition,
  format,
  onUpdate,
  onDelete,
  onPositionChange,
  onActivate,
  isActive = false
}: TextBlockProps) => {
  // State for content
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [blockTitle, setBlockTitle] = useState('');
  
  // State for position and size
  const [position, setPosition] = useState(initialPosition);
  const [width, setWidth] = useState(320);
  
  // State for interactions
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [isEditingBlockTitle, setIsEditingBlockTitle] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, width: 0 });
  
  // Refs for DOM elements
  const blockRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const blockTitleInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Sync position with props when they change
  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  // Update local state when props change
  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
  }, [initialTitle, initialContent]);

  // Handle mouse down for dragging
  const handleDragStart = (e: React.MouseEvent) => {
    if (isEditingTitle || isEditingContent || isEditingBlockTitle || isResizing) return;
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX - position.x, 
      y: e.clientY - position.y 
    });
  };

  // Handle mouse down for resizing
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({ 
      x: e.clientX, 
      width: width 
    });
  };

  // Handle mouse move for both dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setPosition({ x: newX, y: newY });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const newWidth = Math.max(240, resizeStart.width + deltaX);
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isDragging && onPositionChange) {
        onPositionChange(id, position);
      }
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, id, position, onPositionChange]);

  // Auto-adjust textarea height
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };
  
  useEffect(() => {
    if (isEditingContent && contentTextareaRef.current) {
      adjustTextareaHeight(contentTextareaRef.current);
    }
  }, [isEditingContent, content]);

  // Block title handlers
  const startEditingBlockTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingBlockTitle(true);
    setTimeout(() => {
      blockTitleInputRef.current?.focus();
      blockTitleInputRef.current?.select();
    }, 0);
  };

  const saveBlockTitle = () => {
    setIsEditingBlockTitle(false);
  };

  // Start editing title
  const startEditingTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingTitle(true);
    if (onActivate) onActivate(id, 'title');
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 0);
  };

  // Save title changes
  const saveTitle = () => {
    setIsEditingTitle(false);
    onUpdate(id, title, content);
    if (onActivate) onActivate(null, null);
  };

  // Start editing content
  const startEditingContent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingContent(true);
    if (onActivate) onActivate(id, 'content');
    setTimeout(() => {
      if (contentTextareaRef.current) {
        contentTextareaRef.current.focus();
        contentTextareaRef.current.select();
        adjustTextareaHeight(contentTextareaRef.current);
      }
    }, 0);
  };

  // Save content changes
  const saveContent = () => {
    setIsEditingContent(false);
    onUpdate(id, title, content);
    if (onActivate) onActivate(null, null);
  };

  // Handle key press in input fields
  const handleKeyPress = (e: React.KeyboardEvent, field: 'title' | 'content' | 'blockTitle') => {
    if (e.key === 'Enter' && !e.shiftKey && (field === 'title' || field === 'blockTitle')) {
      e.preventDefault();
      if (field === 'title') {
        saveTitle();
      } else if (field === 'blockTitle') {
        saveBlockTitle();
      }
    } else if (e.key === 'Escape') {
      if (field === 'title') {
        setTitle(initialTitle);
        setIsEditingTitle(false);
        if (onActivate) onActivate(null, null);
      } else if (field === 'content') {
        setContent(initialContent);
        setIsEditingContent(false);
        if (onActivate) onActivate(null, null);
      } else if (field === 'blockTitle') {
        setIsEditingBlockTitle(false);
      }
    }
  };

  // Handle click outside to save changes
  useEffect(() => {
    if (!isEditingTitle && !isEditingContent) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const titleEditor = titleInputRef.current;
      const contentEditor = contentTextareaRef.current;
      
      if (isEditingTitle && titleEditor && !titleEditor.contains(target)) {
        saveTitle();
      }
      
      if (isEditingContent && contentEditor && !contentEditor.contains(target)) {
        saveContent();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditingTitle, isEditingContent, initialTitle, initialContent]);

  // Generate style object for formatted text
  const getFormattedTextStyle = () => {
    return {
      fontFamily: format.fontFamily,
      fontSize: format.fontSize,
      fontWeight: format.fontWeight,
      fontStyle: format.fontStyle,
      textAlign: format.textAlign as any,
      color: format.textColor,
      backgroundColor: format.backgroundColor !== 'transparent' ? format.backgroundColor : undefined,
      textDecoration: `${format.isUnderlined ? 'underline' : ''} ${format.isStrikethrough ? 'line-through' : ''}`.trim() || 'none',
    };
  };

  return (
    <div className="absolute" style={{ left: position.x, top: position.y }}>
      {/* Block title (above the block) */}
      <div className="mb-1 text-center" style={{ width: `${width}px` }}>
        {isEditingBlockTitle ? (
          <input
            ref={blockTitleInputRef}
            type="text"
            value={blockTitle}
            onChange={(e) => setBlockTitle(e.target.value)}
            onBlur={saveBlockTitle}
            onKeyDown={(e) => handleKeyPress(e, 'blockTitle')}
            className="w-full p-1 text-sm text-gray-500 dark:text-gray-400 bg-transparent border-b border-gray-300 dark:border-gray-700 focus:outline-none text-center"
            placeholder="Add block title..."
          />
        ) : (
          <div 
            className="text-sm text-gray-500 dark:text-gray-400 cursor-text text-center px-1 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            onClick={startEditingBlockTitle}
          >
            {blockTitle || 'Add block title...'}
          </div>
        )}
      </div>
      
      {/* Main block content */}
      <div 
        ref={blockRef}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border ${isActive ? 'border-blue-500 dark:border-blue-400' : 'border-gray-300 dark:border-gray-700'} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} hover:shadow-xl transition-shadow`}
        style={{ 
          width: `${width}px`,
          minHeight: '100px',
          userSelect: 'none',
          zIndex: isDragging || isResizing ? 10 : (isActive ? 5 : 1),
        }}
        onMouseDown={handleDragStart}
      >
        {/* Delete button */}
        <button 
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
        >
          ✕
        </button>
        
        {/* Title */}
        <div className="mb-2 pr-5 mt-1">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => handleKeyPress(e, 'title')}
              className="w-full p-1 font-bold text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 
              className={`font-bold text-gray-800 dark:text-white cursor-text ${isActive ? 'hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1' : ''}`}
              onClick={startEditingTitle}
            >
              {title || 'Untitled'}
            </h3>
          )}
        </div>
        
        {/* Content */}
        <div className="min-h-[50px]">
          {isEditingContent ? (
            <textarea
              ref={contentTextareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (contentTextareaRef.current) {
                  adjustTextareaHeight(contentTextareaRef.current);
                }
              }}
              onBlur={saveContent}
              onKeyDown={(e) => handleKeyPress(e, 'content')}
              className="w-full p-2 min-h-[100px] text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded resize-none overflow-hidden"
              style={{ 
                height: 'auto',
                ...getFormattedTextStyle()
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div 
              className={`whitespace-pre-wrap cursor-text break-words ${isActive ? 'hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1' : ''}`}
              style={getFormattedTextStyle()}
              onClick={startEditingContent}
            >
              {content || 'Click to add content...'}
            </div>
          )}
        </div>

        {/* Resize handle */}
        <div 
          className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize"
          style={{
            backgroundImage: 'radial-gradient(circle, #999 1px, transparent 1px)',
            backgroundSize: '3px 3px',
            backgroundPosition: 'bottom right',
            padding: '6px',
          }}
          onMouseDown={handleResizeStart}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

export default TextBlock; 