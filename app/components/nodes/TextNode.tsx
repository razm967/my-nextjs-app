import { memo, useState, useRef, CSSProperties, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { useFlowStore } from '../../store/flowStore';
import ContextMenu from '../ContextMenu';
import { FiCopy, FiCheck, FiX } from 'react-icons/fi';

// Text node component for the flow
const TextNode = ({ id, data, style, draggable, selected }: NodeProps & { style?: CSSProperties, draggable?: boolean, selected?: boolean }) => {
  // Get updateNodeText function from our store
  const updateNodeText = useFlowStore((state) => state.updateNodeText);
  // Add deleteNode function from the store
  const deleteNode = useFlowStore((state) => state.deleteNode);
  
  // Get ReactFlow instance to manipulate node properties
  const reactFlowInstance = useReactFlow();
  
  // State for editing mode
  const [isEditing, setIsEditing] = useState(false);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [isNameEditing, setIsNameEditing] = useState(false);
  const [text, setText] = useState(data.text || '');
  const [title, setTitle] = useState(data.label || 'Node');
  const [name, setName] = useState(data.name || '');
  
  // State for text formatting
  const [textStyle, setTextStyle] = useState<CSSProperties>(data.textStyle || {});
  const [fontSize, setFontSize] = useState(data.fontSize || '14');
  const [fontFamily, setFontFamily] = useState(data.fontFamily || 'Canva Sans');
  
  // Track if any part of the node is being edited
  const isAnyEditing = isEditing || isTitleEditing || isNameEditing;
  
  // State for context menu
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    top: number;
    left: number;
  }>({
    show: false,
    top: 0,
    left: 0,
  });
  
  // Add state for node hover
  const [isHovered, setIsHovered] = useState(false);
  
  // Reference to the node element
  const nodeRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nameTextareaRef = useRef<HTMLTextAreaElement>(null);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Add state for copy feedback
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  
  // Update internal state when data changes (e.g., from external sources)
  useEffect(() => {
    setText(data.text || '');
    setTitle(data.label || 'Node');
    setName(data.name || '');
    setTextStyle(data.textStyle || {});
    setFontSize(data.fontSize || '14');
    setFontFamily(data.fontFamily || 'Canva Sans');
  }, [data]);

  // Auto-adjust textarea height when editing
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      // Reset height first to get accurate scrollHeight
      textarea.style.height = 'auto';
      // Set height based on content (plus a bit of padding)
      textarea.style.height = `${textarea.scrollHeight + 2}px`;
    }
  }, [isEditing, text]);

  // Auto-adjust name textarea height when editing name
  useEffect(() => {
    if (isNameEditing && nameTextareaRef.current) {
      const textarea = nameTextareaRef.current;
      // Reset height first to get accurate scrollHeight
      textarea.style.height = 'auto';
      // Set height based on content (plus a bit of padding)
      textarea.style.height = `${textarea.scrollHeight + 2}px`;
    }
  }, [isNameEditing, name]);

  // Auto-adjust title textarea height when editing title
  useEffect(() => {
    if (isTitleEditing && titleTextareaRef.current) {
      const textarea = titleTextareaRef.current;
      // Reset height first to get accurate scrollHeight
      textarea.style.height = 'auto';
      // Set height based on content (plus a bit of padding)
      textarea.style.height = `${textarea.scrollHeight + 2}px`;
    }
  }, [isTitleEditing, title]);

  // Resize node based on content
  useEffect(() => {
    if (!nodeRef.current) return;
    
    // Set up resize observer to track content changes
    const resizeObserver = new ResizeObserver(() => {
      if (contentRef.current && nodeRef.current) {
        // Check if we're in React Flow (id exists in the flow)
        if (reactFlowInstance.getNode(id)) {
          // Get the measurements of all text elements
          const titleWidth = title ? title.length * (parseInt(fontSize) * 0.7) : 0; // Title has larger font
          const nameWidth = name ? name.length * (parseInt(fontSize) * 0.5) : 0; // Name/tag has smaller font
          const contentWidth = text.length * (parseInt(fontSize) * 0.6); // Content with normal font
          const contentHeight = contentRef.current.scrollHeight;
          
          // Use the longest text element for width calculation
          const maxWidth = Math.max(contentWidth, nameWidth, titleWidth);
          
          // Update node dimensions with calculated size
          // First get the current node position
          const node = reactFlowInstance.getNode(id);
          if (node) {
            // Calculate width based on text length with min/max constraints
            // For longer text, make the node wider to improve readability
            let nodeWidth = Math.max(200, Math.min(500, maxWidth + 40));
            
            // Apply calculated dimensions to the node
            reactFlowInstance.setNodes((nodes) => 
              nodes.map((n) => {
                if (n.id === id) {
                  return {
                    ...n,
                    style: {
                      ...n.style,
                      width: nodeWidth,
                    },
                  };
                }
                return n;
              })
            );
          }
        }
      }
    });
    
    // Observe the content and textarea if editing
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }
    if (isEditing && textareaRef.current) {
      resizeObserver.observe(textareaRef.current);
    }
    
    // Clean up observer
    return () => {
      resizeObserver.disconnect();
    };
  }, [reactFlowInstance, id, text, isEditing, title, name, fontSize]);

  // Ensure editing state persists when node is selected
  useEffect(() => {
    if (!selected && isAnyEditing) {
      // Save changes when node is deselected
      updateNodeText(id, text, title, name, textStyle, fontSize, fontFamily);
      // Only exit editing mode if node is deselected from outside
      const noActiveElement = document.activeElement === document.body;
      if (noActiveElement) {
        setIsEditing(false);
        setIsTitleEditing(false);
        setIsNameEditing(false);
      }
    }
  }, [selected, id, text, title, name, textStyle, fontSize, fontFamily, isAnyEditing, updateNodeText]);
  
  // Handle double click to enter edit mode for content
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up to ReactFlow
    e.preventDefault();
    setIsEditing(true);
  };
  
  // Handle double click to enter edit mode for title
  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up to ReactFlow
    e.preventDefault();
    setIsTitleEditing(true);
  };
  
  // Handle double click to enter edit mode for name
  const handleNameDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up to ReactFlow
    e.preventDefault();
    setIsNameEditing(true);
  };
  
  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };
  
  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(e.target.value);
  };
  
  // Handle name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setName(e.target.value);
  };
  
  // Handle blur to exit edit mode and save content
  const handleBlur = () => {
    setIsEditing(false);
    updateNodeText(id, text, title, name, textStyle, fontSize, fontFamily);
  };
  
  // Handle blur to exit edit mode and save title
  const handleTitleBlur = () => {
    setIsTitleEditing(false);
    // Update node data with new title
    updateNodeText(id, text, title, name, textStyle, fontSize, fontFamily);
  };
  
  // Handle blur to exit edit mode and save name
  const handleNameBlur = () => {
    setIsNameEditing(false);
    // Update node data with new name
    updateNodeText(id, text, title, name, textStyle, fontSize, fontFamily);
  };
  
  // Block all events that might cause node deselection
  const blockNodeDeselection = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.nativeEvent?.stopPropagation();
    e.nativeEvent?.stopImmediatePropagation();
  };
  
  // Handle key press for content (Enter to save, Escape to cancel)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
      updateNodeText(id, text, title, name, textStyle, fontSize, fontFamily);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setText(data.text || ''); // Reset to original text
    }
    
    // Prevent propagation to avoid triggering ReactFlow shortcuts
    e.stopPropagation();
  };
  
  // Handle key press for title (Enter to save, Escape to cancel)
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsTitleEditing(false);
      updateNodeText(id, text, title, name, textStyle, fontSize, fontFamily);
    } else if (e.key === 'Escape') {
      setIsTitleEditing(false);
      setTitle(data.label || ''); // Reset to original title
    }
    
    // Prevent propagation to avoid triggering ReactFlow shortcuts
    e.stopPropagation();
  };
  
  // Handle key press for name (Enter to save, Escape to cancel)
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsNameEditing(false);
      updateNodeText(id, text, title, name, textStyle, fontSize, fontFamily);
    } else if (e.key === 'Escape') {
      setIsNameEditing(false);
      setName(data.name || ''); // Reset to original name
    }
    
    // Prevent propagation to avoid triggering ReactFlow shortcuts
    e.stopPropagation();
  };
  
  // Handle right click to show context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate position relative to the viewport
    const bounds = nodeRef.current?.getBoundingClientRect();
    if (!bounds) return;
    
    setContextMenu({
      show: true,
      top: e.clientY - bounds.top,
      left: e.clientX - bounds.left,
    });
  };
  
  // Close the context menu
  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, show: false });
  };
  
  // Style to apply to text when editing and when displaying
  const appliedTextStyle = {
    fontFamily: fontFamily || 'Canva Sans', // Use Canva Sans as fallback
    fontSize: `${fontSize}px`,
    ...textStyle
  };
  
  // Merge provided style with default styles
  const nodeStyle = {
    borderWidth: '1px', 
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    width: 'auto',
    height: 'auto',
    ...style, // Apply any styles passed from ReactFlow
  };

  // Common input field styles with thinner borders
  const inputStyles = "w-full bg-white border-[0.5px] border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-gray-200 transition-all duration-200";

  // Add a special class when editing to visually indicate the node is locked
  const editingClass = isAnyEditing ? 'node-editing' : '';
  const selectedClass = selected ? 'node-selected' : '';
  
  // Add a border highlight when editing
  if (isAnyEditing) {
    nodeStyle.borderColor = '#3b82f6';
    nodeStyle.borderWidth = '2px';
    nodeStyle.boxShadow = '0 0 0 2px rgba(26, 25, 43, 0.2)';
  }

  if (selected) {
    nodeStyle.borderColor = '#3b82f6'; // Blue color
    nodeStyle.borderWidth = '2px';
    nodeStyle.boxShadow = '0 0 0 1px rgba(59, 130, 246, 0.5)'; // Blue glow effect
  }
  
  // Handle styles - extracted to variables for consistency
  const handleBaseStyle = {
    width: '12px',                    // Increased from 8px
    height: '12px',                   // Increased from 8px
    background: '#1a192b',
    borderRadius: '50%',              // Ensure rounded shape
    border: '2px solid white',        // Add border for better visibility
    transition: 'all 0.2s ease',      // Smooth transition for hover effect
    opacity: 0.7,                     // Slightly transparent by default
  };

  // Handle styles for different positions
  const handleStyleTop = { ...handleBaseStyle, top: '-7px' };     // Adjusted position
  const handleStyleBottom = { 
    ...handleBaseStyle, 
    bottom: '-7px',
    background: '#4CAF50',  // Green color to indicate it's only a target
    borderColor: '#E8F5E9'  // Light green border
  }; 
  const handleStyleLeft = { ...handleBaseStyle, left: '-7px' };     // Adjusted position
  const handleStyleRight = { ...handleBaseStyle, right: '-7px' };   // Adjusted position

  // Handle node deletion - no confirmation
  const handleDeleteNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    deleteNode(id);
  };

  // Add copy functionality - copies just title and content
  const handleCopyNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Get the current title and content
    const currentTitle = title || '';
    const currentContent = text || '';
    
    // Create formatted text with title and content only
    let copyText = '';
    
    // Always add title if it exists
    if (currentTitle.trim()) {
      copyText += `${currentTitle}\n\n`;
    }
    
    // Always add content
    copyText += currentContent;
    
    // Copy to clipboard
    navigator.clipboard.writeText(copyText)
      .then(() => {
        // Show feedback
        setShowCopyFeedback(true);
        setTimeout(() => {
          setShowCopyFeedback(false);
        }, 1000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  // First, update the style calculation
  if (data.markedForCut) {
    // Simpler, more subtle styling with lowered opacity
    nodeStyle.opacity = 0.6; // Lower node opacity
    nodeStyle.borderColor = '#ef4444'; // Red border
    nodeStyle.borderWidth = '2px';
  }

  return (
    <div
      ref={nodeRef}
      className={`p-4 rounded-xl shadow-md border border-gray-200 min-w-[200px] max-w-[500px] relative ${editingClass} ${selectedClass} handle-connection-node`}
      style={nodeStyle}
      onContextMenu={handleContextMenu}
      onClick={blockNodeDeselection}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={(e) => {
        // Prevent dragging when in edit mode
        if (isAnyEditing) {
          e.stopPropagation();
        }
      }}
    >
      {/* Node actions - only show when hovering or selected, not when editing */}
      {!isAnyEditing && (isHovered || selected) && (
        <div className="absolute top-1 right-1 flex items-center z-10 bg-white bg-opacity-70 rounded px-0.5">
          {/* Copy button with state-based feedback */}
          <div className="relative">
            <button
              className={`${showCopyFeedback ? 'text-green-500 hover:text-green-600' : 'text-blue-500 hover:text-blue-700'} text-sm p-1 transition-colors ${selected && !isHovered ? 'opacity-70' : 'opacity-90'} flex items-center justify-center`}
              onClick={handleCopyNode}
              title="Copy node content"
            >
              {showCopyFeedback ? <FiCheck size={16} /> : <FiCopy size={14} />}
            </button>
          </div>
          
          {/* Delete button */}
          <button
            className={`text-red-500 text-sm p-1 hover:text-red-700 transition-colors ${selected && !isHovered ? 'opacity-70' : 'opacity-90'} flex items-center justify-center`}
            onClick={handleDeleteNode}
            title="Delete node"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {isAnyEditing && (
        <div className="absolute -top-7 left-0 right-0 text-xs text-center bg-primary text-white py-1 px-2 rounded-t-md opacity-80">
          Node locked for editing
        </div>
      )}
    
      {/* Node identifier - above the title */}
      <div className="mb-1 text-xs text-gray-400 font-medium">
        {isNameEditing ? (
          <textarea
            ref={nameTextareaRef}
            autoFocus
            className={`${inputStyles} py-0.5 px-1 text-xs w-full resize-none overflow-hidden min-h-[20px]`}
            value={name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            onClick={(e) => {
              e.stopPropagation();
              blockNodeDeselection(e);
            }}
            rows={1}
          />
        ) : (
          <div
            className="py-0.5 px-1 hover:bg-gray-50 rounded cursor-text whitespace-normal break-words"
            onDoubleClick={handleNameDoubleClick}
            onClick={blockNodeDeselection}
          >
            {name || 'Double-click to add identifier'}
          </div>
        )}
      </div>

      {/* Top handle (source) */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={handleStyleTop}
        className="connection-handle top-handle"
      />
      
      {/* Node content */}
      <div className="space-y-1" ref={contentRef}>
        {/* Title - now editable */}
        <div className="text-sm font-semibold text-gray-800 mb-1">
          {isTitleEditing ? (
            <textarea
              ref={titleTextareaRef}
              autoFocus
              className={`${inputStyles} p-1 text-sm font-semibold w-full resize-none overflow-hidden min-h-[24px]`}
              value={title}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              onClick={(e) => {
                e.stopPropagation();
                blockNodeDeselection(e);
              }}
              rows={1}
            />
          ) : (
            <div
              className="p-1 hover:bg-gray-50 rounded cursor-text whitespace-normal break-words"
              onDoubleClick={handleTitleDoubleClick}
              onClick={blockNodeDeselection}
            >
              {title || 'Double-click to add title'}
            </div>
          )}
        </div>
        
        {/* Content */}
        {isEditing ? (
          <textarea
            ref={textareaRef}
            autoFocus
            className={`${inputStyles} p-2 text-sm mt-1 resize-none overflow-hidden w-full break-words`}
            value={text}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onClick={(e) => {
              e.stopPropagation();
              blockNodeDeselection(e);
            }}
            style={appliedTextStyle}
            rows={1}
          />
        ) : (
          <div
            className="p-1 text-sm whitespace-normal break-words cursor-text text-gray-600 w-full overflow-wrap-anywhere formatted-content"
            onDoubleClick={handleDoubleClick}
            onClick={blockNodeDeselection}
            style={appliedTextStyle}
          >
            {text || 'Double-click to add content'}
          </div>
        )}
      </div>
      
      {/* Bottom handle (target) */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        style={handleStyleBottom}
        className="connection-handle bottom-handle"
      />
      
      {/* Left handle */}
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={handleStyleLeft}
        className="connection-handle left-handle"
      />
      
      {/* Right handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={handleStyleRight}
        className="connection-handle right-handle"
      />
      
      {/* Context menu */}
      {contextMenu.show && (
        <ContextMenu
          id={id}
          top={contextMenu.top}
          left={contextMenu.left}
          onClose={closeContextMenu}
        />
      )}

      {data.markedForCut && (
        <div className="absolute top-2 right-2 bg-red-100 text-red-500 text-xs px-2 py-1 rounded-md opacity-80 shadow-sm">
          cut
        </div>
      )}
    </div>
  );
};

export default memo(TextNode); 