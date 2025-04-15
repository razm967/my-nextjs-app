import React from 'react';
import { useFlowStore } from '../store/flowStore';
import { jsPDF } from 'jspdf';
import { ReactFlowInstance } from 'reactflow';

// Props interface for the Toolbar component
interface FlowToolbarProps {
  reactFlowInstance: ReactFlowInstance | null;
}

// Toolbar component with node creation and control functions
const FlowToolbar: React.FC<FlowToolbarProps> = ({ reactFlowInstance }) => {
  // Get addNode function from our store
  const addNode = useFlowStore((state) => state.addNode);

  // Handle adding a new text node
  const handleAddTextNode = () => {
    // Calculate position for new node based on viewport center
    const position = reactFlowInstance 
      ? reactFlowInstance.project({ 
          x: window.innerWidth / 2, 
          y: window.innerHeight / 2 
        })
      : { x: 100, y: 100 }; // Fallback position
    
    addNode('textNode', position);
  };

  // Handle adding a new connector node
  const handleAddConnectorNode = () => {
    // Calculate position for new node based on viewport center
    const position = reactFlowInstance 
      ? reactFlowInstance.project({ 
          x: window.innerWidth / 2, 
          y: window.innerHeight / 2 + 100 // Slightly below center
        })
      : { x: 100, y: 200 }; // Fallback position
    
    addNode('connectorNode', position);
  };

  // Export the current flow as PDF
  const handleExportPDF = () => {
    if (!reactFlowInstance) return;
    
    // Create new PDF document
    const pdf = new jsPDF('landscape');
    
    // Capture the flow as a data URL
    const dataUrl = reactFlowInstance.toObject();
    
    // Add title
    pdf.setFontSize(20);
    pdf.text('Flow Whiteboard Export', 15, 15);
    
    // Add nodes as text representation
    pdf.setFontSize(12);
    let yPos = 30;
    
    dataUrl.nodes.forEach((node, idx) => {
      pdf.text(`Node ${idx + 1}: ${node.data.label} - ${node.data.text?.substring(0, 50) || ''}`, 15, yPos);
      yPos += 10;
    });
    
    // Save the PDF
    pdf.save('flow-whiteboard.pdf');
  };

  // Reset the viewport to fit all nodes
  const handleFitView = () => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 });
    }
  };

  return (
    <div className="flex items-center bg-white border-b border-gray-200 p-2 shadow-sm">
      <div className="text-lg font-bold flex-1">Flow Whiteboard</div>
      
      <div className="flex space-x-2">
        <button 
          onClick={handleAddTextNode}
          className="bg-secondary text-white px-3 py-1 rounded hover:bg-opacity-80"
        >
          Add Text Node
        </button>
        
        <button 
          onClick={handleAddConnectorNode}
          className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-opacity-80 flex items-center"
          title="Add a connector node for easier connections"
        >
          <svg className="mr-1" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Connector
        </button>
        
        <button 
          onClick={handleFitView}
          className="bg-primary text-white px-3 py-1 rounded hover:bg-opacity-80"
        >
          Fit View
        </button>
        
        <button 
          onClick={handleExportPDF}
          className="bg-tertiary text-white px-3 py-1 rounded hover:bg-opacity-80"
        >
          Export PDF
        </button>
      </div>
    </div>
  );
};

export default FlowToolbar; 