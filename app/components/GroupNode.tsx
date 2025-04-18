import React, { useCallback, useEffect } from 'react';
import { NodeProps, useReactFlow } from 'reactflow';
import { useFlowStore } from '../store/flowStore';
import { FiUnlock } from 'react-icons/fi';

// Custom node for grouping other nodes
const GroupNode: React.FC<NodeProps> = ({ data, id, selected }) => {
  // Access to the flow instance
  const { getNodes, setNodes } = useReactFlow();
  
  // Access to the store to update node data
  const updateNodeText = useFlowStore(state => state.updateNodeText);
  const deleteNode = useFlowStore(state => state.deleteNode);
  
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
  
  // Track child node movements
  useEffect(() => {
    // Ensure this node is non-draggable
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === id) {
          return {
            ...node,
            draggable: false,
          };
        }
        return node;
      })
    );
    
    // Track children movement
    const updateGroupBounds = () => {
      const nodes = getNodes();
      const childNodes = nodes.filter(node => node.data?.groupId === id);
      
      if (childNodes.length === 0) return;
      
      // Calculate the bounding box
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
      
      // Update the group node
      setNodes(nodes => 
        nodes.map(node => {
          if (node.id === id) {
            return {
              ...node,
              position: {
                x: boundingBox.left,
                y: boundingBox.top
              },
              data: {
                ...node.data,
                width: boundingBox.right - boundingBox.left,
                height: boundingBox.bottom - boundingBox.top
              },
              zIndex: -1 // Make sure it's below other nodes
            };
          }
          return node;
        })
      );
    };
    
    // Set up an interval to check for changes
    const intervalId = setInterval(updateGroupBounds, 100);
    
    return () => clearInterval(intervalId);
  }, [id, getNodes, setNodes]);
  
  return (
    <div
      style={{
        width: data.width || 200,
        height: data.height || 100,
        backgroundColor: 'transparent',
        pointerEvents: 'none', // Make the whole node transparent to mouse events
        position: 'relative'
      }}
    >
      {/* Border that doesn't interfere with child nodes */}
      <div 
        className={`absolute top-0 left-0 w-full h-full border-2 ${selected ? 'border-blue-500' : 'border-black border-dashed'} rounded-md`}
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Label area */}
      <div 
        className="absolute -top-7 left-0 flex items-center bg-black text-white px-2 py-0.5 text-xs rounded-t"
        style={{ pointerEvents: 'auto', zIndex: 10 }}
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