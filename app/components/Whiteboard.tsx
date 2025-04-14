'use client';

import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import TextBlock from './TextBlock';

interface Block {
  id: string;
  title: string;
  content: string;
  position: { x: number; y: number };
  type?: string;
}

const Whiteboard = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [task, setTask] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });
  
  // Add window resize handler and initialize dimensions
  useEffect(() => {
    // Set initial dimensions
    setWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });
    
    // Add resize listener
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Add a new block at a specific position
  const addBlock = () => {
    // For debugging
    console.log('Add block button clicked');
    
    try {
      // Calculate center position
      const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
      const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
      
      console.log('Container dimensions:', { width: containerWidth, height: containerHeight });
      
      // Center of the whiteboard
      const centerX = containerWidth / 2 - 150;
      const centerY = containerHeight / 2 - 100;
      
      const newBlock: Block = {
        id: uuidv4(),
        title: 'title',
        content: 'this should be the content of your paragraph...',
        position: { x: centerX, y: centerY },
        type: 'text'
      };
      
      console.log('Creating new block:', newBlock);
      
      setBlocks(prevBlocks => [...prevBlocks, newBlock]);
      console.log('Updated blocks array');
    } catch (error) {
      console.error('Error adding block:', error);
    }
  };

  // Update block content
  const updateBlock = (id: string, title: string, content: string) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, title, content } : block
    ));
  };

  // Update block position after drag
  const updateBlockPosition = (id: string, position: { x: number; y: number }) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, position } : block
    ));
  };

  // Delete a block
  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id));
  };

  // Generate initial blocks based on task description
  const generateOutline = () => {
    if (!task.trim()) return;
    
    // Center of the whiteboard
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
    const centerX = containerWidth / 2 - 150;
    
    // Create a structured outline
    const titleBlock: Block = {
      id: uuidv4(),
      title: 'title',
      content: 'this should be the content of your title...',
      position: { x: centerX, y: 50 },
      type: 'text'
    };
    
    const opening1: Block = {
      id: uuidv4(),
      title: 'title',
      content: 'this should be the content of your paragraph...',
      position: { x: centerX - 250, y: 250 },
      type: 'text'
    };
    
    const opening2: Block = {
      id: uuidv4(),
      title: 'title',
      content: 'this should be the content of your paragraph...',
      position: { x: centerX, y: 250 },
      type: 'text'
    };
    
    const opening3: Block = {
      id: uuidv4(),
      title: 'title',
      content: 'this should be the content of your paragraph...',
      position: { x: centerX + 250, y: 250 },
      type: 'text'
    };
    
    const mainBlock: Block = {
      id: uuidv4(),
      title: 'title',
      content: 'this should be the content of your paragraph...',
      position: { x: centerX, y: 450 },
      type: 'text'
    };
    
    setBlocks([titleBlock, opening1, opening2, opening3, mainBlock]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar with input and actions */}
      <div className="flex items-center p-3 bg-gray-200 dark:bg-gray-800">
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Describe your writing task..."
          className="flex-grow p-2 mr-2 border border-gray-300 rounded"
        />
        <button
          onClick={generateOutline}
          className="px-4 py-2 mr-2 text-white bg-blue-500 rounded hover:bg-blue-600"
        >
          Generate Outline
        </button>
      </div>
      
      {/* Whiteboard area */}
      <div 
        ref={containerRef}
        className="flex-grow relative bg-gray-100 dark:bg-gray-900 overflow-auto"
        style={{ height: 'calc(100vh - 64px)' }}
      >
        {/* Blocks */}
        {blocks.map((block) => {
          if (block.type === 'text') {
            return (
              <TextBlock
                key={block.id}
                id={block.id}
                title={block.title}
                content={block.content}
                position={block.position}
                onUpdate={updateBlock}
                onDelete={deleteBlock}
                onPositionChange={updateBlockPosition}
              />
            );
          }
          return null;
        })}
        
        {blocks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            {task ? 'Click "Generate Outline" to start' : 'Enter a task description and generate an outline, or add blocks manually'}
          </div>
        )}
        
        {/* Fixed add button - simplified to ensure it works */}
        <div 
          onClick={addBlock}
          className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg cursor-pointer"
        >
          +
        </div>
        
        {/* Debug info - only visible in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed top-2 right-2 bg-black/70 text-white p-2 text-sm rounded opacity-70 z-50">
            <p>Blocks: {blocks.length}</p>
            <p>Window: {windowDimensions.width}x{windowDimensions.height}</p>
            <p>Container: {containerRef.current ? `${containerRef.current.clientWidth}x${containerRef.current.clientHeight}` : 'No ref'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Whiteboard; 