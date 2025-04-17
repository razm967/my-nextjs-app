import { memo, useState, useRef, CSSProperties } from 'react';
import { NodeProps } from 'reactflow';
import { useFlowStore } from '../../store/flowStore';
import { FiX } from 'react-icons/fi';

const TitleNode = ({ id, data, selected }: NodeProps) => {
  // Get deleteNode function from the store
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const updateNodeText = useFlowStore((state) => state.updateNodeText);
  
  // State for editing mode
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text || 'Title Text');
  
  // References
  const nodeRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // State for node hover
  const [isHovered, setIsHovered] = useState(false);
  
  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };
  
  // Handle node deletion
  const handleDeleteNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    deleteNode(id);
  };
  
  // Handle blur to exit edit mode and save content
  const handleBlur = () => {
    setIsEditing(false);
    updateNodeText(id, text, '', '', {}, '28', 'Canva Sans');
  };
  
  // Default styles for the title node
  const nodeStyle: CSSProperties = {
    background: '#FFF9C4', // Light yellow background
    padding: '16px 24px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    borderWidth: '1px',
    borderColor: '#FFD54F',
    borderStyle: 'solid',
    width: 'auto',
    minWidth: '250px',
    maxWidth: '600px',
    cursor: 'default',
    transition: 'all 0.2s ease',
    position: 'relative'
  };
  
  // Adjust style when selected
  if (selected) {
    nodeStyle.boxShadow = '0 0 0 2px #FFB300, 0 4px 12px rgba(0, 0, 0, 0.15)';
    nodeStyle.borderColor = '#FFB300';
  }
  
  // Style for the text
  const textStyle: CSSProperties = {
    fontFamily: 'Canva Sans, sans-serif',
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    width: '100%',
    textAlign: 'center',
    lineHeight: '1.3',
    position: 'relative'
  };
  
  // Block event propagation to prevent node deselection
  const blockNodeDeselection = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  // Handle double click to enter edit mode
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsEditing(true);
  };
  
  // Handle key press for content (Enter to save, Escape to cancel)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
      updateNodeText(id, text, '', '', {}, '28', 'Canva Sans');
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setText(data.text || 'Title Text'); // Reset to original text
    }
    
    // Prevent propagation to avoid triggering ReactFlow shortcuts
    e.stopPropagation();
  };
  
  // Add a special data attribute for PDF export filtering
  const nodeData = {
    'data-node-type': 'title',
    'data-exclude-from-export': 'true'
  };
  
  return (
    <div
      ref={nodeRef}
      className="title-node"
      style={nodeStyle}
      onClick={blockNodeDeselection}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
      {...nodeData}
    >
      {/* Delete button - only show when hovering or selected */}
      {!isEditing && (isHovered || selected) && (
        <div className="absolute top-2 right-2 z-10">
          <button
            className="text-gray-500 hover:text-red-500 transition-colors p-1"
            onClick={handleDeleteNode}
            title="Delete title"
          >
            <FiX size={18} />
          </button>
        </div>
      )}
    
      {/* Title content */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          autoFocus
          className="w-full bg-transparent border-none focus:outline-none resize-none overflow-hidden text-center py-2"
          value={text}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onClick={blockNodeDeselection}
          style={textStyle}
          rows={Math.max(1, text.split('\n').length)}
        />
      ) : (
        <div 
          className="whitespace-pre-wrap break-words"
          style={textStyle}
        >
          {text}
        </div>
      )}
      
      {/* Indicator showing this is a title */}
      <div className="absolute bottom-2 right-2 text-xs text-amber-600 font-medium">
        Title
      </div>
    </div>
  );
};

export default memo(TitleNode);
