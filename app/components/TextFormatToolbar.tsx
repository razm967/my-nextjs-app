import React, { useState } from 'react';
import { FaBold, FaItalic, FaUnderline, FaPalette, FaAlignLeft, FaAlignCenter, FaAlignRight } from 'react-icons/fa';

// Props interface for the text formatting toolbar
interface TextFormatToolbarProps {
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onTextColor: (color: string) => void;
  onFontSize: (size: string) => void;
  onAlign: (align: 'left' | 'center' | 'right') => void;
  onFontFamily: (family: string) => void;
  currentFontSize?: string;
  currentFontFamily?: string;
}

// Text formatting toolbar component
const TextFormatToolbar: React.FC<TextFormatToolbarProps> = ({
  onBold,
  onItalic,
  onUnderline,
  onTextColor,
  onFontSize,
  onAlign,
  onFontFamily,
  currentFontSize = '14',
  currentFontFamily = 'Canva Sans'
}) => {
  // State for color picker
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');

  // Font families
  const fontFamilies = [
    'Canva Sans',
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Courier New',
    'Georgia',
    'Trebuchet MS',
    'Verdana'
  ];

  // Font sizes
  const fontSizes = ['10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72'];
  
  // Predefined colors
  const predefinedColors = [
    '#000000', // Black
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#800000', // Maroon
    '#008000', // Dark Green
    '#000080'  // Navy
  ];
  
  // Prevent event propagation for all events to avoid deselection
  const stopPropagation = (e: React.MouseEvent | React.KeyboardEvent | React.FocusEvent) => {
    e.stopPropagation();
    e.nativeEvent?.stopPropagation();
    e.nativeEvent?.stopImmediatePropagation();
    
    // Prevent default browser behavior for mousedown which can cause selection issues
    if (e.type === 'mousedown') {
      e.preventDefault();
    }
  };

  // Handle font size increment/decrement
  const handleIncrementFontSize = (e: React.MouseEvent) => {
    stopPropagation(e);
    const currentIndex = fontSizes.indexOf(currentFontSize);
    if (currentIndex < fontSizes.length - 1) {
      onFontSize(fontSizes[currentIndex + 1]);
    }
  };

  const handleDecrementFontSize = (e: React.MouseEvent) => {
    stopPropagation(e);
    const currentIndex = fontSizes.indexOf(currentFontSize);
    if (currentIndex > 0) {
      onFontSize(fontSizes[currentIndex - 1]);
    }
  };

  // Handle font family change
  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    stopPropagation(e as unknown as React.MouseEvent);
    onFontFamily(e.target.value);
  };

  // Handle font size change
  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    stopPropagation(e as unknown as React.MouseEvent);
    onFontSize(e.target.value);
  };

  // Handle color selection
  const handleColorSelect = (color: string, e: React.MouseEvent) => {
    stopPropagation(e);
    setSelectedColor(color);
    onTextColor(color);
    setShowColorPicker(false);
  };

  // Toggle color picker
  const toggleColorPicker = (e: React.MouseEvent) => {
    stopPropagation(e);
    setShowColorPicker(!showColorPicker);
  };

  // Common styles for buttons
  const buttonClass = "w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 active:bg-gray-200 transition-colors";
  
  return (
    <div 
      className="absolute top-0 left-0 transform -translate-y-full p-1 bg-white border border-gray-200 rounded-t-md shadow-md z-[999] flex items-center gap-1 min-w-[300px] overflow-x-auto whitespace-nowrap"
      onMouseDown={stopPropagation}
      onClick={stopPropagation}
      onKeyDown={stopPropagation as unknown as React.KeyboardEventHandler}
    >
      {/* Font Family Dropdown - Compact */}
      <select 
        value={currentFontFamily}
        onChange={handleFontFamilyChange}
        className="border border-gray-200 rounded p-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white w-[90px]"
        onMouseDown={stopPropagation}
        onClick={stopPropagation}
        style={{ fontFamily: currentFontFamily }}
      >
        {fontFamilies.map(family => (
          <option key={family} value={family} style={{ fontFamily: family }}>{family}</option>
        ))}
      </select>

      {/* Font Size - Compact */}
      <div className="flex items-center border border-gray-200 rounded overflow-hidden" onMouseDown={stopPropagation}>
        <button 
          className="px-1 bg-white hover:bg-gray-100 active:bg-gray-200 transition-colors text-xs"
          onClick={handleDecrementFontSize}
          onMouseDown={stopPropagation}
        >
          -
        </button>
        <select
          value={currentFontSize}
          onChange={handleFontSizeChange}
          className="text-xs p-1 focus:outline-none bg-white w-9 text-center border-x border-gray-200"
          onMouseDown={stopPropagation}
          onClick={stopPropagation}
        >
          {fontSizes.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        <button 
          className="px-1 bg-white hover:bg-gray-100 active:bg-gray-200 transition-colors text-xs"
          onClick={handleIncrementFontSize}
          onMouseDown={stopPropagation}
        >
          +
        </button>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-200"></div>
      
      {/* Text Formatting Buttons */}
      <button 
        className={buttonClass}
        onClick={(e) => { stopPropagation(e); onBold(); }}
        onMouseDown={stopPropagation}
        title="Bold"
      >
        <FaBold />
      </button>
      <button 
        className={buttonClass}
        onClick={(e) => { stopPropagation(e); onItalic(); }}
        onMouseDown={stopPropagation}
        title="Italic"
      >
        <FaItalic />
      </button>
      <button 
        className={buttonClass}
        onClick={(e) => { stopPropagation(e); onUnderline(); }}
        onMouseDown={stopPropagation}
        title="Underline"
      >
        <FaUnderline />
      </button>
      
      {/* Color Picker - Dropdown */}
      <div className="relative" onMouseDown={stopPropagation}>
        <button 
          className={buttonClass}
          onClick={toggleColorPicker}
          onMouseDown={stopPropagation}
          title="Text Color"
          style={{ color: selectedColor }}
        >
          <FaPalette />
        </button>
        
        {/* Color Picker Dropdown - Horizontal */}
        {showColorPicker && (
          <div 
            className="absolute top-full left-0 mt-1 p-1 bg-white border border-gray-200 rounded shadow-md flex gap-1 z-[1000]"
            onMouseDown={stopPropagation}
            onClick={stopPropagation}
          >
            {predefinedColors.map((color) => (
              <div
                key={color}
                className="w-4 h-4 rounded-full cursor-pointer border border-gray-300"
                style={{ backgroundColor: color }}
                onClick={(e) => handleColorSelect(color, e)}
                onMouseDown={stopPropagation}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Divider */}
      <div className="h-6 w-px bg-gray-200"></div>
      
      {/* Text Alignment */}
      <button 
        className={buttonClass}
        onClick={(e) => { stopPropagation(e); onAlign('left'); }}
        onMouseDown={stopPropagation}
        title="Align Left"
      >
        <FaAlignLeft />
      </button>
      <button 
        className={buttonClass}
        onClick={(e) => { stopPropagation(e); onAlign('center'); }}
        onMouseDown={stopPropagation}
        title="Align Center"
      >
        <FaAlignCenter />
      </button>
      <button 
        className={buttonClass}
        onClick={(e) => { stopPropagation(e); onAlign('right'); }}
        onMouseDown={stopPropagation}
        title="Align Right"
      >
        <FaAlignRight />
      </button>
    </div>
  );
};

export default TextFormatToolbar; 