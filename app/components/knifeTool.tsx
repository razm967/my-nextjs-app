// my-nextjs-app/app/components/knifeTool.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { useFlowStore } from '../store/flowStore';
import { PiKnifeDuotone } from "react-icons/pi";

interface KnifeToolProps {
  active?: boolean; // Made optional since we're self-contained now
  onToggle?: () => void; // Made optional since we're self-contained now
}

const KnifeTool: React.FC<KnifeToolProps> = () => {
  // Track both flow position (for edge detection) and client position (for cursor display)
  const [flowPosition, setFlowPosition] = useState({ x: 0, y: 0 });
  const [clientPosition, setClientPosition] = useState({ x: 0, y: 0 });
  
  // State to track if the knife is being held
  const [isHolding, setIsHolding] = useState(false);
  
  // Get the ReactFlow instance to access viewport transformations
  const reactFlowInstance = useReactFlow();
  
  // Get the edge deletion function from our store
  const deleteEdgesByPosition = useFlowStore((state) => state.deleteEdgesByPosition);
  
  // Reference to the knife element
  const knifeRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Track mouse movements for the knife
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!reactFlowInstance || !isHolding) return;
    
    // Store the client coordinates for cursor display
    setClientPosition({
      x: e.clientX,
      y: e.clientY
    });
    
    // Convert to flow coordinates for edge detection only
    const flowPos = reactFlowInstance.project({ 
      x: e.clientX, 
      y: e.clientY 
    });
    
    setFlowPosition(flowPos);
    
    // Use flow coordinates for edge detection
    deleteEdgesByPosition(flowPos.x, flowPos.y, 10);
  }, [reactFlowInstance, isHolding, deleteEdgesByPosition]);
  
  // Handle mouse down - pick up the knife
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsHolding(true);
    
    // Set initial client position
    setClientPosition({
      x: e.clientX,
      y: e.clientY
    });
    
    // Set initial flow position for edge detection
    if (reactFlowInstance) {
      const flowPos = reactFlowInstance.project({ 
        x: e.clientX, 
        y: e.clientY 
      });
      setFlowPosition(flowPos);
    }
  }, [reactFlowInstance]);
  
  // Handle mouse up - return the knife to holder
  const handleMouseUp = useCallback(() => {
    setIsHolding(false);
  }, []);
  
  // Handle global mouse events
  useEffect(() => {
    if (isHolding) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      // Hide default cursor
      document.body.style.cursor = 'none';
      
      // Add knife-active class to ReactFlow container for styling
      const reactFlowContainer = document.querySelector('.react-flow');
      if (reactFlowContainer) {
        reactFlowContainer.classList.add('knife-active');
      }
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      
      // Remove knife-active class when deactivated
      const reactFlowContainer = document.querySelector('.react-flow');
      if (reactFlowContainer) {
        reactFlowContainer.classList.remove('knife-active');
      }
    };
  }, [isHolding, handleMouseMove, handleMouseUp]);
  
  return (
    <div className="absolute bottom-10 right-80 z-10"> {/* Positioned at bottom-right, a bit to the left */}
      <button
        ref={buttonRef}
        className={`px-3 py-2 rounded-full flex items-center justify-center transition-all ${
          isHolding 
            ? 'bg-gray-300 text-gray-500' // Dimmed when knife is taken
            : 'bg-red-600 text-white hover:bg-red-700 shadow-lg'
        }`}
        onMouseDown={handleMouseDown}
        title="Press and hold to use knife tool"
      >
        <PiKnifeDuotone size={20} className={isHolding ? "opacity-50" : ""} />
      </button>
      
      {isHolding && (
        <div 
          ref={knifeRef}
          className="fixed z-50 pointer-events-none"
          style={{
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          {/* Knife cursor - positioned directly using client coordinates */}
          <div
            className="absolute"
            style={{
              left: `${clientPosition.x}px`,
              top: `${clientPosition.y}px`,
              transform: 'translate(-50%, -50%) rotate(-45deg)', // Center on cursor point
            }}
          >
            {/* Knife graphic */}
            <div className="relative">
              <PiKnifeDuotone 
                size={32} 
                className="text-red-600 drop-shadow-lg" 
              />
              
              {/* Cutting point indicator */}
              <div className="absolute w-2 h-2 bg-red-500 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              
              {/* Cutting trail effect */}
              <div className="absolute w-3 h-3 bg-red-500 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-50 animate-ping" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnifeTool;