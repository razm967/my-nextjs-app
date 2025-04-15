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

// Main Whiteboard component
const Whiteboard: React.FC = () => {
  // Get state and functions from our flow store
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useFlowStore();

  // Reference to the ReactFlow instance
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // State to track if shift key is pressed
  const [shiftPressed, setShiftPressed] = useState(false);
  
  // State to track if any node is in edit mode
  const [isNodeEditing, setIsNodeEditing] = useState(false);
  
  // Ref to store the ReactFlow wrapper element
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Set the ReactFlow instance when initialized
  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);
  
  // Handle key down events (detect shift key press)
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      setShiftPressed(true);
    }
  }, []);
  
  // Handle key up events (detect shift key release)
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
      tabIndex={0} // Make div focusable to capture keyboard events
    >
      <ReactFlowProvider>
        <FlowToolbar reactFlowInstance={reactFlowInstance} />
        
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
            
            {/* Help panel */}
            <Panel position="top-left" className="bg-white p-2 rounded shadow-md text-xs text-gray-600">
              Press <kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">Shift</kbd> + Drag to pan
              {isNodeEditing && <div className="mt-1 text-primary">Node editing: dragging disabled</div>}
            </Panel>
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default Whiteboard; 