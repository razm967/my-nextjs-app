import React, { useCallback } from 'react';
import { useFlowStore } from '../store/flowStore';
import { jsPDF } from 'jspdf';
import { ReactFlowInstance } from 'reactflow';
import KnifeTool from './knifeTool';
import html2canvas from 'html2canvas';

// Props interface for the Toolbar component
interface FlowToolbarProps {
  reactFlowInstance: ReactFlowInstance | null;
  isKnifeActive: boolean;
  onKnifeToggle: () => void;
}

// Toolbar component with node creation and control functions
const FlowToolbar: React.FC<FlowToolbarProps> = ({ 
  reactFlowInstance, 
  isKnifeActive, 
  onKnifeToggle 
}) => {
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

  // Handle adding a new title node
  const handleAddTitleNode = () => {
    // Calculate position for new node based on viewport center
    const position = reactFlowInstance 
      ? reactFlowInstance.project({ 
          x: window.innerWidth / 2, 
          y: window.innerHeight / 2 - 100 // Slightly above center
        })
      : { x: 100, y: 50 }; // Fallback position
    
    // Add a title node
    addNode('titleNode', position);
  };

  // First, add these helper functions to check if the flow is linear and trace it
  const isLinearFlow = useCallback(() => {
    if (!reactFlowInstance) return false;
    
    const allNodes = reactFlowInstance.getNodes();
    const allEdges = reactFlowInstance.getEdges();
    
    // Count incoming and outgoing edges for each node
    const nodeConnections = allNodes.reduce((acc, node) => {
      acc[node.id] = { incoming: 0, outgoing: 0 };
      return acc;
    }, {} as Record<string, { incoming: number; outgoing: number }>);
    
    // Count connections
    allEdges.forEach(edge => {
      if (nodeConnections[edge.source]) {
        nodeConnections[edge.source].outgoing++;
      }
      if (nodeConnections[edge.target]) {
        nodeConnections[edge.target].incoming++;
      }
    });
    
    // Find start node (0 incoming, 1 outgoing)
    const startNodes = Object.entries(nodeConnections).filter(
      ([_, conn]) => conn.incoming === 0 && conn.outgoing === 1
    );
    
    // Find end node (1 incoming, 0 outgoing)
    const endNodes = Object.entries(nodeConnections).filter(
      ([_, conn]) => conn.incoming === 1 && conn.outgoing === 0
    );
    
    // Find middle nodes (1 incoming, 1 outgoing)
    const middleNodes = Object.entries(nodeConnections).filter(
      ([_, conn]) => conn.incoming === 1 && conn.outgoing === 1
    );
    
    // Check if there's exactly one start and one end
    // And all other nodes are "pass-through" nodes
    const validLinearFlow = 
      startNodes.length === 1 && 
      endNodes.length === 1 && 
      (startNodes.length + endNodes.length + middleNodes.length) === allNodes.length;
    
    return validLinearFlow;
  }, [reactFlowInstance]);

  // Function to trace a linear flow from start to end
  const traceLinearFlow = useCallback(() => {
    if (!reactFlowInstance) return [];
    
    const allNodes = reactFlowInstance.getNodes();
    const allEdges = reactFlowInstance.getEdges();
    
    // Create a map for quick edge lookup
    const edgeMap = allEdges.reduce((acc, edge) => {
      if (!acc[edge.source]) acc[edge.source] = [];
      acc[edge.source].push(edge);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Create a map for quick node lookup
    const nodeMap = allNodes.reduce((acc, node) => {
      acc[node.id] = node;
      return acc;
    }, {} as Record<string, any>);
    
    // Find the start node (0 incoming, 1 outgoing)
    const nodeConnections = allNodes.reduce((acc, node) => {
      acc[node.id] = { incoming: 0, outgoing: 0 };
      return acc;
    }, {} as Record<string, { incoming: number; outgoing: number }>);
    
    // Count connections
    allEdges.forEach(edge => {
      if (nodeConnections[edge.source]) {
        nodeConnections[edge.source].outgoing++;
      }
      if (nodeConnections[edge.target]) {
        nodeConnections[edge.target].incoming++;
      }
    });
    
    // Find start node
    const startNodeEntry = Object.entries(nodeConnections).find(
      ([_, conn]) => conn.incoming === 0 && conn.outgoing === 1
    );
    
    if (!startNodeEntry) return [];
    
    const startNodeId = startNodeEntry[0];
    
    // Trace the path from start to end
    const orderedNodes = [];
    let currentNodeId = startNodeId;
    let maxIterations = allNodes.length; // Safety to prevent infinite loops
    
    while (currentNodeId && maxIterations > 0) {
      // Add current node to ordered list
      const currentNode = nodeMap[currentNodeId];
      if (currentNode) {
        orderedNodes.push(currentNode);
      }
      
      // Find next node
      const outgoingEdges = edgeMap[currentNodeId] || [];
      
      if (outgoingEdges.length === 0) {
        // We've reached the end
        break;
      }
      
      // Get the target of the first (and only) outgoing edge
      currentNodeId = outgoingEdges[0].target;
      maxIterations--;
    }
    
    return orderedNodes;
  }, [reactFlowInstance]);

  // Now, modify the existing exportToPDF function to use these helper functions
  const exportToPDF = useCallback(async () => {
    if (!reactFlowInstance) {
      alert('Flow instance not available');
      return;
    }
    
    // Check if flow is linear
    const linear = isLinearFlow();
    
    if (!linear) {
      alert("Flow must be linear to export (one start node, one end node, and a single path between them).");
      return;
    }
    
    try {
      // Get ordered nodes
      const orderedNodes = traceLinearFlow();
      
      if (orderedNodes.length === 0) {
        alert('No nodes found in the flow');
        return;
      }
      
      // Create a very simple PDF
      const pdf = new jsPDF();
      
      // Title
      pdf.setFontSize(18);
      pdf.text('Flow Document', 20, 20);
      
      let y = 40;
      
      // Add each node in order - super simple formatting
      for (let i = 0; i < orderedNodes.length; i++) {
        const node = orderedNodes[i];
        
        // Add new page if near bottom
        if (y > 250) {
          pdf.addPage();
          y = 20;
        }
        
        // Node number and title
        pdf.setFontSize(14);
        pdf.text(`Node ${i+1}: ${node.data.label || 'Untitled'}`, 20, y);
        y += 10;
        
        // Node content
        if (node.data.text) {
          pdf.setFontSize(12);
          // Simple text handling - limit width
          const wrappedText = pdf.splitTextToSize(node.data.text, 170);
          pdf.text(wrappedText, 20, y);
          y += wrappedText.length * 7 + 15; // Move down based on text height
        } else {
          y += 10;
        }
      }
      
      // Simple direct download using data URL 
      const pdfOutput = pdf.output('dataurlnewwindow');
      console.log("PDF export attempted");
      
    } catch (error) {
      console.error("PDF export error:", error);
      alert("Error exporting PDF. Check console for details.");
    }
  }, [reactFlowInstance, isLinearFlow, traceLinearFlow]);

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
          onClick={handleAddTitleNode}
          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
          title="Add a title (not included in exports)"
        >
          Add Title
        </button>
        
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
          onClick={exportToPDF}
          className="bg-tertiary text-white px-3 py-1 rounded hover:bg-opacity-80"
        >
          Export PDF
        </button>
      </div>
      
      <KnifeTool 
        active={isKnifeActive} 
        onToggle={onKnifeToggle} 
      />
    </div>
  );
};

export default FlowToolbar; 