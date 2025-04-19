import React, { useCallback, useEffect, useRef } from 'react';
import { NodeProps, useReactFlow } from 'reactflow';
import { useFlowStore } from '../store/flowStore';
import { FiUnlock } from 'react-icons/fi';

// Custom node for grouping other nodes
const GroupNode: React.FC<NodeProps> = ({ data, id, selected, xPos, yPos }) => {
  // Access to the flow instance
  const { getNodes, setNodes } = useReactFlow();
  
  // Access to the store to update node data
  const updateNodeText = useFlowStore(state => state.updateNodeText);
  const deleteNode = useFlowStore(state => state.deleteNode);
  
  // Reference to store the previous position
  const prevPositionRef = useRef({ x: 0, y: 0 });
  
  // Handle label change
  const handleLabelChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeText(id, '', event.target.value, '', {}, '14', 'Canva Sans');
  }, [id, updateNodeText]);
  
  // Handle ungrouping
  const handleUngroup = useCallback(() => {
    // Get all nodes in this group
    const nodes = getNodes();
    const childNodes = nodes.filter(node => node.data?.groupId === id);
    
    // Remove group ID from all child nodes
    setNodes(nodes.map(node => {
      if (node.data?.groupId === id) {
        const { groupId, ...restData } = node.data;
        return {
          ...node,
          data: restData
        };
      }
      return node;
    }));
    
    // Delete the group node
    setTimeout(() => deleteNode(id), 50);
  }, [id, getNodes, setNodes, deleteNode]);
  
  // Track and handle node position changes to move children
  useEffect(() => {
    // This effect will run when the position changes (xPos/yPos update)
    if (xPos === undefined || yPos === undefined) {
      // Initialize the position reference on first render
      const nodes = getNodes();
      const thisNode = nodes.find(node => node.id === id);
      if (thisNode) {
        prevPositionRef.current = { ...thisNode.position };
      }
      return;
    }
    
    // Calculate the delta movement since last position
    const currentPos = { x: xPos, y: yPos };
    const deltaX = currentPos.x - prevPositionRef.current.x;
    const deltaY = currentPos.y - prevPositionRef.current.y;
    
    // Only process if there's actual movement
    if (deltaX !== 0 || deltaY !== 0) {
      // Update children positions with the same delta
      setNodes(nodes => 
        nodes.map(node => {
          // Move children along with parent
          if (node.data?.groupId === id) {
            return {
              ...node,
              position: {
                x: node.position.x + deltaX,
                y: node.position.y + deltaY
              }
            };
          }
          return node;
        })
      );
      
      // Update the reference to current position
      prevPositionRef.current = currentPos;
    }
  }, [id, xPos, yPos, getNodes, setNodes]);
  
  // Set up the node to be draggable and track child movements
  useEffect(() => {
    // Make the group node draggable
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === id) {
          return {
            ...node,
            draggable: true,
            zIndex: -1 // Place below children so they remain interactable
          };
        }
        return node;
      })
    );
    
    // Function to update group size based on children positions
    const updateGroupBounds = () => {
      const nodes = getNodes();
      const thisNode = nodes.find(node => node.id === id);
      const childNodes = nodes.filter(node => node.data?.groupId === id);
      
      // Skip update if no children or if currently being dragged
      if (childNodes.length === 0 || (thisNode && thisNode.dragging)) return;
      
      // Calculate the bounding box of all children
      const positions = childNodes.map(node => ({
        left: node.position.x,
        right: node.position.x + (node.width || 200),
        top: node.position.y,
        bottom: node.position.y + (node.height || 100)
      }));
      
      const boundingBox = {
        left: Math.min(...positions.map(p => p.left)),
        right: Math.max(...positions.map(p => p.right)),
        top: Math.min(...positions.map(p => p.top)),
        bottom: Math.max(...positions.map(p => p.bottom))
      };
      
      // Add padding
      const padding = 20;
      boundingBox.left -= padding;
      boundingBox.right += padding;
      boundingBox.top -= padding;
      boundingBox.bottom += padding;
      
      // Only update size and position if not being dragged
      if (!thisNode?.dragging) {
        setNodes(nodes => 
          nodes.map(node => {
            if (node.id === id) {
              const newPos = {
                x: boundingBox.left,
                y: boundingBox.top
              };
              
              // Update the position reference
              prevPositionRef.current = newPos;
              
              return {
                ...node,
                position: newPos,
                data: {
                  ...node.data,
                  width: boundingBox.right - boundingBox.left,
                  height: boundingBox.bottom - boundingBox.top
                }
              };
            }
            return node;
          })
        );
      }
    };
    
    // Update group bounds periodically, but not during drag
    const intervalId = setInterval(updateGroupBounds, 100);
    
    return () => clearInterval(intervalId);
  }, [id, getNodes, setNodes]);
  
  return (
    <div
      style={{
        width: data.width || 200,
        height: data.height || 100,
        backgroundColor: 'transparent',
        pointerEvents: 'none', // Make the main container transparent to clicks
        position: 'relative'
      }}
    >
      {/* Frame border with move cursor indicator */}
      <div 
        className={`absolute top-0 left-0 w-full h-full border-2 ${selected ? 'border-blue-500' : 'border-black border-dashed'} rounded-md`}
        style={{ 
          pointerEvents: 'auto',  // Only the border receives clicks
          cursor: 'move',
          background: 'transparent',
          // Create border-only hitbox by making invisible borders
          borderTopWidth: '10px',    
          borderBottomWidth: '10px', 
          borderLeftWidth: '10px',   
          borderRightWidth: '10px',  
          // Make border transparent except the visible 2px
          borderColor: 'rgba(0,0,0,0.01)',
          boxSizing: 'border-box',
          // Inset the visible border
          outline: `2px ${selected ? 'solid #3b82f6' : 'dashed black'}`,
          outlineOffset: '-10px',
          borderRadius: '6px'
        }}
      />
      
      {/* Label area */}
      <div 
        className="absolute -top-7 left-0 flex items-center bg-black text-white px-2 py-0.5 text-xs rounded-t"
        style={{ pointerEvents: 'auto', zIndex: 10 }}
        onClick={e => e.stopPropagation()}
      >
        <input
          className="bg-black text-white outline-none"
          value={data.label || 'Group'}
          onChange={handleLabelChange}
          onClick={e => e.stopPropagation()}
          style={{ width: Math.max(100, (data.label?.length || 5) * 8) }}
        />
        
        <button 
          className="ml-2 p-1 hover:bg-gray-700 rounded"
          onClick={(e) => {
            e.stopPropagation();
            handleUngroup();
          }}
          title="Ungroup (Ctrl+G)"
        >
          <FiUnlock size={14} />
        </button>
      </div>
    </div>
  );
};

export default GroupNode; 