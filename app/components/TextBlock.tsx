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

interface Position {
  x: number;
  y: number;
  _timestamp?: number; // Optional timestamp for forcing re-renders
}

// Define connection point positions
export type ConnectionPointPosition = 'top' | 'right' | 'bottom' | 'left';

export interface ConnectionPoint {
  position: ConnectionPointPosition;
  x: number;
  y: number;
}

export interface TextBlockProps {
  id: string;
  title: string;
  content: string;
  position: Position;
  format: TextFormat;
  titleFormat?: TextFormat;
  onUpdate: (id: string, title: string, content: string) => void;
  onDelete: (id: string) => void;
  onPositionChange?: (id: string, position: Position) => void;
  onActivate?: (id: string | null, editingField?: 'title' | 'content' | null) => void;
  isActive?: boolean;
  // Updated connection props
  onStartConnection?: (blockId: string, pointPosition: ConnectionPointPosition, startPoint: {x: number, y: number}) => void;
  onFinishConnection?: (blockId: string, pointPosition: ConnectionPointPosition) => void;
  isCreatingConnection?: boolean;
  isConnectionSource?: boolean;
  // Add a prop to pass in which connection points the block already has connections on
  activeConnections?: ConnectionPointPosition[];
}

const TextBlock = ({ 
  id, 
  title: initialTitle, 
  content: initialContent, 
  position: initialPosition,
  format,
  titleFormat,
  onUpdate,
  onDelete,
  onPositionChange,
  onActivate,
  isActive = false,
  // Updated connection props with defaults
  onStartConnection,
  onFinishConnection,
  isCreatingConnection = false,
  isConnectionSource = false,
  activeConnections = []
}: TextBlockProps) => {
  // State for content
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [blockTitle, setBlockTitle] = useState('');
  
  // State for position and size
  const [position, setPosition] = useState<Position>(initialPosition);
  const [width, setWidth] = useState(320);
  const [height, setHeight] = useState(150); // Track block height
  const [connectionPoints, setConnectionPoints] = useState<ConnectionPoint[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<ConnectionPointPosition | null>(null);
  
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
  
  // Update format when props change
  useEffect(() => {
    // Render component with fresh format data when props change
    if (format || titleFormat) {
      console.log(`Format updated for block ${id}, re-rendering`);
      // This is just to force a re-render that applies the new format
      setPosition(prevPosition => ({...prevPosition, _timestamp: Date.now()}));
    }
  }, [format, titleFormat, id]);

  // Update connection points calculation to be more precise
  useEffect(() => {
    if (blockRef.current) {
      const rect = blockRef.current.getBoundingClientRect();
      const blockHeight = rect.height;
      setHeight(blockHeight);
      
      // Calculate the global coordinates of the connection points with higher precision
      const points: ConnectionPoint[] = [
        { position: 'top', x: position.x + width / 2, y: position.y },
        { position: 'right', x: position.x + width, y: position.y + blockHeight / 2 },
        { position: 'bottom', x: position.x + width / 2, y: position.y + blockHeight },
        { position: 'left', x: position.x, y: position.y + blockHeight / 2 }
      ];
      
      setConnectionPoints(points);
      
      // Notify parent of updated connection points if position or size changed
      if (onPositionChange && (isDragging || isResizing)) {
        // We need to tell the parent component that our connection points have moved
        // Use a slight delay to ensure this happens after state is updated
        setTimeout(() => {
          onPositionChange(id, {...position, _timestamp: Date.now()});
        }, 0);
      }
    }
  }, [position.x, position.y, width, height, isDragging, isResizing, id]);

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
        const newWidth = Math.max(320, resizeStart.width + deltaX);
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isDragging && onPositionChange) {
        onPositionChange(id, position);
      }
      
      if (isResizing && onPositionChange) {
        // When resizing ends, notify parent to update connections
        // Use a small delay to ensure the block has been rendered with its new size
        setTimeout(() => {
          onPositionChange(id, {...position, _timestamp: Date.now()});
        }, 10);
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

  // Function to prevent losing focus when clicking the toolbar
  const preventToolbarBlur = () => {
    // Create a global event handler just for the next mousedown
    const preventBlur = (e: MouseEvent) => {
      // Check if clicking on toolbar
      const target = e.target as HTMLElement;
      if (target.closest('.toolbar-container')) {
        e.preventDefault();
        
        // We only want this handler to run once
        document.removeEventListener('mousedown', preventBlur, true);
        
        // Log for debugging
        console.log("Prevented blur from toolbar click");
        return false;
      }
      
      // Clean up this handler
      document.removeEventListener('mousedown', preventBlur, true);
    };
    
    // Add the event handler with capture phase to run before blur events
    document.addEventListener('mousedown', preventBlur, true);
  };

  // Start editing title
  const startEditingTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingTitle(true);
    if (onActivate) {
      onActivate(id, 'title');
      // Set up blur prevention
      preventToolbarBlur();
    }
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 0);
  };

  // Save title changes
  const saveTitle = (clearActive = true) => {
    if (!isEditingTitle) return; // Don't save if already saved
    
    setIsEditingTitle(false);
    onUpdate(id, title, content);
    console.log(`Saving title for block ${id}: ${title}`);
    
    // Optionally clear the active state
    if (clearActive && onActivate) onActivate(null, null);
  };

  // Handle blur event for title
  const handleTitleBlur = (e: React.FocusEvent) => {
    // Check if the new focus target is in the toolbar
    const relatedTarget = e.relatedTarget as Node;
    const isToolbarClick = relatedTarget && document.querySelector('.toolbar-container')?.contains(relatedTarget);
    
    // Only save if not clicking on toolbar
    if (!isToolbarClick) {
      saveTitle();
    } else {
      // Prevent blur by refocusing the input
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 0);
      e.preventDefault();
    }
  };

  // Start editing content
  const startEditingContent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingContent(true);
    if (onActivate) {
      onActivate(id, 'content');
      // Set up blur prevention
      preventToolbarBlur();
    }
    setTimeout(() => {
      if (contentTextareaRef.current) {
        contentTextareaRef.current.focus();
        contentTextareaRef.current.select();
        adjustTextareaHeight(contentTextareaRef.current);
      }
    }, 0);
  };

  // Save content changes
  const saveContent = (clearActive = true) => {
    if (!isEditingContent) return; // Don't save if already saved
    
    setIsEditingContent(false);
    onUpdate(id, title, content);
    console.log(`Saving content for block ${id}`);
    
    // Optionally clear the active state
    if (clearActive && onActivate) onActivate(null, null);
  };

  // Handle blur event for content
  const handleContentBlur = (e: React.FocusEvent) => {
    // Check if the new focus target is in the toolbar
    const relatedTarget = e.relatedTarget as Node;
    const isToolbarClick = relatedTarget && document.querySelector('.toolbar-container')?.contains(relatedTarget);
    
    // Only save if not clicking on toolbar
    if (!isToolbarClick) {
      saveContent();
    } else {
      // Prevent blur by refocusing the textarea
      setTimeout(() => {
        contentTextareaRef.current?.focus();
      }, 0);
      e.preventDefault();
    }
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
      // Early return if clicking on toolbar elements
      const target = e.target as Node;
      const isToolbarClick = (target as HTMLElement).closest('.toolbar-container') !== null;
      if (isToolbarClick) {
        console.log("Toolbar click detected - keeping editing state");
        return;
      }

      const titleEditor = titleInputRef.current;
      const contentEditor = contentTextareaRef.current;
      
      if (isEditingTitle && titleEditor && !titleEditor.contains(target)) {
        // Don't clear active state if clicking the toolbar
        console.log("Saving title on click outside");
        saveTitle(false);
      }
      
      if (isEditingContent && contentEditor && !contentEditor.contains(target)) {
        // Don't clear active state if clicking the toolbar
        console.log("Saving content on click outside");
        saveContent(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditingTitle, isEditingContent, initialTitle, initialContent, title, content]);

  // Generate style object for formatted text
  const getFormattedTextStyle = (forTitle = false) => {
    const formatToUse = forTitle && titleFormat ? titleFormat : format;
    
    // Make sure we have valid format values
    const safeFormat = {
      fontFamily: formatToUse.fontFamily || 'Arial, sans-serif',
      fontSize: formatToUse.fontSize || '16px',
      fontWeight: formatToUse.fontWeight || 'normal',
      fontStyle: formatToUse.fontStyle || 'normal',
      textAlign: formatToUse.textAlign || 'left',
      textColor: formatToUse.textColor || '#333333',
      backgroundColor: formatToUse.backgroundColor || 'transparent',
      isUnderlined: !!formatToUse.isUnderlined,
      isStrikethrough: !!formatToUse.isStrikethrough
    };
    
    return {
      fontFamily: safeFormat.fontFamily,
      fontSize: safeFormat.fontSize,
      fontWeight: safeFormat.fontWeight,
      fontStyle: safeFormat.fontStyle,
      textAlign: safeFormat.textAlign as any,
      color: safeFormat.textColor,
      backgroundColor: safeFormat.backgroundColor !== 'transparent' ? safeFormat.backgroundColor : undefined,
      textDecoration: `${safeFormat.isUnderlined ? 'underline' : ''} ${safeFormat.isStrikethrough ? 'line-through' : ''}`.trim() || 'none',
    };
  };

  // Save changes when losing active state
  useEffect(() => {
    // When a block becomes inactive, save any changes
    if (!isActive && (isEditingTitle || isEditingContent)) {
      console.log("Block became inactive - saving pending changes");
      
      if (isEditingTitle) {
        saveTitle(true);
      }
      
      if (isEditingContent) {
        saveContent(true);
      }
    }
  }, [isActive]);

  // Handle connection point click
  const handleConnectionPointClick = (e: React.MouseEvent, pointPosition: ConnectionPointPosition) => {
    e.stopPropagation();
    e.preventDefault();
    
    // If already creating a connection, this is a target
    if (isCreatingConnection && !isConnectionSource && onFinishConnection) {
      onFinishConnection(id, pointPosition);
      return;
    }
    
    // Otherwise start a new connection
    if (onStartConnection) {
      const point = connectionPoints.find(p => p.position === pointPosition);
      if (point) {
        // Pass the exact position of the connection point
        onStartConnection(id, pointPosition, { x: point.x, y: point.y });
      }
    }
  };

  // Handle hover states for connection points
  const handlePointMouseEnter = (pointPosition: ConnectionPointPosition) => {
    setHoveredPoint(pointPosition);
  };

  const handlePointMouseLeave = () => {
    setHoveredPoint(null);
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
        id={`block-${id}`}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border 
          ${isActive ? 'border-blue-500 dark:border-blue-400' : 'border-gray-300 dark:border-gray-700'} 
          ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} 
          ${isCreatingConnection && !isConnectionSource ? 'border-green-500 border-2' : ''}
          ${isConnectionSource ? 'border-blue-500 border-2' : ''} 
          hover:shadow-xl transition-shadow relative`}
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
        <div className="mb-2 pr-5 mt-1 w-full overflow-hidden">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              id={`title-${id}`}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => handleKeyPress(e, 'title')}
              className="w-full p-1 font-bold text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              style={getFormattedTextStyle(true)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 
              className={`font-bold text-gray-800 dark:text-white cursor-text ${isActive ? 'hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1' : ''} break-words overflow-hidden`}
              style={{
                ...getFormattedTextStyle(true),
                wordBreak: 'keep-all',
                hyphens: 'manual'
              }}
              onClick={startEditingTitle}
            >
              {title || 'Untitled'}
            </h3>
          )}
        </div>
        
        {/* Content */}
        <div className="min-h-[50px] w-full overflow-hidden">
          {isEditingContent ? (
            <textarea
              ref={contentTextareaRef}
              id={`content-${id}`}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (contentTextareaRef.current) {
                  adjustTextareaHeight(contentTextareaRef.current);
                }
              }}
              onBlur={handleContentBlur}
              onKeyDown={(e) => handleKeyPress(e, 'content')}
              className="w-full p-2 min-h-[100px] text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded resize-none overflow-hidden"
              style={{ 
                height: 'auto',
                ...getFormattedTextStyle(false)
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div 
              className={`whitespace-pre-wrap cursor-text break-words ${isActive ? 'hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1' : ''}`}
              style={{
                ...getFormattedTextStyle(false),
                overflowWrap: 'break-word',
                wordWrap: 'break-word',
                wordBreak: 'keep-all',
                hyphens: 'manual',
                minWidth: '0',
                maxWidth: '100%'
              }}
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

        {/* Connection points */}
        {connectionPoints.map((point) => {
          const isActive = activeConnections.includes(point.position);
          const isHovered = hoveredPoint === point.position;
          
          // Position styles for each connection point
          const positionStyles: React.CSSProperties = {
            position: 'absolute',
            transform: 'translate(-50%, -50%)',
            zIndex: 20,
          };
          
          // Apply specific positioning based on the point position
          switch(point.position) {
            case 'top':
              positionStyles.top = '0';
              positionStyles.left = '50%';
              break;
            case 'right':
              positionStyles.top = '50%';
              positionStyles.right = '0';
              positionStyles.transform = 'translate(50%, -50%)';
              break;
            case 'bottom':
              positionStyles.bottom = '0';
              positionStyles.left = '50%';
              positionStyles.transform = 'translate(-50%, 50%)';
              break;
            case 'left':
              positionStyles.top = '50%';
              positionStyles.left = '0';
              positionStyles.transform = 'translate(-50%, -50%)';
              break;
          }
          
          return (
            <div
              key={point.position}
              className={`w-3 h-3 rounded-full cursor-pointer 
                ${isHovered || isActive ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}
                ${isHovered ? 'scale-125' : ''}
                ${isCreatingConnection && !isConnectionSource ? 'animate-pulse' : ''}
                hover:bg-blue-500 transition-all duration-200`}
              style={positionStyles}
              onClick={(e) => handleConnectionPointClick(e, point.position)}
              onMouseEnter={() => handlePointMouseEnter(point.position)}
              onMouseLeave={handlePointMouseLeave}
              title={`Connect from ${point.position}`}
              data-position={point.position}
              id={`connection-point-${id}-${point.position}`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default TextBlock; 