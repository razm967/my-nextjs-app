import { memo, useState, useRef, CSSProperties } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useFlowStore } from '../../store/flowStore';

// Connector node component - specialized for connecting nodes easily
const ConnectorNode = ({ id, data, style }: NodeProps & { style?: CSSProperties }) => {
  // Get flow store functions
  const deleteNode = useFlowStore((state) => state.deleteNode);
  
  // Reference to the node element
  const nodeRef = useRef<HTMLDivElement>(null);
  
  // Hover state for visual feedback
  const [isHovered, setIsHovered] = useState(false);
  
  // Default node style with enhanced connection focus
  const nodeStyle = {
    borderWidth: '1px', 
    borderColor: isHovered ? '#4f46e5' : '#e2e8f0',
    backgroundColor: isHovered ? 'rgba(79, 70, 229, 0.1)' : '#ffffff',
    boxShadow: isHovered ? 
      '0 0 0 2px rgba(79, 70, 229, 0.3), 0 4px 6px -1px rgba(0, 0, 0, 0.1)' :
      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    ...style, // Apply any styles passed from ReactFlow
  };
  
  // Handle base style with improved visibility for connector nodes
  const handleBaseStyle = {
    width: '16px',                   // Larger than normal nodes
    height: '16px',                  // Larger than normal nodes
    background: '#4f46e5',           // Distinct color
    borderRadius: '50%',
    border: '2px solid white',
    transition: 'all 0.2s ease',
    opacity: isHovered ? 1 : 0.8,    // More visible on hover
    cursor: 'crosshair',
  };
  
  // Double-click handler to delete the connector node
  const handleDoubleClick = () => {
    deleteNode(id);
  };
  
  return (
    <div 
      ref={nodeRef}
      className="p-2 rounded-full flex items-center justify-center min-w-[40px] min-h-[40px] connector-node"
      style={nodeStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
    >
      {/* Tooltip on hover */}
      {isHovered && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
          Double-click to remove
        </div>
      )}
      
      {/* All handles are both source and target for maximum flexibility */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{...handleBaseStyle, top: '-8px'}}
        className="connection-handle connector-handle"
      />
      
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        style={{...handleBaseStyle, top: '-8px'}}
        className="connection-handle connector-handle"
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{...handleBaseStyle, bottom: '-8px'}}
        className="connection-handle connector-handle"
      />
      
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        style={{...handleBaseStyle, bottom: '-8px'}}
        className="connection-handle connector-handle"
      />
      
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{...handleBaseStyle, left: '-8px'}}
        className="connection-handle connector-handle"
      />
      
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        style={{...handleBaseStyle, left: '-8px'}}
        className="connection-handle connector-handle"
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{...handleBaseStyle, right: '-8px'}}
        className="connection-handle connector-handle"
      />
      
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        style={{...handleBaseStyle, right: '-8px'}}
        className="connection-handle connector-handle"
      />
      
      {/* Center content - plus symbol */}
      <div className="w-6 h-6 flex items-center justify-center text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
    </div>
  );
};

export default memo(ConnectorNode); 