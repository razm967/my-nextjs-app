import React from 'react';
import { useFlowStore } from '../store/flowStore';
import { useReactFlow } from 'reactflow';

// Props interface for the ContextMenu component
interface ContextMenuProps {
  id: string;
  top: number;
  left: number;
  onClose: () => void;
}

// Context menu for node operations
const ContextMenu: React.FC<ContextMenuProps> = ({ id, top, left, onClose }) => {
  // Get the flowStore functions
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const nodes = useFlowStore((state) => state.nodes);
  const addNode = useFlowStore((state) => state.addNode);
  
  // Get ReactFlow instance for position calculations
  const reactFlowInstance = useReactFlow();
  
  // Handle deletion of the node
  const handleDelete = () => {
    deleteNode(id);
    onClose();
  };
  
  // Handle duplicating the node
  const handleDuplicate = () => {
    // Find the node to duplicate
    const nodeToDuplicate = nodes.find((node) => node.id === id);
    
    if (nodeToDuplicate) {
      // Calculate a slightly offset position for the new node
      const position = {
        x: nodeToDuplicate.position.x + 50,
        y: nodeToDuplicate.position.y + 50
      };
      
      // Add new node with the same type
      const nodeType = nodeToDuplicate.type || 'textNode';
      addNode(nodeType, position);
      
      // Get the ID of the newly added node (last one in array)
      const newNodes = useFlowStore.getState().nodes;
      const newNodeId = newNodes[newNodes.length - 1].id;
      
      // Copy the data from the original node to the new one
      useFlowStore.getState().updateNodeText(
        newNodeId,
        nodeToDuplicate.data.text,
        nodeToDuplicate.data.label + ' (copy)',
        nodeToDuplicate.data.name ? nodeToDuplicate.data.name + ' (copy)' : ''
      );
    }
    
    onClose();
  };
  
  // Handle making the node a different color
  const handleChangeColor = (color: string) => {
    // Find the node
    const targetNode = nodes.find((node) => node.id === id);
    
    if (targetNode) {
      // Update node style
      const updatedNodes = nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            style: { ...node.style, backgroundColor: color }
          };
        }
        return node;
      });
      
      // Update nodes in store
      useFlowStore.setState({ nodes: updatedNodes });
    }
    
    onClose();
  };
  
  return (
    <div 
      className="absolute z-10 bg-white rounded shadow-lg border border-gray-200 py-1 min-w-[150px]"
      style={{ top, left }}
    >
      <div 
        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
        onClick={handleDuplicate}
      >
        <span className="text-gray-700">Duplicate</span>
      </div>
      
      <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
        <span className="text-gray-700 mb-1 block text-xs font-medium">Color</span>
        <div className="flex space-x-1">
          <div 
            className="w-5 h-5 rounded-full bg-white border border-gray-300 cursor-pointer"
            onClick={() => handleChangeColor('#ffffff')}
          ></div>
          <div 
            className="w-5 h-5 rounded-full bg-blue-100 border border-gray-300 cursor-pointer"
            onClick={() => handleChangeColor('#dbeafe')}
          ></div>
          <div 
            className="w-5 h-5 rounded-full bg-green-100 border border-gray-300 cursor-pointer"
            onClick={() => handleChangeColor('#dcfce7')}
          ></div>
          <div 
            className="w-5 h-5 rounded-full bg-yellow-100 border border-gray-300 cursor-pointer"
            onClick={() => handleChangeColor('#fef9c3')}
          ></div>
          <div 
            className="w-5 h-5 rounded-full bg-red-100 border border-gray-300 cursor-pointer"
            onClick={() => handleChangeColor('#fee2e2')}
          ></div>
        </div>
      </div>
      
      <div 
        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center text-red-600"
        onClick={handleDelete}
      >
        <span>Delete</span>
      </div>
    </div>
  );
};

export default ContextMenu; 