// app/components/PromptBar.tsx
import React, { useState } from 'react';
import { useFlowStore } from '../store/flowStore';
import { FiSend } from 'react-icons/fi';
import { MarkerType, addEdge } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';

interface PromptBarProps {
  reactFlowInstance: any;
}

const PromptBar: React.FC<PromptBarProps> = ({ reactFlowInstance }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const addNode = useFlowStore((state) => state.addNode);
  const onConnect = useFlowStore((state) => state.onConnect);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim() || !reactFlowInstance) return;
    
    setIsLoading(true);
    
    try {
      console.log('Sending prompt to API:', prompt);
      
      // Call your AI API
      const response = await fetch('/api/generate-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to generate flow: ${response.status} ${errorText}`);
      }
      
      const flowData = await response.json();
      console.log('Received flow data:', flowData);
      
      // Build the flow using the returned data
      buildFlow(flowData, reactFlowInstance);
      
      // Clear the prompt
      setPrompt('');
    } catch (error: any) {
      console.error('Error generating flow:', error);
      alert(`Failed to generate flow: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const buildFlow = (flowData: any, reactFlowInstance: any) => {
    // Add validation and fallback
    if (!flowData || !flowData.nodes || !Array.isArray(flowData.nodes) || flowData.nodes.length === 0) {
      console.error('Invalid flow data received:', flowData);
      // Create a simple fallback flow
      flowData = {
        nodes: [
          { title: "Introduction", name: "intro" },
          { title: "Background", name: "background" },
          { title: "Methodology", name: "method" },
          { title: "Results", name: "results" },
          { title: "Conclusion", name: "conclusion" }
        ]
      };
      alert('Using default flow structure. API response was invalid.');
    }
    
    // First, clear existing nodes 
    const existingNodes = [...useFlowStore.getState().nodes];
    existingNodes.forEach(node => {
      useFlowStore.getState().deleteNode(node.id);
    });
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Create nodes
    const createdNodes: any[] = [];
    const verticalSpacing = 200; // Clear vertical spacing
    
    // Create all nodes first
    flowData.nodes.forEach((node: any, index: number) => {
      // Position nodes in a straight line for clarity
      const position = reactFlowInstance.project({
        x: centerX,
        y: centerY - 200 + (index * verticalSpacing)
      });
      
      // Add the node
      addNode('textNode', position);
      
      // Get the ID of the newly added node
      const newNodes = useFlowStore.getState().nodes;
      const newNodeId = newNodes[newNodes.length - 1].id;
      
      // Update node text
      useFlowStore.getState().updateNodeText(
        newNodeId,
        '', // No content text initially
        node.title || 'Node ' + (index + 1), // Title from AI
        node.name || '', // Name/tag from AI
        {}, // No text styling
        '14', // Default font size
        'Canva Sans' // Default font
      );
      
      createdNodes.push({
        id: newNodeId,
        index
      });
    });
    
    // Wait for nodes to render, then create edges
    setTimeout(() => {
      // Loop through nodes and make connections
      for (let i = 0; i < createdNodes.length - 1; i++) {
        const sourceId = createdNodes[i].id;
        const targetId = createdNodes[i + 1].id;
        
        // Use connection parameters with ID
        const params = {
          id: `edge-${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'default',
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2 }
        };
        
        // Call onConnect for each connection
        onConnect({
          source: sourceId,
          target: targetId,
          sourceHandle: 'bottom',
          targetHandle: 'top'
        });
        
        console.log(`Connected node ${sourceId} to ${targetId}`);
      }
      
      // After all connections, fit the view
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.3 });
      }, 100);
    }, 300);
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-10">
      <div className="bg-white rounded-full shadow-lg p-1.5 flex items-center w-[400px] max-w-[80vw]">
        <form onSubmit={handleSubmit} className="flex items-center w-full">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Generate flow with AI..."
            className="flex-grow px-4 py-2 bg-transparent border-none focus:outline-none text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`rounded-full p-2.5 ml-1 ${
              isLoading 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } transition-colors`}
            disabled={isLoading}
            title="Generate flow"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <FiSend className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PromptBar;