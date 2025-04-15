# Flow Whiteboard App

A modern, interactive flow-based whiteboard application built with Next.js, ReactFlow, and TypeScript.

## Features

- Create and connect nodes with an intuitive interface
- Edit node content with a simple double-click
- Context menu for node operations (delete, duplicate)
- Export your diagrams as PDF
- Responsive design that works on various screen sizes
- Pan, zoom and navigate your whiteboard with ease

## Tech Stack

- **Next.js 15**: Modern React framework for production
- **ReactFlow**: Library for building node-based editors and diagrams
- **TypeScript**: Strongly typed programming language
- **Zustand**: State management solution
- **jsPDF**: PDF generation library
- **TailwindCSS**: Utility-first CSS framework
- **React Zoom Pan Pinch**: For advanced zoom and pan functionality

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- npm or yarn

### Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd flow-whiteboard
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating Nodes

- Click the "Add Text Node" button in the toolbar
- Nodes will be added to the center of your current view

### Editing Nodes

- Double-click on a node to edit its content
- Press Enter to save changes or Escape to cancel

### Connecting Nodes

- Drag from a handle (small circle) on one node to a handle on another node
- This creates a connection (edge) between the nodes

### Node Operations

- Right-click on a node to open the context menu
- Use the context menu to delete or duplicate nodes

### Navigation

- Use the mouse wheel to zoom in/out
- Drag the background to pan around
- Use the controls on the bottom right or the minimap for navigation
- Click "Fit View" to center all nodes in view

### Exporting

- Click the "Export PDF" button to save your diagram as a PDF file

## Customization

The whiteboard can be easily extended with:

- Custom node types
- Additional control buttons
- Different edge types and styles
- Advanced layout algorithms

## License

This project is licensed under the MIT License.
