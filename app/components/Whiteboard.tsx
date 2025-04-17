// In Whiteboard.tsx
import React, { useCallback, useState, useRef, KeyboardEvent, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  ReactFlowInstance,
  ConnectionLineType,
  BackgroundVariant,
  Panel,
  PanOnScrollMode,
} from 'reactflow';
import { useFlowStore } from '../store/flowStore';
import nodeTypes from './NodeTypes';
import FlowToolbar from './FlowToolbar';
import KnifeTool from './knifeTool';

// Main Whiteboard component
const Whiteboard: React.FC = () => {
  // Get state and functions from our flow store
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    deleteNode,
  } = useFlowStore();

  // Reference to the ReactFlow instance
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // State to track if shift key is pressed
  const [shiftPressed, setShiftPressed] = useState(false);
  
  // State to track if any node is in edit mode
  const [isNodeEditing, setIsNodeEditing] = useState(false);
  
  // State for knife tool activation
  const [isKnifeActive, setIsKnifeActive] = useState(false);
  
  // State to store copied node data
  const [copiedNodes, setCopiedNodes] = useState<any[]>([]);
  
  // Ref to store the ReactFlow wrapper element
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Add state to track mouse position
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Add a state to track if we're in cut mode (nodes selected for moving)
  const [cutMode, setCutMode] = useState(false);

  // Toggle knife tool activation
  const toggleKnifeTool = useCallback(() => {
    setIsKnifeActive(prev => !prev);
  }, []);

  // Set the ReactFlow instance when initialized
  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);
  
  // Copy selected nodes to clipboard
  const copySelectedNodes = useCallback(() => {
    if (!reactFlowInstance) return;
    
    const selectedNodes = nodes.filter(node => node.selected);
    
    if (selectedNodes.length === 0) return;
    
    // Store nodes in state
    setCopiedNodes(selectedNodes);
    
    // Also copy text to system clipboard if there's only one node
    if (selectedNodes.length === 1) {
      const node = selectedNodes[0];
      let clipText = '';
      
      if (node.data.label) clipText += node.data.label + '\n\n';
      if (node.data.name) clipText += node.data.name + '\n';
      if (node.data.text) clipText += node.data.text;
      
      navigator.clipboard.writeText(clipText.trim())
        .catch(err => console.error('Failed to copy text: ', err));
    }
    
    console.log('Copied nodes:', selectedNodes.length);
  }, [reactFlowInstance, nodes]);
  
  // Add a function to update mouse position (call this in the component)
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!reactFlowInstance || !reactFlowWrapper.current) return;
    
    // Get the bounds of the flow container
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    
    // Calculate the relative position in the flow
    const position = reactFlowInstance.project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    });
    
    // Update the mouse position state
    setMousePosition(position);
  }, [reactFlowInstance]);
  
  // When we enter cut mode, we'll mark the selected nodes
  const cutSelectedNodes = useCallback(() => {
    if (!reactFlowInstance) return;
    
    const selectedNodes = nodes.filter(node => node.selected);
    
    if (selectedNodes.length === 0) return;
    
    // Store nodes in state for later paste
    setCopiedNodes(selectedNodes);
    
    // Mark that we're in cut mode (rather than copy mode)
    setCutMode(true);
    
    // Update nodes directly using ReactFlow's setNodes
    reactFlowInstance.setNodes(nds => 
      nds.map(node => {
        if (node.selected) {
          // Modify the node data to include markedForCut
          return {
            ...node,
            data: {
              ...node.data,
              markedForCut: true
            }
          };
        }
        return node;
      })
    );
    
    console.log('Cut nodes marked using setNodes');
  }, [reactFlowInstance, nodes]);
  
  // When pasting or canceling cut mode, remove the indicators
  const clearCutIndicators = useCallback(() => {
    if (cutMode) {
      // Find nodes that are marked for cut
      const markedNodes = nodes.filter(node => node.data?.markedForCut);
      
      // Clear the indicators
      if (markedNodes.length > 0) {
        onNodesChange(
          markedNodes.map(node => ({
            id: node.id,
            type: 'select',
            selected: true,
            data: { ...node.data, markedForCut: false }
          }))
        );
      }
    }
  }, [nodes, cutMode, onNodesChange]);

  // Add escape key handler to cancel cut mode
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && cutMode) {
      clearCutIndicators();
      setCutMode(false);
    }
  }, [cutMode, clearCutIndicators]);

  // Update the paste function to handle both copy and cut operations
  const pasteNodes = useCallback(() => {
    if (!reactFlowInstance || copiedNodes.length === 0) return;
    
    // Calculate the center point of the copied nodes
    let centerX = 0;
    let centerY = 0;
    
    copiedNodes.forEach(node => {
      centerX += node.position.x;
      centerY += node.position.y;
    });
    
    centerX /= copiedNodes.length;
    centerY /= copiedNodes.length;
    
    // Calculate offset from center to mouse position
    const offsetX = mousePosition.x - centerX;
    const offsetY = mousePosition.y - centerY;
    
    // If we're in cut mode, first delete the original nodes
    if (cutMode) {
      // Clear visual indicators before deletion
      clearCutIndicators();
      
      copiedNodes.forEach(node => {
        deleteNode(node.id);
      });
      setCutMode(false); // Reset cut mode after pasting
    }
    
    // Now create new nodes at the cursor position
    copiedNodes.forEach(copiedNode => {
      // Position relative to mouse cursor
      const position = {
        x: copiedNode.position.x + offsetX,
        y: copiedNode.position.y + offsetY
      };
      
      // Add a new node with copied data
      addNode(copiedNode.type || 'textNode', position);
      
      // Get the ID of the newly added node (last one in nodes array)
      const newNodes = useFlowStore.getState().nodes;
      const newNodeId = newNodes[newNodes.length - 1].id;
      
      // Update the node data with the copied content (without the markedForCut flag)
      const { markedForCut, ...cleanData } = copiedNode.data;
      
      useFlowStore.getState().updateNodeText(
        newNodeId,
        cleanData.text || '',
        cleanData.label || '',
        cleanData.name || '',
        cleanData.textStyle || {},
        cleanData.fontSize || '14',
        cleanData.fontFamily || 'Canva Sans'
      );
    });
    
    console.log('Pasted nodes:', copiedNodes.length, 'at position:', mousePosition);
  }, [reactFlowInstance, copiedNodes, addNode, mousePosition, cutMode, deleteNode, clearCutIndicators]);
  
  // Duplicate selected nodes immediately
  const duplicateSelectedNodes = useCallback(() => {
    if (!reactFlowInstance) return;
    
    const selectedNodes = nodes.filter(node => node.selected);
    
    if (selectedNodes.length === 0) return;
    
    // Store in state for immediate paste
    setCopiedNodes(selectedNodes);
    
    // Then paste
    setTimeout(() => {
      pasteNodes();
    }, 0);
    
    console.log('Duplicated nodes:', selectedNodes.length);
  }, [reactFlowInstance, nodes, pasteNodes]);
  
  // Update the handleKeyDown to include the Escape key handling
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      setShiftPressed(true);
    } else if (event.key === 'Escape') {
      handleEscapeKey(event);
    }
    
    // Only process shortcuts if we're not in edit mode
    if (isNodeEditing) return;
    
    // Check for keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'c': // Copy
          event.preventDefault();
          copySelectedNodes();
          break;
        case 'v': // Paste
          event.preventDefault();
          pasteNodes();
          break;
        case 'x': // Cut
          event.preventDefault();
          cutSelectedNodes();
          break;
        case 'd': // Duplicate
          event.preventDefault();
          duplicateSelectedNodes();
          break;
      }
    }
  }, [
    isNodeEditing, 
    copySelectedNodes, 
    pasteNodes, 
    cutSelectedNodes, 
    duplicateSelectedNodes,
    handleEscapeKey
  ]);
  
  // Handle key up events
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      setShiftPressed(false);
    }
  }, []);

  // Check if any node has editing class (indicates editing mode)
  useEffect(() => {
    const checkForEditingNodes = () => {
      const editingNodes = document.querySelectorAll('.node-editing');
      setIsNodeEditing(editingNodes.length > 0);
    };

    // Check initially
    checkForEditingNodes();

    // Set up a mutation observer to detect changes to the DOM
    const observer = new MutationObserver(checkForEditingNodes);
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    // Clean up
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      className="h-screen w-full flex flex-col"
      ref={reactFlowWrapper}
      onKeyDown={handleKeyDown as any}
      onKeyUp={handleKeyUp as any}
      onMouseMove={handleMouseMove}
      tabIndex={0} // Make div focusable to capture keyboard events
    >
      <ReactFlowProvider>
        <FlowToolbar 
          reactFlowInstance={reactFlowInstance} 
          isKnifeActive={isKnifeActive}
          onKnifeToggle={toggleKnifeTool}
        />
        
        <div className="flex-grow relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onInit={onInit}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            attributionPosition="bottom-right"
            connectionLineStyle={{ stroke: '#1a192b', strokeWidth: 2 }}
            connectionLineType={ConnectionLineType.Bezier}
            panOnScroll={false}
            panOnScrollMode={PanOnScrollMode.Free}
            panOnDrag={shiftPressed}
            panActivationKeyCode="Shift"
            zoomOnScroll={true}
            zoomOnPinch={true}
            zoomOnDoubleClick={false}
            selectionKeyCode="Control"
            nodesDraggable={!isNodeEditing} // Disable node dragging when in edit mode
          >
            {/* Background pattern */}
            <Background 
              variant={BackgroundVariant.Dots}
              gap={12} 
              size={1} 
              color="#cccccc" 
            />
            
            {/* Minimap for navigation */}
            <MiniMap 
              nodeStrokeColor="#1a192b"
              nodeColor="#ffffff"
              nodeBorderRadius={3}
            />
            
            {/* Controls for zoom and pan */}
            <Controls />
            
            {/* Add KnifeTool */}
            <KnifeTool />
            
            {/* Help panel */}
            <Panel position="top-left" className="bg-white p-2 rounded shadow-md text-xs text-gray-600">
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">Shift</kbd> + Drag to pan</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">Ctrl</kbd> + C to copy</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">Ctrl</kbd> + V to paste</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">Ctrl</kbd> + X to cut</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">Ctrl</kbd> + D to duplicate</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">Esc</kbd> to cancel cut</div>
              {cutMode && (
                <div className="mt-1 text-red-500 flex items-center">
                  <div className="w-3 h-3 border border-dashed border-red-500 mr-1"></div>
                  <span>Nodes marked for cut</span>
                </div>
              )}
              {isNodeEditing && <div className="mt-1 text-primary">Node editing: shortcuts disabled</div>}
            </Panel>
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default Whiteboard;