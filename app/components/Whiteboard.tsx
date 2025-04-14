'use client';

import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import TextBlock from './TextBlock';

// Define text formatting options interfaces
interface TextFormat {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  fontStyle: string;
  textAlign: string;
  textColor: string;
  backgroundColor: string;
  isUnderlined: boolean;
  isStrikethrough: boolean;
}

interface Block {
  id: string;
  title: string;
  content: string;
  position: { x: number; y: number };
  type?: string;
  format?: TextFormat;
}

const Whiteboard = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [task, setTask] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [activeEditingField, setActiveEditingField] = useState<'title' | 'content' | null>(null);
  
  // Default text format
  const defaultTextFormat: TextFormat = {
    fontFamily: 'Arial, sans-serif',
    fontSize: '16px',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    textColor: '#333333',
    backgroundColor: 'transparent',
    isUnderlined: false,
    isStrikethrough: false
  };
  
  // Font family options
  const fontFamilies = [
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Courier New', value: 'Courier New, monospace' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' }
  ];
  
  // Font size options
  const fontSizes = [
    { name: 'Small', value: '12px' },
    { name: 'Normal', value: '16px' },
    { name: 'Medium', value: '20px' },
    { name: 'Large', value: '24px' },
    { name: 'Extra Large', value: '28px' }
  ];
  
  // Color options
  const colorOptions = [
    { name: 'Black', value: '#333333' },
    { name: 'Dark Gray', value: '#666666' },
    { name: 'Gray', value: '#999999' },
    { name: 'Blue', value: '#007BFF' },
    { name: 'Red', value: '#DC3545' },
    { name: 'Green', value: '#28A745' },
    { name: 'Yellow', value: '#FFC107' },
    { name: 'Purple', value: '#6F42C1' }
  ];
  
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
  const addBlock = (e?: React.MouseEvent) => {
    // Prevent any event bubbling issues
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // For debugging
    console.log('Add block button clicked');
    
    // Calculate center position
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
    const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
    
    // Center of the whiteboard
    const centerX = containerWidth / 2 - 150;
    const centerY = containerHeight / 2 - 100;
    
    // Create a new block with a unique ID
    const newBlock: Block = {
      id: uuidv4(),
      title: 'New Block',
      content: 'Click to edit content...',
      position: { x: centerX, y: centerY },
      type: 'text',
      format: { ...defaultTextFormat }
    };
    
    // Update state with the new block
    setBlocks(prevBlocks => [...prevBlocks, newBlock]);
  };

  // Update block content
  const updateBlock = (id: string, title: string, content: string) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, title, content } : block
    ));
  };

  // Update block format
  const updateBlockFormat = (id: string, formatUpdates: Partial<TextFormat>) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { 
        ...block, 
        format: { ...(block.format || defaultTextFormat), ...formatUpdates } 
      } : block
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
    if (activeBlockId === id) {
      setActiveBlockId(null);
    }
  };

  // Set active block for editing
  const setActiveBlock = (id: string | null, editingField: 'title' | 'content' | null = null) => {
    console.log('Setting active block:', id, 'Field:', editingField);
    setActiveBlockId(id);
    setActiveEditingField(editingField);
  };

  // Get the active block
  const getActiveBlock = () => {
    return blocks.find(block => block.id === activeBlockId);
  };

  // Format labels for toolbar title
  const getFormatTitle = () => {
    const block = getActiveBlock();
    if (!block) return '';
    
    return activeEditingField === 'title' 
      ? `Editing title: ${block.title || 'Untitled'}`
      : `Editing content: ${block.title || 'Untitled'}`;
  };

  // Text formatting handlers
  const updateFormat = (property: keyof TextFormat, value: any) => {
    if (!activeBlockId) return;
    
    updateBlockFormat(activeBlockId, {
      [property]: value
    });
  };

  // Toggle text formatting buttons (bold, italic, underline, strikethrough)
  const toggleFormatting = (property: keyof TextFormat) => {
    if (!activeBlockId) return;
    
    const activeBlock = getActiveBlock();
    if (!activeBlock || !activeBlock.format) return;
    
    if (property === 'fontWeight') {
      updateFormat('fontWeight', activeBlock.format.fontWeight === 'bold' ? 'normal' : 'bold');
    } else if (property === 'fontStyle') {
      updateFormat('fontStyle', activeBlock.format.fontStyle === 'italic' ? 'normal' : 'italic');
    } else if (property === 'isUnderlined') {
      updateFormat('isUnderlined', !activeBlock.format.isUnderlined);
    } else if (property === 'isStrikethrough') {
      updateFormat('isStrikethrough', !activeBlock.format.isStrikethrough);
    }
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
      type: 'text',
      format: { ...defaultTextFormat }
    };
    
    const opening1: Block = {
      id: uuidv4(),
      title: 'title',
      content: 'this should be the content of your paragraph...',
      position: { x: centerX - 250, y: 250 },
      type: 'text',
      format: { ...defaultTextFormat }
    };
    
    const opening2: Block = {
      id: uuidv4(),
      title: 'title',
      content: 'this should be the content of your paragraph...',
      position: { x: centerX, y: 250 },
      type: 'text',
      format: { ...defaultTextFormat }
    };
    
    const opening3: Block = {
      id: uuidv4(),
      title: 'title',
      content: 'this should be the content of your paragraph...',
      position: { x: centerX + 250, y: 250 },
      type: 'text',
      format: { ...defaultTextFormat }
    };
    
    const mainBlock: Block = {
      id: uuidv4(),
      title: 'title',
      content: 'this should be the content of your paragraph...',
      position: { x: centerX, y: 450 },
      type: 'text',
      format: { ...defaultTextFormat }
    };
    
    setBlocks([titleBlock, opening1, opening2, opening3, mainBlock]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Text Formatting Toolbar - Always visible but disabled when no block is active */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container mx-auto px-2 py-1">
          <div className="flex items-center h-10 gap-2 overflow-x-auto">
            {/* Font Family Dropdown - Styled like Canva */}
            <div className="flex-shrink-0">
              <select 
                value={getActiveBlock()?.format?.fontFamily || defaultTextFormat.fontFamily}
                onChange={(e) => updateFormat('fontFamily', e.target.value)}
                className={`h-8 px-2 py-0 text-sm font-medium border border-gray-200 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 ${!activeBlockId || !activeEditingField ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!activeBlockId || !activeEditingField}
              >
                {fontFamilies.map(font => (
                  <option key={font.value} value={font.value}>{font.name}</option>
                ))}
              </select>
            </div>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

            {/* Font Size - Styled like Canva */}
            <div className={`flex items-center h-8 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden ${!activeBlockId || !activeEditingField ? 'opacity-50' : ''}`}>
              <button 
                onClick={() => {
                  if (!activeBlockId || !activeEditingField) return;
                  const currentSize = parseInt(getActiveBlock()?.format?.fontSize || '16');
                  if (currentSize > 8) {
                    updateFormat('fontSize', `${currentSize - 2}px`);
                  }
                }}
                className="flex items-center justify-center w-8 h-full text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-r border-gray-200 dark:border-gray-700"
                title="Decrease font size"
                disabled={!activeBlockId || !activeEditingField}
              >
                <span className="text-lg font-bold">−</span>
              </button>
              <input
                type="text"
                value={parseInt(getActiveBlock()?.format?.fontSize || '16')}
                onChange={(e) => {
                  if (!activeBlockId || !activeEditingField) return;
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value > 0) {
                    updateFormat('fontSize', `${value}px`);
                  }
                }}
                className="w-12 h-full text-center bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none"
                disabled={!activeBlockId || !activeEditingField}
              />
              <button 
                onClick={() => {
                  if (!activeBlockId || !activeEditingField) return;
                  const currentSize = parseInt(getActiveBlock()?.format?.fontSize || '16');
                  updateFormat('fontSize', `${currentSize + 2}px`);
                }}
                className="flex items-center justify-center w-8 h-full text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-l border-gray-200 dark:border-gray-700"
                title="Increase font size"
                disabled={!activeBlockId || !activeEditingField}
              >
                <span className="text-lg font-bold">+</span>
              </button>
            </div>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

            {/* Text Color */}
            <div className={`relative group flex-shrink-0 ${!activeBlockId || !activeEditingField ? 'pointer-events-none opacity-50' : ''}`}>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Text color"
                style={{ color: getActiveBlock()?.format?.textColor || defaultTextFormat.textColor }}
                disabled={!activeBlockId || !activeEditingField}
              >
                <span className="material-icons text-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 7l6 0"></path><path d="M12 7v7"></path><path d="M11 19l2 0"></path>
                  </svg>
                </span>
                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-4 h-1 rounded" style={{ backgroundColor: getActiveBlock()?.format?.textColor || defaultTextFormat.textColor }}></div>
              </button>
              {activeBlockId && activeEditingField && (
                <div className="absolute hidden group-hover:block top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-2 z-10">
                  <div className="grid grid-cols-4 gap-1">
                    {colorOptions.map(color => (
                      <div
                        key={color.value}
                        onClick={() => updateFormat('textColor', color.value)}
                        className="w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      ></div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Background Color */}
            <div className={`relative group flex-shrink-0 ${!activeBlockId || !activeEditingField ? 'pointer-events-none opacity-50' : ''}`}>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Background color"
                disabled={!activeBlockId || !activeEditingField}
              >
                <span className="material-icons text-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6.5 3H3c-.5 0-1 .5-1 1v3.5L16.5 22c.5.5 1.5.5 2 0l3-3c.5-.5.5-1.5 0-2L7 3.5Z"></path>
                    <path d="M2 13.5V20c0 .5.5 1 1 1h6.5L2 13.5Z"></path>
                  </svg>
                </span>
                <div 
                  className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-4 h-1 rounded"
                  style={{ 
                    backgroundColor: getActiveBlock()?.format?.backgroundColor !== 'transparent' 
                      ? getActiveBlock()?.format?.backgroundColor 
                      : '#cccccc' 
                  }}
                ></div>
              </button>
              {activeBlockId && activeEditingField && (
                <div className="absolute hidden group-hover:block top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-2 z-10">
                  <div className="grid grid-cols-4 gap-1">
                    <div
                      onClick={() => updateFormat('backgroundColor', 'transparent')}
                      className="w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform bg-white border border-gray-300 relative"
                      title="No Background"
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="5" y1="5" x2="19" y2="19"></line>
                        </svg>
                      </div>
                    </div>
                    {colorOptions.map(color => (
                      <div
                        key={color.value}
                        onClick={() => updateFormat('backgroundColor', color.value)}
                        className="w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      ></div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

            {/* Text Style Buttons */}
            <button 
              onClick={() => {
                if (!activeBlockId || !activeEditingField) return;
                toggleFormatting('fontWeight');
              }} 
              className={`flex items-center justify-center w-8 h-8 rounded-md ${getActiveBlock()?.format?.fontWeight === 'bold' ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} ${!activeBlockId || !activeEditingField ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Bold"
              disabled={!activeBlockId || !activeEditingField}
            >
              <span className="material-icons text-xl font-bold">B</span>
            </button>
            
            <button 
              onClick={() => {
                if (!activeBlockId || !activeEditingField) return;
                toggleFormatting('fontStyle');
              }} 
              className={`flex items-center justify-center w-8 h-8 rounded-md ${getActiveBlock()?.format?.fontStyle === 'italic' ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} ${!activeBlockId || !activeEditingField ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Italic"
              disabled={!activeBlockId || !activeEditingField}
            >
              <span className="material-icons text-xl italic">I</span>
            </button>
            
            <button 
              onClick={() => {
                if (!activeBlockId || !activeEditingField) return;
                toggleFormatting('isUnderlined');
              }} 
              className={`flex items-center justify-center w-8 h-8 rounded-md ${getActiveBlock()?.format?.isUnderlined ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} ${!activeBlockId || !activeEditingField ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Underline"
              disabled={!activeBlockId || !activeEditingField}
            >
              <span className="material-icons text-xl underline">U</span>
            </button>
            
            <button 
              onClick={() => {
                if (!activeBlockId || !activeEditingField) return;
                toggleFormatting('isStrikethrough');
              }} 
              className={`flex items-center justify-center w-8 h-8 rounded-md ${getActiveBlock()?.format?.isStrikethrough ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} ${!activeBlockId || !activeEditingField ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Strikethrough"
              disabled={!activeBlockId || !activeEditingField}
            >
              <span className="material-icons text-xl line-through">S</span>
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

            {/* Text Alignment Buttons */}
            <button 
              onClick={() => {
                if (!activeBlockId || !activeEditingField) return;
                updateFormat('textAlign', 'left');
              }} 
              className={`flex items-center justify-center w-8 h-8 rounded-md ${getActiveBlock()?.format?.textAlign === 'left' ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} ${!activeBlockId || !activeEditingField ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Align Left"
              disabled={!activeBlockId || !activeEditingField}
            >
              <span className="material-icons text-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="15" y2="12"></line>
                  <line x1="3" y1="18" x2="18" y2="18"></line>
                </svg>
              </span>
            </button>
            
            <button 
              onClick={() => {
                if (!activeBlockId || !activeEditingField) return;
                updateFormat('textAlign', 'center');
              }} 
              className={`flex items-center justify-center w-8 h-8 rounded-md ${getActiveBlock()?.format?.textAlign === 'center' ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} ${!activeBlockId || !activeEditingField ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Align Center"
              disabled={!activeBlockId || !activeEditingField}
            >
              <span className="material-icons text-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="6" y1="12" x2="18" y2="12"></line>
                  <line x1="5" y1="18" x2="19" y2="18"></line>
                </svg>
              </span>
            </button>
            
            <button 
              onClick={() => {
                if (!activeBlockId || !activeEditingField) return;
                updateFormat('textAlign', 'right');
              }} 
              className={`flex items-center justify-center w-8 h-8 rounded-md ${getActiveBlock()?.format?.textAlign === 'right' ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} ${!activeBlockId || !activeEditingField ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Align Right"
              disabled={!activeBlockId || !activeEditingField}
            >
              <span className="material-icons text-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="9" y1="12" x2="21" y2="12"></line>
                  <line x1="6" y1="18" x2="21" y2="18"></line>
                </svg>
              </span>
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

            {/* Effects Button */}
            <button 
              className={`flex items-center gap-1 px-3 h-8 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${!activeBlockId || !activeEditingField ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Text Effects"
              disabled={!activeBlockId || !activeEditingField}
            >
              <span>Effects</span>
            </button>

            {/* Current Field Label */}
            <div className="ml-auto text-sm text-gray-500 dark:text-gray-400 italic pr-3">
              {activeBlockId && activeEditingField 
                ? getFormatTitle() 
                : 'Select text to format'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Whiteboard area - takes full height with subtle gradient background */}
      <div 
        ref={containerRef}
        className="flex-grow relative overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
        style={{ height: '100vh', position: 'relative' }}
        onClick={() => setActiveBlock(null, null)}
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
                format={block.format || defaultTextFormat}
                onUpdate={updateBlock}
                onDelete={deleteBlock}
                onPositionChange={updateBlockPosition}
                onActivate={setActiveBlock}
                isActive={activeBlockId === block.id}
              />
            );
          }
          return null;
        })}
        
        {blocks.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="bg-white/50 dark:bg-gray-800/50 p-6 rounded-xl shadow-md backdrop-blur-sm border border-blue-100 dark:border-blue-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-blue-400 dark:text-blue-300 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-center text-lg mb-2">
                {task ? 'Ready to create your outline!' : 'Start by describing your writing task'}
              </p>
              <p className="text-center text-sm">
                {task ? 'Click "Generate" to start' : 'Then generate an outline or add blocks manually'}
              </p>
            </div>
          </div>
        )}
        
        {/* Add Block floating button - larger and more colorful */}
        <button
          onClick={(e) => addBlock(e)}
          className="fixed bottom-8 right-8 flex items-center justify-center w-16 h-16 rounded-md 
            bg-gradient-to-tr from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600
            text-white shadow-lg shadow-blue-500/30 cursor-pointer transition-all 
            hover:shadow-xl hover:shadow-blue-500/40 transform hover:scale-110 active:scale-95 z-50"
          aria-label="Add new block"
        >
          <span className="text-4xl font-bold">+</span>
        </button>
        
        {/* ChatGPT-style floating prompt bar - larger and more colorful */}
        <div className="fixed bottom-8 left-0 right-0 z-20 px-4 flex justify-center">
          <div className="flex items-center gap-3 rounded-full border border-blue-200 dark:border-blue-900 
            bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-5 py-3 shadow-lg shadow-blue-500/10
            max-w-4xl w-full md:w-auto md:min-w-[500px]">
            <div className="text-blue-400 dark:text-blue-300 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Describe your writing task..."
              className="flex-grow bg-transparent border-none focus:outline-none text-gray-800 
                dark:text-gray-200 py-1 text-base min-w-0"
            />
            
            <button
              onClick={generateOutline}
              disabled={!task.trim()}
              className={`flex-shrink-0 flex items-center gap-2 rounded-full px-5 py-2 transition-all text-base font-medium
                ${task.trim() 
                  ? 'bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-md shadow-blue-500/30' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'}
                transform hover:scale-105 active:scale-95`}
              aria-label="Generate outline"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Generate
            </button>
          </div>
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