import { memo, useState, useRef, CSSProperties, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { useFlowStore } from '../../store/flowStore';
import ContextMenu from '../ContextMenu';
import TextFormatToolbar from '../TextFormatToolbar';
import { FaBold, FaItalic, FaUnderline } from 'react-icons/fa';

// Text node component for the flow
const TextNode = ({ id, data, style, draggable, selected }: NodeProps & { style?: CSSProperties, draggable?: boolean, selected?: boolean }) => {
  // Get updateNodeText function from our store
  const updateNodeText = useFlowStore((state) => state.updateNodeText);
  
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
  
  // State for text selection
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [hasSelection, setHasSelection] = useState(false);
  
  // State for rich text formatting
  const [richTextFormats, setRichTextFormats] = useState<Array<{
    start: number;
    end: number;
    format: 'bold' | 'italic' | 'underline' | 'color' | 'fontSize' | 'fontFamily' | 'align';
    value?: string;
  }>>(data.richTextFormats || []);
  
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
  
  // Reference to the node element
  const nodeRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Update internal state when data changes (e.g., from external sources)
  useEffect(() => {
    setText(data.text || '');
    setTitle(data.label || 'Node');
    setName(data.name || '');
    setTextStyle(data.textStyle || {});
    setFontSize(data.fontSize || '14');
    setFontFamily(data.fontFamily || 'Canva Sans');
    setRichTextFormats(data.richTextFormats || []);
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

  // Track text selection in the textarea
  const handleSelectionChange = () => {
    if (isEditing && textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      
      if (start !== end) {
        // We have a selection
        setSelectionStart(start);
        setSelectionEnd(end);
        setSelectedText(text.substring(start, end));
        setHasSelection(true);
      } else {
        setSelectionStart(null);
        setSelectionEnd(null);
        setSelectedText('');
        setHasSelection(false);
      }
    }
  };

  // Resize node based on content
  useEffect(() => {
    if (!nodeRef.current) return;
    
    // Set up resize observer to track content changes
    const resizeObserver = new ResizeObserver(() => {
      if (contentRef.current && nodeRef.current) {
        // Check if we're in React Flow (id exists in the flow)
        if (reactFlowInstance.getNode(id)) {
          // Get the content measurements
          const contentWidth = text.length * (parseInt(fontSize) * 0.6); // Approximate width based on text length
          const contentHeight = contentRef.current.scrollHeight;
          
          // Update node dimensions with calculated size
          // First get the current node position
          const node = reactFlowInstance.getNode(id);
          if (node) {
            // Calculate width based on text length with min/max constraints
            // For longer text, make the node wider to improve readability
            let nodeWidth = Math.max(200, Math.min(500, contentWidth + 40));
            
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
      updateNodeText(id, text, title, name, textStyle, fontSize, fontFamily, richTextFormats);
      // Only exit editing mode if node is deselected from outside
      const noActiveElement = document.activeElement === document.body;
      if (noActiveElement) {
        setIsEditing(false);
        setIsTitleEditing(false);
        setIsNameEditing(false);
      }
    }
  }, [selected, id, text, title, name, textStyle, fontSize, fontFamily, richTextFormats, isAnyEditing, updateNodeText]);
  
  // Function to apply formatting to selected text using rich text format
  const applyRichTextFormat = (format: 'bold' | 'italic' | 'underline' | 'color' | 'fontSize' | 'fontFamily' | 'align', value?: string) => {
    if (!hasSelection || selectionStart === null || selectionEnd === null) return;
    
    // Create a new formatting entry
    const newFormat = {
      start: selectionStart,
      end: selectionEnd,
      format,
      value
    };
    
    // Add the new format to our array
    setRichTextFormats([...richTextFormats, newFormat]);
    
    // Keep focus and selection
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(selectionStart, selectionEnd);
      }
    }, 0);
  };

  // Function to get formatted display text
  const getFormattedText = () => {
    if (!text) return '';
    
    // Create spans for each formatted section
    let formattedText = document.createElement('div');
    let lastIndex = 0;
    
    // Sort formats by start position
    const sortedFormats = [...richTextFormats].sort((a, b) => a.start - b.start);
    
    // Apply each format
    for (const format of sortedFormats) {
      // Add unformatted text before this format
      if (format.start > lastIndex) {
        const textNode = document.createTextNode(text.substring(lastIndex, format.start));
        formattedText.appendChild(textNode);
      }
      
      // Create formatted span
      const span = document.createElement('span');
      span.textContent = text.substring(format.start, format.end);
      
      // Apply the appropriate styling
      switch (format.format) {
        case 'bold':
          span.style.fontWeight = 'bold';
          break;
        case 'italic':
          span.style.fontStyle = 'italic';
          break;
        case 'underline':
          span.style.textDecoration = 'underline';
          break;
        case 'color':
          if (format.value) span.style.color = format.value;
          break;
        case 'fontSize':
          if (format.value) span.style.fontSize = `${format.value}px`;
          break;
        case 'fontFamily':
          if (format.value) span.style.fontFamily = format.value;
          break;
        case 'align':
          // Alignment needs special handling as it's a block-level style
          if (format.value) {
            span.style.display = 'block';
            span.style.textAlign = format.value;
          }
          break;
      }
      
      formattedText.appendChild(span);
      lastIndex = format.end;
    }
    
    // Add any remaining unformatted text
    if (lastIndex < text.length) {
      const textNode = document.createTextNode(text.substring(lastIndex));
      formattedText.appendChild(textNode);
    }
    
    return formattedText.innerHTML;
  };
  
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
    
    // When text changes, we need to adjust all the rich text format positions
    // This is simplified and would need a more sophisticated algorithm for production
    // For example, it should track cursor position and insertion/deletion
    if (e.target.value.length !== text.length) {
      // For now, just clear formats when text changes significantly
      // A real implementation would adjust format positions based on text changes
      setRichTextFormats([]);
    }
  };
  
  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };
  
  // Handle name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };
  
  // Handle blur to exit edit mode and save content
  const handleBlur = () => {
    setIsEditing(false);
    updateNodeText(id, text, title, name, textStyle, fontSize, fontFamily, richTextFormats);
  };
  
  // Handle blur to exit edit mode and save title
  const handleTitleBlur = () => {
    setIsTitleEditing(false);
    // Update node data with new title
    updateNodeText(id, text, title, name, textStyle, fontSize, fontFamily, richTextFormats);
  };
  
  // Handle blur to exit edit mode and save name
  const handleNameBlur = () => {
    setIsNameEditing(false);
    // Update node data with new name
    updateNodeText(id, text, title, name, textStyle, fontSize, fontFamily, richTextFormats);
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
      updateNodeText(id, text, title, name, textStyle, fontSize, fontFamily, richTextFormats);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setText(data.text); // Reset to original text
      setRichTextFormats(data.richTextFormats || []); // Reset formats
    }
    
    // Prevent propagation to avoid triggering ReactFlow shortcuts
    e.stopPropagation();
  };
  
  // Handle key press for title (Enter to save, Escape to cancel)
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsTitleEditing(false);
      updateNodeText(id, text, title, name, textStyle, fontSize, fontFamily, richTextFormats);
    } else if (e.key === 'Escape') {
      setIsTitleEditing(false);
      setTitle(data.label); // Reset to original title
    }
    
    // Prevent propagation to avoid triggering ReactFlow shortcuts
    e.stopPropagation();
  };
  
  // Handle key press for name (Enter to save, Escape to cancel)
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsNameEditing(false);
      updateNodeText(id, text, title, name, textStyle, fontSize, fontFamily, richTextFormats);
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

  // Text formatting handlers - now working with selections
  const handleBold = () => {
    if (hasSelection) {
      applyRichTextFormat('bold');
    } else {
      setTextStyle(prev => ({
        ...prev,
        fontWeight: prev.fontWeight === 'bold' ? 'normal' : 'bold'
      }));
    }
  };

  const handleItalic = () => {
    if (hasSelection) {
      applyRichTextFormat('italic');
    } else {
      setTextStyle(prev => ({
        ...prev,
        fontStyle: prev.fontStyle === 'italic' ? 'normal' : 'italic'
      }));
    }
  };

  const handleUnderline = () => {
    if (hasSelection) {
      applyRichTextFormat('underline');
    } else {
      setTextStyle(prev => ({
        ...prev,
        textDecoration: prev.textDecoration === 'underline' ? 'none' : 'underline'
      }));
    }
  };

  const handleTextColor = (color: string) => {
    if (hasSelection) {
      applyRichTextFormat('color', color);
    } else {
      setTextStyle(prev => ({
        ...prev,
        color
      }));
    }
  };

  const handleFontSize = (size: string) => {
    if (hasSelection) {
      applyRichTextFormat('fontSize', size);
    } else {
      setFontSize(size);
      setTextStyle(prev => ({
        ...prev,
        fontSize: `${size}px`
      }));
    }
  };

  const handleAlign = (align: 'left' | 'center' | 'right') => {
    if (hasSelection) {
      applyRichTextFormat('align', align);
    } else {
      setTextStyle(prev => ({
        ...prev,
        textAlign: align
      }));
    }
  };
  
  // Handle font family change
  const handleFontFamilyChange = (family: string) => {
    if (hasSelection) {
      applyRichTextFormat('fontFamily', family);
    } else {
      setFontFamily(family);
      setTextStyle(prev => ({
        ...prev,
        fontFamily: family
      }));
    }
  };
  
  // Style to apply to text when editing and when displaying
  const appliedTextStyle = {
    fontFamily, // Apply font family directly
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
    nodeStyle.borderColor = '#1a192b';
    nodeStyle.borderWidth = '2px';
    nodeStyle.boxShadow = '0 0 0 2px rgba(26, 25, 43, 0.2)';
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
  const handleStyleBottom = { ...handleBaseStyle, bottom: '-7px' }; // Adjusted position
  const handleStyleLeft = { ...handleBaseStyle, left: '-7px' };     // Adjusted position
  const handleStyleRight = { ...handleBaseStyle, right: '-7px' };   // Adjusted position

  return (
    <div 
      ref={nodeRef}
      className={`p-4 rounded-xl shadow-md border border-gray-200 min-w-[200px] max-w-[500px] relative ${editingClass} ${selectedClass} handle-connection-node`}
      style={nodeStyle}
      onContextMenu={handleContextMenu}
      onClick={blockNodeDeselection}
      onMouseDown={(e) => {
        // Prevent dragging when in edit mode
        if (isAnyEditing) {
          e.stopPropagation();
        }
      }}
    >
      {isAnyEditing && (
        <div className="absolute -top-7 left-0 right-0 text-xs text-center bg-primary text-white py-1 px-2 rounded-t-md opacity-80">
          Node locked for editing
        </div>
      )}
      
      {/* Text Formatting Toolbar - shown only when editing content */}
      {isEditing && (
        <div className="toolbar-container" onMouseDown={blockNodeDeselection} onClick={blockNodeDeselection}>
          <TextFormatToolbar 
            onBold={handleBold}
            onItalic={handleItalic}
            onUnderline={handleUnderline}
            onTextColor={handleTextColor}
            onFontSize={handleFontSize}
            onAlign={handleAlign}
            onFontFamily={handleFontFamilyChange}
            currentFontSize={fontSize}
            currentFontFamily={fontFamily}
          />
        </div>
      )}
    
      {/* Node identifier - above the title */}
      <div className="mb-1 text-xs text-gray-400 font-medium">
        {isNameEditing ? (
          <input
            autoFocus
            className={`${inputStyles} py-0.5 px-1 text-xs`}
            value={name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            onClick={(e) => {
              e.stopPropagation();
              blockNodeDeselection(e);
            }}
          />
        ) : (
          <div
            className="py-0.5 px-1 hover:bg-gray-50 rounded cursor-text"
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
            <input
              autoFocus
              className={`${inputStyles} p-1 text-sm font-semibold`}
              value={title}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              onClick={(e) => {
                e.stopPropagation();
                blockNodeDeselection(e);
              }}
            />
          ) : (
            <div
              className="p-1 hover:bg-gray-50 rounded cursor-text"
              onDoubleClick={handleTitleDoubleClick}
              onClick={blockNodeDeselection}
            >
              {title}
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
            onSelect={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            onMouseUp={handleSelectionChange}
            style={appliedTextStyle}
            rows={1}
          />
        ) : (
          <div
            className="p-1 text-sm whitespace-normal break-words cursor-text text-gray-600 w-full overflow-wrap-anywhere formatted-content"
            onDoubleClick={handleDoubleClick}
            onClick={blockNodeDeselection}
            style={appliedTextStyle}
            dangerouslySetInnerHTML={{ __html: getFormattedText() }}
          />
        )}
        
        {/* Indicators showing applied formats */}
        {isEditing && richTextFormats.length > 0 && (
          <div className="text-xs text-gray-400 mt-1 flex gap-1 flex-wrap">
            {richTextFormats.map((format, index) => (
              <span key={index} className="px-1 bg-gray-100 rounded-full text-xs flex items-center gap-1">
                {format.format === 'bold' && <FaBold className="text-xs" />}
                {format.format === 'italic' && <FaItalic className="text-xs" />}
                {format.format === 'underline' && <FaUnderline className="text-xs" />}
                {format.format === 'color' && (
                  <span className="flex items-center">
                    <span 
                      className="w-2 h-2 rounded-full mr-1"
                      style={{ backgroundColor: format.value }}
                    ></span>
                    color
                  </span>
                )}
                {format.format === 'fontSize' && `${format.value}px`}
                {format.format === 'fontFamily' && format.value}
                {format.format === 'align' && `align-${format.value}`}
                <span>{text.substring(format.start, format.end).slice(0, 4)}{text.substring(format.start, format.end).length > 4 ? '...' : ''}</span>
              </span>
            ))}
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
    </div>
  );
};

export default memo(TextNode); 