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
  NodeChange,
  EdgeChange,
  Connection
} from 'reactflow';
import { useFlowStore } from '../store/flowStore';
import nodeTypes from './NodeTypes';
import FlowToolbar from './FlowToolbar';
import KnifeTool from './knifeTool';
import PromptBar from './PromptBar';
import { v4 as uuidv4 } from 'uuid';
import { useHistoryStore } from '../store/historyStore';

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

  // Add history management hooks
  const { saveState, undo, redo } = useHistoryStore();

  // Toggle knife tool activation
  const toggleKnifeTool = useCallback(() => {
    setIsKnifeActive(prev => !prev);
  }, []);

  // Set the ReactFlow instance when initialized
  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);
  
  // Helper function to check if the active element is an input field
  const isEditingText = useCallback(() => {
    const activeElement = document.activeElement;
    const isTextInput = activeElement instanceof HTMLInputElement || 
                        activeElement instanceof HTMLTextAreaElement || 
                        ((activeElement as HTMLElement)?.isContentEditable === true);
    return isTextInput;
  }, []);
  
  // Update the copySelectedNodes function
  const copySelectedNodes = useCallback(() => {
    // Skip if the user is editing text in an input field
    if (isEditingText()) return;
    
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
  }, [reactFlowInstance, nodes, isEditingText]);
  
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
    // Skip if the user is editing text in an input field
    if (isEditingText()) return;
    
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
  }, [reactFlowInstance, nodes, isEditingText]);
  
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
    // Skip if the user is editing text in an input field
    if (isEditingText()) return;
    
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
  }, [reactFlowInstance, copiedNodes, addNode, mousePosition, cutMode, deleteNode, clearCutIndicators, isEditingText]);
  
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
  
  // Add a function to group selected nodes
  const handleGroupNodes = useCallback(() => {
    if (!reactFlowInstance) return;
    
    const selectedNodes = nodes.filter(node => node.selected);
    
    if (selectedNodes.length < 2) {
      alert('Please select at least 2 nodes to group');
      return;
    }
    
    // Calculate the bounding box of all selected nodes
    const positions = selectedNodes.map(node => ({
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
    
    // Add padding to the bounding box
    const padding = 20;
    boundingBox.left -= padding;
    boundingBox.right += padding;
    boundingBox.top -= padding;
    boundingBox.bottom += padding;
    
    // Create a unique group ID
    const groupId = `group-${uuidv4()}`;
    
    // Mark all selected nodes as part of this group
    reactFlowInstance.setNodes(nodes.map(node => {
      if (node.selected) {
        return {
          ...node,
          data: {
            ...node.data,
            groupId: groupId
          },
          // Keep their selection state
          selected: true
        };
      }
      return node;
    }));
    
    // Create a new group node
    const groupNode = {
      id: groupId,
      type: 'groupNode', // We'll need to create this node type
      position: {
        x: boundingBox.left,
        y: boundingBox.top
      },
      data: {
        label: 'Group',
        width: boundingBox.right - boundingBox.left,
        height: boundingBox.bottom - boundingBox.top,
        childNodeIds: selectedNodes.map(node => node.id)
      },
      selected: false
    };
    
    // Add the group node to the flow
    useFlowStore.getState().addCustomNode(groupNode);
    
    console.log('Created group with ID:', groupId);
  }, [reactFlowInstance, nodes]);
  
  // Add ungrouping function
  const handleUngroupNodes = useCallback(() => {
    if (!reactFlowInstance) return;
    
    const selectedNodes = nodes.filter(node => node.selected);
    
    // Check if there's a selected group node
    const selectedGroupNodes = selectedNodes.filter(node => node.type === 'groupNode');
    
    if (selectedGroupNodes.length === 0) {
      // If no group is selected, but a grouped node is selected, ungroup its parent
      const groupedNodes = selectedNodes.filter(node => node.data?.groupId);
      if (groupedNodes.length > 0) {
        // Get unique group IDs
        const groupIds = [...new Set(groupedNodes.map(node => node.data.groupId))];
        
        // For each group, ungroup the nodes
        groupIds.forEach(groupId => {
          // Remove group ID from all nodes in this group
          reactFlowInstance.setNodes(nodes => 
            nodes.map(node => {
              if (node.data?.groupId === groupId) {
                const { groupId: _, ...restData } = node.data;
                return {
                  ...node,
                  data: restData
                };
              }
              return node;
            })
          );
          
          // Delete the group node
          deleteNode(groupId);
        });
      }
      return;
    }
    
    // Ungroup all selected group nodes
    selectedGroupNodes.forEach(groupNode => {
      // Get the group ID
      const groupId = groupNode.id;
      
      // Remove group ID from all nodes in this group
      reactFlowInstance.setNodes(nodes => 
        nodes.map(node => {
          if (node.data?.groupId === groupId) {
            const { groupId: _, ...restData } = node.data;
            return {
              ...node,
              data: restData
            };
          }
          return node;
        })
      );
      
      // Delete the group node
      deleteNode(groupId);
    });
    
  }, [reactFlowInstance, nodes, deleteNode]);
  
  // Modify the existing node and edge change handlers to save history
  const enhancedOnNodesChange = useCallback((changes: NodeChange[]) => {
    // Skip saving for selection/deselection changes
    const significantChanges = changes.filter(
      (change: NodeChange) => change.type !== 'select' || (change.type === 'select' && change.selected === true)
    );
    
    // Only save state for meaningful changes
    if (significantChanges.length > 0) {
      onNodesChange(changes);
      saveState();
    } else {
      onNodesChange(changes);
    }
  }, [onNodesChange, saveState]);
  
  const enhancedOnEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes);
    saveState();
  }, [onEdgesChange, saveState]);
  
  const enhancedOnConnect = useCallback((params: Connection) => {
    onConnect(params);
    saveState();
  }, [onConnect, saveState]);
  
  // Enhance existing node operations to save history
  const enhancedAddNode = useCallback((type: string, position: { x: number, y: number }) => {
    addNode(type, position);
    saveState();
  }, [addNode, saveState]);
  
  const enhancedDeleteNode = useCallback((nodeId: string) => {
    deleteNode(nodeId);
    saveState();
  }, [deleteNode, saveState]);
  
  // Update the handleKeyDown function to include Ctrl+A shortcut
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      setShiftPressed(true);
    } else if (event.key === 'Escape') {
      handleEscapeKey(event);
    }
    
    // Only process shortcuts if we're not in edit mode and not in a text field
    if (isNodeEditing || isEditingText()) return;
    
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
        case 'a': // Select All
          event.preventDefault();
          if (reactFlowInstance) {
            // Get all nodes and select them
            reactFlowInstance.setNodes(nodes => 
              nodes.map(node => ({
                ...node,
                selected: true
              }))
            );
            console.log('Selected all nodes with Ctrl+A');
          }
          break;
        case 'g': // Group or ungroup nodes
          event.preventDefault();
          
          // Check if we're working with a group
          const selectedNodes = nodes.filter(node => node.selected);
          const hasSelectedGroup = selectedNodes.some(node => node.type === 'groupNode');
          const hasGroupedNode = selectedNodes.some(node => node.data?.groupId);
          
          if (hasSelectedGroup || hasGroupedNode) {
            handleUngroupNodes();
          } else {
            handleGroupNodes();
          }
          break;
        case 'z': // Undo
          event.preventDefault();
          if (event.shiftKey) {
            // Ctrl+Shift+Z or Cmd+Shift+Z for redo
            redo();
          } else {
            // Ctrl+Z or Cmd+Z for undo
            undo();
          }
          break;
        case 'y': // Redo
          event.preventDefault();
          redo();
          break;
      }
    }
  }, [
    isNodeEditing, 
    copySelectedNodes, 
    pasteNodes, 
    cutSelectedNodes, 
    duplicateSelectedNodes,
    handleEscapeKey,
    reactFlowInstance,
    handleGroupNodes,
    handleUngroupNodes,
    nodes,
    undo, 
    redo,
    isEditingText
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

  // Save state after batch operations
  useEffect(() => {
    saveState(); // Save initial state
  }, [saveState]);

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
          onGroupNodes={handleGroupNodes}
          onUngroupNodes={handleUngroupNodes}
        />
        
        <div className="flex-grow relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={enhancedOnNodesChange}
            onEdgesChange={enhancedOnEdgesChange}
            onConnect={enhancedOnConnect}
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
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">Ctrl</kbd> + A to select all</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">Ctrl</kbd> + C to copy</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">Ctrl</kbd> + V to paste</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">Ctrl</kbd> + X to cut</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">Ctrl</kbd> + D to duplicate</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">Esc</kbd> to cancel cut</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">Ctrl</kbd> + G to group nodes</div>
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
        
        {/* Add the PromptBar component */}
        <PromptBar reactFlowInstance={reactFlowInstance} />
      </ReactFlowProvider>
    </div>
  );
};

export default Whiteboard;