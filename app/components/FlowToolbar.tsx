import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useFlowStore } from '../store/flowStore';
import { jsPDF } from 'jspdf';
import { ReactFlowInstance } from 'reactflow';
import KnifeTool from './knifeTool';
import { FiFileText, FiChevronDown, FiUnlock } from 'react-icons/fi';
import { LuGroup } from 'react-icons/lu';

// Props interface for the Toolbar component
interface FlowToolbarProps {
  reactFlowInstance: ReactFlowInstance | null;
  isKnifeActive: boolean;
  onKnifeToggle: () => void;
  onGroupNodes: () => void;
  onUngroupNodes: () => void;
}

// Toolbar component with node creation and control functions
const FlowToolbar: React.FC<FlowToolbarProps> = ({ 
  reactFlowInstance, 
  isKnifeActive, 
  onKnifeToggle,
  onGroupNodes,
  onUngroupNodes,
}) => {
  // Get addNode function from our store
  const addNode = useFlowStore((state) => state.addNode);

  // Add state for dropdown visibility
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Add refs for each dropdown container
  const fileDropdownRef = useRef<HTMLDivElement>(null);
  const nodesDropdownRef = useRef<HTMLDivElement>(null);
  const viewDropdownRef = useRef<HTMLDivElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);
  
  // Toggle dropdown visibility
  const toggleDropdown = (dropdown: string) => {
    if (activeDropdown === dropdown) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(dropdown);
    }
  };

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
    setActiveDropdown(null);
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
    setActiveDropdown(null);
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
    setActiveDropdown(null);
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

  // First, add a function to sort nodes by vertical position (top to bottom)
  const sortNodesByVerticalPosition = useCallback(() => {
    if (!reactFlowInstance) return [];
    
    const allNodes = reactFlowInstance.getNodes();
    
    // Sort nodes by Y position (top to bottom)
    return [...allNodes].sort((a, b) => a.position.y - b.position.y);
  }, [reactFlowInstance]);

  // Now, modify the exportToPDF function to handle unconnected nodes
  const exportToPDF = useCallback(async () => {
    if (!reactFlowInstance) {
      alert('Flow instance not available');
      return;
    }
    
    // Check if there are any edges at all
    const allEdges = reactFlowInstance.getEdges();
    const hasConnections = allEdges.length > 0;
    
    let orderedNodes = [];
    
    if (hasConnections) {
      // Check if flow is linear
      const linear = isLinearFlow();
      
      if (!linear) {
        alert("Flow must be linear to export (one start node, one end node, and a single path between them).");
        return;
      }
      
      // Get ordered nodes from the linear flow
      orderedNodes = traceLinearFlow();
    } else {
      // If no connections, sort nodes top-to-bottom
      orderedNodes = sortNodesByVerticalPosition();
    }
    
    if (orderedNodes.length === 0) {
      alert('No nodes found in the flow');
      return;
    }
    
    try {
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
      
      // Close dropdown after exporting
      setActiveDropdown(null);
    } catch (error) {
      console.error("PDF export error:", error);
      alert("Error exporting PDF. Check console for details.");
    }
  }, [reactFlowInstance, isLinearFlow, traceLinearFlow, sortNodesByVerticalPosition]);

  // Reset the viewport to fit all nodes
  const handleFitView = () => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 });
    }
    setActiveDropdown(null);
  };

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if no dropdown is active
      if (!activeDropdown) return;
      
      // Get the relevant dropdown ref based on which dropdown is active
      let currentDropdownRef = null;
      switch (activeDropdown) {
        case 'file': currentDropdownRef = fileDropdownRef; break;
        case 'nodes': currentDropdownRef = nodesDropdownRef; break;
        case 'view': currentDropdownRef = viewDropdownRef; break;
        case 'tools': currentDropdownRef = toolsDropdownRef; break;
      }
      
      // Check if click was outside the dropdown
      if (currentDropdownRef && 
          currentDropdownRef.current && 
          !currentDropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  return (
    <div className="flex items-center bg-black text-white h-8 px-4">
      {/* Dropdown for File */}
      <div className="relative mr-4" ref={fileDropdownRef}>
        <button 
          className="flex items-center hover:text-gray-300"
          onClick={() => toggleDropdown('file')}
        >
          File <FiChevronDown className={`ml-1 transition-transform ${activeDropdown === 'file' ? 'rotate-180' : ''}`} size={14} />
        </button>
        {activeDropdown === 'file' && (
          <div className="absolute top-8 left-0 bg-gray-800 w-40 shadow-lg rounded z-10">
            <button 
              className="flex items-center px-4 py-2 w-full text-left hover:bg-gray-700"
              onClick={exportToPDF}
            >
              <FiFileText className="mr-2" size={14} />
              Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Dropdown for Nodes */}
      <div className="relative mr-4" ref={nodesDropdownRef}>
        <button 
          className="flex items-center hover:text-gray-300"
          onClick={() => toggleDropdown('nodes')}
        >
          Nodes <FiChevronDown className={`ml-1 transition-transform ${activeDropdown === 'nodes' ? 'rotate-180' : ''}`} size={14} />
        </button>
        {activeDropdown === 'nodes' && (
          <div className="absolute top-8 left-0 bg-gray-800 w-40 shadow-lg rounded z-10">
            <button 
              className="px-4 py-2 w-full text-left hover:bg-gray-700"
              onClick={handleAddTitleNode}
            >
              Title Node
            </button>
            <button 
              className="px-4 py-2 w-full text-left hover:bg-gray-700"
              onClick={handleAddTextNode}
            >
              Text Node
            </button>
            <button 
              className="px-4 py-2 w-full text-left hover:bg-gray-700"
              onClick={handleAddConnectorNode}
            >
              Connector Node
            </button>
          </div>
        )}
      </div>

      {/* Dropdown for View */}
      <div className="relative mr-4" ref={viewDropdownRef}>
        <button 
          className="flex items-center hover:text-gray-300"
          onClick={() => toggleDropdown('view')}
        >
          View <FiChevronDown className={`ml-1 transition-transform ${activeDropdown === 'view' ? 'rotate-180' : ''}`} size={14} />
        </button>
        {activeDropdown === 'view' && (
          <div className="absolute top-8 left-0 bg-gray-800 w-40 shadow-lg rounded z-10">
            <button 
              className="px-4 py-2 w-full text-left hover:bg-gray-700"
              onClick={handleFitView}
            >
              Fit View
            </button>
          </div>
        )}
      </div>

      {/* Tools dropdown */}
      <div className="relative mr-4" ref={toolsDropdownRef}>
        <button 
          className="flex items-center hover:text-gray-300"
          onClick={() => toggleDropdown('tools')}
        >
          Tools <FiChevronDown className={`ml-1 transition-transform ${activeDropdown === 'tools' ? 'rotate-180' : ''}`} size={14} />
        </button>
        {activeDropdown === 'tools' && (
          <div className="absolute top-8 left-0 bg-gray-800 w-40 shadow-lg rounded z-10">
            <button 
              className="flex items-center px-4 py-2 w-full text-left hover:bg-gray-700"
              onClick={() => {
                onGroupNodes();
                setActiveDropdown(null);
              }}
            >
              {/* dont change size */}
              <LuGroup  className="mr-2" size={45} /> 
              Group Nodes (Ctrl+G)
            </button>
            <button 
              className="flex items-center px-4 py-2 w-full text-left hover:bg-gray-700"
              onClick={() => {
                onUngroupNodes();
                setActiveDropdown(null);
              }}
            >
              {/*make toolbar icons bigger than  14*/}
              <FiUnlock className="mr-2" size={30} />
              Ungroup (Ctrl+G)
            </button>
          </div>
        )}
      </div>

      {/* Keep KnifeTool on the right side */}
      <div className="ml-auto">
        <KnifeTool 
          active={isKnifeActive} 
          onToggle={onKnifeToggle} 
        />
      </div>
    </div>
  );
};

export default FlowToolbar; 