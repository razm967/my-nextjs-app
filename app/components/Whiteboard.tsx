'use client';

import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import TextBlock, { ConnectionPointPosition } from './TextBlock';

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

// Add Position interface from TextBlock
interface Position {
  x: number;
  y: number;
  _timestamp?: number;
}

interface Block {
  id: string;
  title: string;
  content: string;
  position: Position;
  type?: string;
  format?: TextFormat;
  titleFormat?: TextFormat;
  updatedAt?: number; // Timestamp for tracking updates
}

// Update Connection interface to include source and target points
interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePoint: ConnectionPointPosition;
  targetPoint: ConnectionPointPosition;
  label?: string;
  type?: 'straight' | 'curved';
  color?: string;
}

const Whiteboard = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [task, setTask] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [activeEditingField, setActiveEditingField] = useState<'title' | 'content' | null>(null);
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const [fontSearchValue, setFontSearchValue] = useState('');
  const [textColorDropdownOpen, setTextColorDropdownOpen] = useState(false);
  const [bgColorDropdownOpen, setBgColorDropdownOpen] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{
    blockId: string;
    pointPosition: ConnectionPointPosition;
    position: {x: number, y: number};
  } | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{x: number, y: number}>({x: 0, y: 0});
  const [nearestPoint, setNearestPoint] = useState<{
    blockId: string;
    pointPosition: ConnectionPointPosition;
    position: {x: number, y: number};
    distance: number;
  } | null>(null);
  
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
  
  // Font options
  const fontOptions = [
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Helvetica', value: 'Helvetica, sans-serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Courier New', value: 'Courier New, monospace' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Impact', value: 'Impact, sans-serif' },
    { name: 'Tahoma', value: 'Tahoma, sans-serif' },
    { name: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
    { name: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
    { name: 'Lucida Sans', value: 'Lucida Sans, sans-serif' },
    { name: 'Palatino', value: 'Palatino, serif' },
    { name: 'Garamond', value: 'Garamond, serif' },
    { name: 'Book Antiqua', value: 'Book Antiqua, serif' },
    { name: 'Calibri', value: 'Calibri, sans-serif' },
  ];
  
  // Add this filtering function
  const getFilteredFonts = () => {
    if (!fontSearchValue) return fontOptions;
    
    return fontOptions.filter(font => 
      font.name.toLowerCase().includes(fontSearchValue.toLowerCase())
    );
  };
  
  // Make sure this is defined in your component
  const filteredFonts = getFilteredFonts();
  
  // Font size options
  const fontSizes = [
    { name: 'Small', value: '12px' },
    { name: 'Normal', value: '16px' },
    { name: 'Medium', value: '20px' },
    { name: 'Large', value: '24px' },
    { name: 'Extra Large', value: '28px' }
  ];
  
  // Color options with expanded palette
  const colorOptions = [
    { name: 'Black', value: '#000000' },
    { name: 'Gray', value: '#808080' },
    { name: 'Silver', value: '#c0c0c0' },
    { name: 'White', value: '#ffffff' },
    { name: 'Red', value: '#ff0000' },
    { name: 'Maroon', value: '#800000' },
    { name: 'Yellow', value: '#ffff00' },
    { name: 'Olive', value: '#808000' },
    { name: 'Lime', value: '#00ff00' },
    { name: 'Green', value: '#008000' },
    { name: 'Aqua', value: '#00ffff' },
    { name: 'Teal', value: '#008080' },
    { name: 'Blue', value: '#0000ff' },
    { name: 'Navy', value: '#000080' },
    { name: 'Fuchsia', value: '#ff00ff' },
    { name: 'Purple', value: '#800080' },
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
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Close font dropdown if clicking outside
      const fontDropdown = document.querySelector('.font-family-dropdown');
      if (fontDropdown && !fontDropdown.contains(e.target as Node)) {
        setFontDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Close font selector on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fontDropdownOpen) {
        setFontDropdownOpen(false);
        setFontSearchValue('');
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [fontDropdownOpen]);
  
  // Close font selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const fontSelector = document.querySelector('.font-selector-modal');
      const fontButton = document.querySelector('.font-selector-button');
      
      if (fontDropdownOpen && fontSelector && 
          !fontSelector.contains(e.target as Node) && 
          fontButton && !fontButton.contains(e.target as Node)) {
        setFontDropdownOpen(false);
        setFontSearchValue('');
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [fontDropdownOpen]);
  
  // Add this effect to handle closing color modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const textColorModal = document.querySelector('.text-color-modal');
      const textColorButton = document.querySelector('.text-color-button');
      const bgColorModal = document.querySelector('.bg-color-modal');
      const bgColorButton = document.querySelector('.bg-color-button');
      
      if (textColorDropdownOpen && textColorModal && 
          !textColorModal.contains(e.target as Node) && 
          textColorButton && !textColorButton.contains(e.target as Node)) {
        setTextColorDropdownOpen(false);
      }
      
      if (bgColorDropdownOpen && bgColorModal && 
          !bgColorModal.contains(e.target as Node) && 
          bgColorButton && !bgColorButton.contains(e.target as Node)) {
        setBgColorDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [textColorDropdownOpen, bgColorDropdownOpen]);
  
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
      format: { ...defaultTextFormat },
      titleFormat: { ...defaultTextFormat, fontWeight: 'bold' }
    };
    
    // Update state with the new block
    setBlocks(prevBlocks => [...prevBlocks, newBlock]);
  };

  // Update block position after drag
  const updateBlockPosition = (id: string, position: Position) => {
    setBlocks(prevBlocks => prevBlocks.map(block => 
      block.id === id ? { ...block, position } : block
    ));
    
    console.log(`Updated block position: ${id}`, position);
    
    // Force connection updates when a block moves
    forceConnectionUpdate();
    
    // Save blocks to local storage when position changes
    saveBlocksToLocalStorage();
  };
  
  // Save blocks to localStorage
  const saveBlocksToLocalStorage = () => {
    try {
      localStorage.setItem('whiteboard-blocks', JSON.stringify(blocks));
      console.log('Blocks saved to localStorage:', blocks.length);
    } catch (error) {
      console.error('Error saving blocks to localStorage:', error);
    }
  };
  
  // Load blocks from localStorage on component mount
  useEffect(() => {
    try {
      const savedBlocks = localStorage.getItem('whiteboard-blocks');
      if (savedBlocks) {
        const parsedBlocks = JSON.parse(savedBlocks);
        console.log('Loaded blocks from localStorage:', parsedBlocks.length);
        setBlocks(parsedBlocks);
      }
    } catch (error) {
      console.error('Error loading blocks from localStorage:', error);
    }
  }, []);
  
  // Save blocks when they change
  useEffect(() => {
    if (blocks.length > 0) {
      saveBlocksToLocalStorage();
    }
  }, [blocks]);
  
  // Update block content
  const updateBlock = (id: string, title: string, content: string) => {
    setBlocks(prevBlocks => prevBlocks.map(block => 
      block.id === id ? { 
        ...block, 
        title, 
        content,
        updatedAt: Date.now() // Add timestamp to force re-render
      } : block
    ));
    
    console.log(`Updated block content: ${id} with title: ${title}`);
    
    // Force connection updates when block content changes
    // Content changes can affect block height which affects connection points
    setTimeout(() => {
      forceConnectionUpdate();
    }, 50);
  };

  // Update block format
  const updateFormat = (property: keyof TextFormat, value: any) => {
    if (!activeBlockId || !activeEditingField) return;
    
    console.log(`Updating format: ${property} -> ${value}`);
    
    const updatedBlocks = blocks.map(block => {
      if (block.id === activeBlockId) {
        const targetField = activeEditingField === 'title' ? 'titleFormat' : 'format';
        
        // Create a new format object or use existing one
        const currentFormat = 
          (activeEditingField === 'title' && block.titleFormat) 
          || (activeEditingField === 'title' ? block.format : block.format) 
          || { ...defaultTextFormat };
          
        const newFormat = { ...currentFormat, [property]: value };
        
        // Return updated block with correct format field
        return activeEditingField === 'title'
          ? { 
              ...block, 
              titleFormat: newFormat,
              updatedAt: Date.now() // Add timestamp to force refresh
            }
          : { 
              ...block, 
              format: newFormat,
              updatedAt: Date.now() // Add timestamp to force refresh
            };
      }
      return block;
    });
    
    // Set updated blocks to trigger re-render
    setBlocks(updatedBlocks);
    
    // Force connection positions to update when text formatting changes
    // This is needed because text size changes can affect block height
    setTimeout(() => {
      forceConnectionUpdate();
    }, 100);
    
    // Save to localStorage
    setTimeout(() => {
      saveBlocksToLocalStorage();
    }, 10);
    
    // Re-focus the active text input after toolbar interactions
    if (activeEditingField === 'title') {
      setTimeout(() => {
        const activeElement = document.querySelector(`input[id="title-${activeBlockId}"]`) as HTMLElement;
        if (activeElement) {
          activeElement.focus();
        }
      }, 10);
    } else if (activeEditingField === 'content') {
      setTimeout(() => {
        const activeElement = document.querySelector(`textarea[id="content-${activeBlockId}"]`) as HTMLElement;
        if (activeElement) {
          activeElement.focus();
        }
      }, 10);
    }
  };

  // Delete a block
  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id));
    if (activeBlockId === id) {
      setActiveBlock(null, null);
    }
  };

  // Set active block for editing
  const setActiveBlock = (id: string | null, editingField: 'title' | 'content' | null = null) => {
    console.log('Setting active block:', id, 'Field:', editingField);
    
    // Only update if there's a change to avoid unnecessary re-renders
    if (id !== activeBlockId || editingField !== activeEditingField) {
      setActiveBlockId(id);
      setActiveEditingField(editingField);
    }
  };

  // Get the active block
  const getActiveBlock = () => {
    return blocks.find(block => block.id === activeBlockId);
  };

  // Get format based on current editing field
  const getCurrentFormat = () => {
    const block = getActiveBlock();
    if (!block) return defaultTextFormat;
    
    if (activeEditingField === 'title' && block.titleFormat) {
      return block.titleFormat;
    } else if (activeEditingField === 'title') {
      // If no specific title format yet, use block format or default
      return block.format || defaultTextFormat;
    }
    
    return block.format || defaultTextFormat;
  };

  // Format labels for toolbar title
  const getFormatTitle = () => {
    const block = getActiveBlock();
    if (!block) return '';
    
    return activeEditingField === 'title' 
      ? `Editing title: ${block.title || 'Untitled'}`
      : `Editing content: ${block.title || 'Untitled'}`;
  };

  // Prevent clicks inside the toolbar from deselecting the text block
  const handleToolbarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Toolbar click intercepted, activeBlockId:", activeBlockId);
    
    // Ensure we keep the active state
    if (activeBlockId && !activeEditingField) {
      // If clicking in toolbar but no field is active, defaulting to content
      setActiveEditingField('content');
    }
  };

  // Toggle formatting function
  const toggleFormatting = (property: keyof TextFormat) => {
    if (!activeBlockId || !activeEditingField) return;
    
    const currentFormat = getCurrentFormat();
    
    // Toggle based on property type
    if (property === 'fontWeight') {
      const newValue = currentFormat.fontWeight === 'bold' ? 'normal' : 'bold';
      updateFormat('fontWeight', newValue);
    } 
    else if (property === 'fontStyle') {
      const newValue = currentFormat.fontStyle === 'italic' ? 'normal' : 'italic';
      updateFormat('fontStyle', newValue);
    }
    else if (property === 'isUnderlined') {
      updateFormat('isUnderlined', !currentFormat.isUnderlined);
    }
    else if (property === 'isStrikethrough') {
      updateFormat('isStrikethrough', !currentFormat.isStrikethrough);
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
      format: { ...defaultTextFormat },
      titleFormat: { ...defaultTextFormat, fontWeight: 'bold' }
    };
    
    const mainBlock: Block = {
      id: uuidv4(),
      title: 'title',
      content: 'this should be the content of your paragraph...',
      position: { x: centerX, y: 450 },
      type: 'text',
      format: { ...defaultTextFormat },
      titleFormat: { ...defaultTextFormat, fontWeight: 'bold' }
    };
    
    setBlocks([titleBlock, opening1, opening2, opening3, mainBlock]);
  };

  // Helper function to parse font size
  const parseFontSize = (fontSize: string): number => {
    if (!fontSize) return 16;
    return parseInt(fontSize.replace('px', '')) || 16;
  };

  // Add this function at an appropriate place in your component
  const handleFontDropdownClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent other handlers from firing
    e.stopPropagation();
    
    // Keep the dropdown open when clicking inside it
    const searchInput = document.querySelector('.font-search-input') as HTMLInputElement;
    
    // Only focus the search input if we're not clicking on a font option
    if (!(e.target as HTMLElement).closest('.font-option')) {
      // Re-focus the search input
      setTimeout(() => {
        if (searchInput) searchInput.focus();
      }, 0);
    }
  };

  // Modified connection handling methods
  const handleStartConnection = (
    blockId: string, 
    pointPosition: ConnectionPointPosition, 
    position: {x: number, y: number}
  ) => {
    setIsCreatingConnection(true);
    setConnectionStart({
      blockId,
      pointPosition,
      position
    });
  };
  
  const handleFinishConnection = (targetId: string, targetPoint: ConnectionPointPosition) => {
    if (connectionStart && connectionStart.blockId !== targetId) {
      // Create a new connection
      const newConnection: Connection = {
        id: `connection-${Date.now()}`,
        sourceId: connectionStart.blockId,
        targetId: targetId,
        sourcePoint: connectionStart.pointPosition,
        targetPoint: targetPoint,
        type: 'straight',
        color: '#3b82f6' // Default blue color
      };
      
      setConnections(prev => [...prev, newConnection]);
    }
    
    // Reset connection creation state
    setIsCreatingConnection(false);
    setConnectionStart(null);
    setNearestPoint(null);
  };
  
  const handleCancelConnection = () => {
    setIsCreatingConnection(false);
    setConnectionStart(null);
    setNearestPoint(null);
  };
  
  const handleRemoveConnection = (connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
  };
  
  // Function to check if a block has a connection at a specific point
  const hasConnectionAtPoint = (blockId: string, pointPosition: ConnectionPointPosition) => {
    return connections.some(
      conn => 
        (conn.sourceId === blockId && conn.sourcePoint === pointPosition) ||
        (conn.targetId === blockId && conn.targetPoint === pointPosition)
    );
  };
  
  // Get all connection points for a specific block
  const getActiveConnectionsForBlock = (blockId: string): ConnectionPointPosition[] => {
    const activePoints: ConnectionPointPosition[] = [];
    
    connections.forEach(conn => {
      if (conn.sourceId === blockId) {
        activePoints.push(conn.sourcePoint);
      }
      if (conn.targetId === blockId) {
        activePoints.push(conn.targetPoint);
      }
    });
    
    return activePoints;
  };
  
  // Calculate the position of a connection point on a block
  const getConnectionPointPosition = (
    block: Block, 
    pointPosition: ConnectionPointPosition
  ): {x: number, y: number} => {
    // Get the DOM element for this block to get its actual dimensions
    const blockElement = document.getElementById(`block-${block.id}`);
    
    if (!blockElement) {
      // Fallback to calculated values if element not found
      const blockWidth = 320; // Default width
      const blockHeight = 150; // Default height
      
      switch (pointPosition) {
        case 'top':
          return { x: block.position.x + blockWidth / 2, y: block.position.y };
        case 'right':
          return { x: block.position.x + blockWidth, y: block.position.y + blockHeight / 2 };
        case 'bottom':
          return { x: block.position.x + blockWidth / 2, y: block.position.y + blockHeight };
        case 'left':
          return { x: block.position.x, y: block.position.y + blockHeight / 2 };
        default:
          return { x: 0, y: 0 };
      }
    }
    
    // If we have the element, get precise measurements
    const rect = blockElement.getBoundingClientRect();
    const blockWidth = rect.width || 320;
    const blockHeight = rect.height || 150;
    
    // Use offsetParent to account for scrolling
    const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    
    switch (pointPosition) {
      case 'top':
        return { 
          x: block.position.x + blockWidth / 2,
          y: block.position.y
        };
      case 'right':
        return { 
          x: block.position.x + blockWidth,
          y: block.position.y + blockHeight / 2
        };
      case 'bottom':
        return { 
          x: block.position.x + blockWidth / 2,
          y: block.position.y + blockHeight
        };
      case 'left':
        return { 
          x: block.position.x,
          y: block.position.y + blockHeight / 2
        };
      default:
        return { x: 0, y: 0 };
    }
  };
  
  // Updated function to track mouse movement for dynamic connection line with snapping
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isCreatingConnection && connectionStart) {
      // Get the cursor position relative to the whiteboard
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setCursorPosition({x, y});
        
        // Find the nearest connection point to snap to
        let minDistance = Number.MAX_VALUE;
        let closestPoint = null;
        
        blocks.forEach(block => {
          if (block.id === connectionStart.blockId) return; // Skip source block
          
          // For each block, get precise connection points
          const blockElement = document.getElementById(`block-${block.id}`);
          if (!blockElement) return; // Skip if element not found
          
          const rect = blockElement.getBoundingClientRect();
          const blockWidth = rect.width;
          const blockHeight = rect.height;
          
          // Check each connection point on other blocks
          const connectionPoints: { position: ConnectionPointPosition, x: number, y: number }[] = [
            { position: 'top', x: block.position.x + blockWidth / 2, y: block.position.y },
            { position: 'right', x: block.position.x + blockWidth, y: block.position.y + blockHeight / 2 },
            { position: 'bottom', x: block.position.x + blockWidth / 2, y: block.position.y + blockHeight },
            { position: 'left', x: block.position.x, y: block.position.y + blockHeight / 2 }
          ];
          
          connectionPoints.forEach(point => {
            const distance = Math.sqrt(
              Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
            );
            
            // If this point is closer than our current minimum and within snap range (50px)
            if (distance < minDistance && distance < 50) {
              minDistance = distance;
              closestPoint = {
                blockId: block.id,
                pointPosition: point.position,
                position: { x: point.x, y: point.y },
                distance: distance
              };
            }
          });
        });
        
        setNearestPoint(closestPoint);
      }
    }
  };
  
  // Render connections between blocks
  const renderConnections = () => {
    return connections.map(connection => {
      // Find the source and target blocks
      const sourceBlock = blocks.find(block => block.id === connection.sourceId);
      const targetBlock = blocks.find(block => block.id === connection.targetId);
      
      if (!sourceBlock || !targetBlock) {
        // If blocks are not found, don't render the connection
        return null;
      }
      
      // Calculate precise positions based on connection points
      const sourcePos = getConnectionPointPosition(sourceBlock, connection.sourcePoint);
      const targetPos = getConnectionPointPosition(targetBlock, connection.targetPoint);
      
      // For a straight line with an arrow
      const id = connection.id;
      
      // Calculate the offset for the arrowhead to make it stop precisely at the connection point
      // This prevents the arrow from overlapping the connection point
      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const arrowLength = 10; // Length of the arrowhead
      
      // Calculate end point that's slightly before the target to account for arrowhead
      const endX = length === 0 ? targetPos.x : targetPos.x - (dx * arrowLength / length);
      const endY = length === 0 ? targetPos.y : targetPos.y - (dy * arrowLength / length);
      
      return (
        <g key={id}>
          {/* Connection line */}
          <line
            x1={sourcePos.x}
            y1={sourcePos.y}
            x2={endX}
            y2={endY}
            stroke={connection.color || '#3b82f6'}
            strokeWidth={2}
            markerEnd="url(#arrowhead)"
          />
          
          {/* Click area for easier selection */}
          <line
            x1={sourcePos.x}
            y1={sourcePos.y}
            x2={targetPos.x}
            y2={targetPos.y}
            stroke="transparent"
            strokeWidth={10}
            onClick={() => handleRemoveConnection(id)}
            style={{ cursor: 'pointer' }}
          />
        </g>
      );
    });
  };
  
  // Add this function to the Whiteboard component to help with ID generation
  const getBlockId = (id: string) => `block-${id}`;
  const getConnectionPointId = (blockId: string, position: ConnectionPointPosition) => `connection-point-${blockId}-${position}`;

  // Render the temporary connection line while creating
  const renderTemporaryConnection = () => {
    if (isCreatingConnection && connectionStart) {
      // If there's a nearest point to snap to, use that; otherwise use cursor position
      const endPoint = nearestPoint 
        ? nearestPoint.position
        : cursorPosition;
      
      // Use the exact start position from the connection start data
      const startX = connectionStart.position.x;
      const startY = connectionStart.position.y;
      
      // If we have a nearest point, calculate the arrow offset like with permanent connections
      if (nearestPoint) {
        const dx = endPoint.x - startX;
        const dy = endPoint.y - startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const arrowLength = 10; // Same as for permanent connections
        
        // Adjust the end point to leave space for the arrowhead
        const adjustedEndX = length === 0 ? endPoint.x : endPoint.x - (dx * arrowLength / length);
        const adjustedEndY = length === 0 ? endPoint.y : endPoint.y - (dy * arrowLength / length);
        
        return (
          <line
            x1={startX}
            y1={startY}
            x2={adjustedEndX}
            y2={adjustedEndY}
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="0" // Solid line when snapping
            markerEnd="url(#arrowhead)"
          />
        );
      }
      
      // If not snapping, show a dashed line to cursor
      return (
        <line
          x1={startX}
          y1={startY}
          x2={endPoint.x}
          y2={endPoint.y}
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="5,5" // Dashed line when not snapping
        />
      );
    }
    return null;
  };
  
  // Add the arrowhead definition for connections
  const renderSvgDefs = () => {
    return (
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="0"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
        </marker>
      </defs>
    );
  };

  // Add this function to force connection updates when blocks change
  const forceConnectionUpdate = () => {
    // This triggers a re-render of connections without changing them
    if (connections.length > 0) {
      setConnections(prev => [...prev.map(conn => ({...conn, timestamp: Date.now()}))]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Text Formatting Toolbar - Always visible but disabled when no block is active */}
      <div 
        className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm toolbar-container"
        onClick={handleToolbarClick}
        data-toolbar="true"
      >
        <div className="container mx-auto px-2 py-1" onClick={handleToolbarClick}>
          <div className="flex items-center h-10 gap-2 overflow-x-auto" onClick={handleToolbarClick}>
            {/* New Font Family Selector Button */}
            <div className="flex-shrink-0 relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!activeBlockId || !activeEditingField) return;
                  setFontDropdownOpen(!fontDropdownOpen);
                  setFontSearchValue('');
                }}
                className={`font-selector-button h-8 px-3 py-0 text-sm font-medium border border-gray-200 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center justify-between min-w-[130px] ${!activeBlockId || !activeEditingField ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                disabled={!activeBlockId || !activeEditingField}
                tabIndex={activeBlockId && activeEditingField ? 0 : -1}
              >
                <span style={{ fontFamily: getCurrentFormat().fontFamily }}>
                  {fontOptions.find(f => f.value === getCurrentFormat().fontFamily)?.name || 'Arial'}
                </span>
                <span className="ml-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
            </div>

            {/* Font Dropdown */}
            {fontDropdownOpen && (
              <div 
                className="absolute top-10 left-0 mt-1 w-64 max-h-72 bg-white rounded-lg shadow-xl z-50 overflow-hidden border border-gray-200 font-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2 bg-white">
                  <div className="max-h-64 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-1">
                      {fontOptions.map(font => (
                        <button
                          key={font.value}
                          className={`text-left px-3 py-2.5 rounded text-gray-800 hover:bg-gray-100 flex justify-between items-center font-option ${getCurrentFormat().fontFamily === font.value ? 'bg-blue-50' : ''}`}
                          style={{ fontFamily: font.value }}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateFormat('fontFamily', font.value);
                            setFontDropdownOpen(false);
                          }}
                        >
                          <span className="text-md">{font.name}</span>
                          {getCurrentFormat().fontFamily === font.value && (
                            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Separator */}
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

            {/* Font Size Control - Rebuild completely */}
            <div className={`flex items-center h-8 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden ${!activeBlockId || !activeEditingField ? 'opacity-50 pointer-events-none' : ''}`}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (!activeBlockId || !activeEditingField) return;
                  const currentSize = parseFontSize(getCurrentFormat().fontSize);
                  if (currentSize > 8) {
                    updateFormat('fontSize', `${currentSize - 2}px`);
                  }
                }}
                className="flex items-center justify-center w-8 h-full text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-r border-gray-200 dark:border-gray-700"
                title="Decrease font size"
                disabled={!activeBlockId || !activeEditingField}
                tabIndex={activeBlockId && activeEditingField ? 0 : -1}
              >
                <span className="text-lg font-bold">−</span>
              </button>
              <div className="w-12 h-full relative">
                <input
                  type="text"
                  value={parseFontSize(getCurrentFormat().fontSize)}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (!activeBlockId || !activeEditingField) return;
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      updateFormat('fontSize', `${value}px`);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full h-full text-center bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none"
                  disabled={!activeBlockId || !activeEditingField}
                  tabIndex={activeBlockId && activeEditingField ? 0 : -1}
                />
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (!activeBlockId || !activeEditingField) return;
                  const currentSize = parseFontSize(getCurrentFormat().fontSize);
                  updateFormat('fontSize', `${currentSize + 2}px`);
                }}
                className="flex items-center justify-center w-8 h-full text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-l border-gray-200 dark:border-gray-700"
                title="Increase font size"
                disabled={!activeBlockId || !activeEditingField}
                tabIndex={activeBlockId && activeEditingField ? 0 : -1}
              >
                <span className="text-lg font-bold">+</span>
              </button>
            </div>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

            {/* Text Color Button and Dropdown */}
            <div className="flex-shrink-0 relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!activeBlockId || !activeEditingField) return;
                  setTextColorDropdownOpen(!textColorDropdownOpen);
                  setBgColorDropdownOpen(false); // Close the other dropdown
                }}
                className={`h-8 px-3 py-0 text-sm font-medium border border-gray-200 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center justify-between min-w-[100px] ${!activeBlockId || !activeEditingField ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                disabled={!activeBlockId || !activeEditingField}
                tabIndex={activeBlockId && activeEditingField ? 0 : -1}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border border-gray-300" 
                    style={{ backgroundColor: getCurrentFormat().textColor || '#000000' }}
                  ></div>
                  <span>Text</span>
                </div>
                <span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
            </div>

            {/* Background Color Button and Dropdown */}
            <div className="flex-shrink-0 relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!activeBlockId || !activeEditingField) return;
                  setBgColorDropdownOpen(!bgColorDropdownOpen);
                  setTextColorDropdownOpen(false); // Close the other dropdown
                }}
                className={`h-8 px-3 py-0 text-sm font-medium border border-gray-200 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center justify-between min-w-[100px] ${!activeBlockId || !activeEditingField ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                disabled={!activeBlockId || !activeEditingField}
                tabIndex={activeBlockId && activeEditingField ? 0 : -1}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border border-gray-300 relative" 
                    style={{ 
                      backgroundColor: getCurrentFormat().backgroundColor !== 'transparent' 
                        ? getCurrentFormat().backgroundColor 
                        : 'transparent',
                      position: 'relative'
                    }}
                  >
                    {getCurrentFormat().backgroundColor === 'transparent' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-red-500 rotate-45 transform" />
                      </div>
                    )}
                  </div>
                  <span>Background</span>
                </div>
                <span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
            </div>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

            {/* Text Style Buttons */}
            <button 
              onClick={() => {
                if (!activeBlockId || !activeEditingField) return;
                toggleFormatting('fontWeight');
              }} 
              className={`flex items-center justify-center w-8 h-8 rounded-md ${getCurrentFormat().fontWeight === 'bold' ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} ${!activeBlockId || !activeEditingField ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Bold"
              disabled={!activeBlockId || !activeEditingField}
              tabIndex={activeBlockId && activeEditingField ? 0 : -1}
            >
              <span className="material-icons text-xl font-bold">B</span>
            </button>
            
            <button 
              onClick={() => {
                if (!activeBlockId || !activeEditingField) return;
                toggleFormatting('fontStyle');
              }} 
              className={`flex items-center justify-center w-8 h-8 rounded-md ${getCurrentFormat().fontStyle === 'italic' ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} ${!activeBlockId || !activeEditingField ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Italic"
              disabled={!activeBlockId || !activeEditingField}
              tabIndex={activeBlockId && activeEditingField ? 0 : -1}
            >
              <span className="material-icons text-xl italic">I</span>
            </button>
            
            <button 
              onClick={() => {
                if (!activeBlockId || !activeEditingField) return;
                toggleFormatting('isUnderlined');
              }} 
              className={`flex items-center justify-center w-8 h-8 rounded-md ${getCurrentFormat().isUnderlined ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} ${!activeBlockId || !activeEditingField ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Underline"
              disabled={!activeBlockId || !activeEditingField}
              tabIndex={activeBlockId && activeEditingField ? 0 : -1}
            >
              <span className="material-icons text-xl underline">U</span>
            </button>
            
            <button 
              onClick={() => {
                if (!activeBlockId || !activeEditingField) return;
                toggleFormatting('isStrikethrough');
              }} 
              className={`flex items-center justify-center w-8 h-8 rounded-md ${getCurrentFormat().isStrikethrough ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} ${!activeBlockId || !activeEditingField ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Strikethrough"
              disabled={!activeBlockId || !activeEditingField}
              tabIndex={activeBlockId && activeEditingField ? 0 : -1}
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
              className={`flex items-center justify-center w-8 h-8 rounded-md ${getCurrentFormat().textAlign === 'left' ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} ${!activeBlockId || !activeEditingField ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Align Left"
              disabled={!activeBlockId || !activeEditingField}
              tabIndex={activeBlockId && activeEditingField ? 0 : -1}
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
              className={`flex items-center justify-center w-8 h-8 rounded-md ${getCurrentFormat().textAlign === 'center' ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} ${!activeBlockId || !activeEditingField ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Align Center"
              disabled={!activeBlockId || !activeEditingField}
              tabIndex={activeBlockId && activeEditingField ? 0 : -1}
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
              className={`flex items-center justify-center w-8 h-8 rounded-md ${getCurrentFormat().textAlign === 'right' ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} ${!activeBlockId || !activeEditingField ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Align Right"
              disabled={!activeBlockId || !activeEditingField}
              tabIndex={activeBlockId && activeEditingField ? 0 : -1}
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
        onClick={(e) => {
          // Don't deselect if clicking inside toolbar
          const toolbarElement = document.querySelector('.toolbar-container');
          if (toolbarElement && toolbarElement.contains(e.target as Node)) {
            e.stopPropagation();
            console.log("Click in toolbar detected - keeping active state");
            return;
          }
          
          // Cancel connection creation if clicking on empty space
          if (isCreatingConnection) {
            handleCancelConnection();
            return;
          }
          
          // Otherwise deselect
          console.log("Setting active block to null");
          setActiveBlock(null, null);
        }}
        onMouseMove={handleMouseMove}
      >
        {/* Connection lines SVG layer with arrowhead definitions */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {renderSvgDefs()}
          {renderConnections()}
          
          {/* Show connection in progress */}
          {isCreatingConnection && connectionStart && renderTemporaryConnection()}
        </svg>

        {/* Blocks */}
        {blocks.map((block) => {
          if (block.type === 'text') {
            // Get active connections for this block
            const activeConnections = getActiveConnectionsForBlock(block.id);
            
            return (
              <TextBlock
                key={block.id}
                id={block.id}
                title={block.title}
                content={block.content}
                position={block.position}
                format={block.format || defaultTextFormat}
                titleFormat={block.titleFormat || block.format || defaultTextFormat}
                onUpdate={updateBlock}
                onDelete={deleteBlock}
                onPositionChange={updateBlockPosition}
                onActivate={setActiveBlock}
                isActive={activeBlockId === block.id}
                onStartConnection={handleStartConnection}
                onFinishConnection={handleFinishConnection}
                isCreatingConnection={isCreatingConnection}
                isConnectionSource={connectionStart?.blockId === block.id}
                activeConnections={activeConnections}
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
      </div>

      {/* Text Color Popup Modal */}
      {textColorDropdownOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20" onClick={() => setTextColorDropdownOpen(false)}>
          <div 
            className="text-color-modal bg-white rounded-lg shadow-xl p-4 w-64 max-h-[400px] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Text Color</h3>
              <button
                onClick={() => setTextColorDropdownOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {colorOptions.map(color => (
                <div
                  key={color.value}
                  onClick={() => {
                    updateFormat('textColor', color.value);
                    setTextColorDropdownOpen(false);
                  }}
                  className="w-10 h-10 rounded-md cursor-pointer hover:scale-110 transition-transform border border-gray-200 flex items-center justify-center"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {getCurrentFormat().textColor === color.value && (
                    <svg className={`h-6 w-6 ${color.value === '#ffffff' || color.value === '#ffff00' || color.value === '#00ffff' || color.value === '#00ff00' ? 'text-black' : 'text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Background Color Popup Modal */}
      {bgColorDropdownOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20" onClick={() => setBgColorDropdownOpen(false)}>
          <div 
            className="bg-color-modal bg-white rounded-lg shadow-xl p-4 w-64 max-h-[400px] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Background Color</h3>
              <button
                onClick={() => setBgColorDropdownOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div 
              onClick={() => {
                updateFormat('backgroundColor', 'transparent');
                setBgColorDropdownOpen(false);
              }}
              className="flex items-center gap-2 p-2 mb-3 rounded hover:bg-gray-100 cursor-pointer"
            >
              <div className="w-8 h-8 border border-gray-300 rounded relative flex items-center justify-center">
                <div className="w-full h-0.5 bg-red-500 rotate-45 transform absolute" />
              </div>
              <span>Transparent</span>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {colorOptions.map(color => (
                <div
                  key={color.value}
                  onClick={() => {
                    updateFormat('backgroundColor', color.value);
                    setBgColorDropdownOpen(false);
                  }}
                  className="w-10 h-10 rounded-md cursor-pointer hover:scale-110 transition-transform border border-gray-200 flex items-center justify-center"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {getCurrentFormat().backgroundColor === color.value && (
                    <svg className={`h-6 w-6 ${color.value === '#ffffff' || color.value === '#ffff00' || color.value === '#00ffff' || color.value === '#00ff00' ? 'text-black' : 'text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Whiteboard; 