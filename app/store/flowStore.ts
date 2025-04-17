import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { CSSProperties } from 'react';

// Rich text format type definition
type RichTextFormat = {
  start: number;
  end: number;
  format: 'bold' | 'italic' | 'underline' | 'color' | 'fontSize' | 'fontFamily' | 'align';
  value?: string;
};

// Define the shape of our store state
type RFState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (type: string, position: { x: number, y: number }) => void;
  updateNodeText: (
    nodeId: string, 
    text: string, 
    label?: string, 
    name?: string, 
    textStyle?: CSSProperties, 
    fontSize?: string, 
    fontFamily?: string,
    richTextFormats?: RichTextFormat[]
  ) => void;
  deleteNode: (nodeId: string) => void;
  deleteEdge: (edgeId: string) => void;
  deleteEdgesByPosition: (x: number, y: number, radius: number) => void;
};

// Initial nodes for our flow
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'textNode',
    position: { x: 250, y: 5 },
    data: { 
      label: '', 
      text: '',
      name: '',
      textStyle: {},
      fontSize: '14',
      fontFamily: 'Canva Sans',
      richTextFormats: []
    },
  },
];

// Initial edges for our flow
const initialEdges: Edge[] = [];

// Create the store
export const useFlowStore = create<RFState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  
  // Handle node changes (position, selection, etc.)
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  
  // Handle edge changes
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  
  // Handle new connections between nodes
  onConnect: (connection: Connection) => {
    set({
      edges: addEdge({ ...connection, id: uuidv4() }, get().edges),
    });
  },
  
  // Add a new node to the flow
  addNode: (type: string, position: { x: number, y: number }) => {
    const newNode: Node = {
      id: uuidv4(),
      type,
      position,
      data: { 
        label: '', 
        text: '',
        name: '',
        textStyle: {},
        fontSize: '14',
        fontFamily: 'Canva Sans',
        richTextFormats: []
      },
    };
    
    set({
      nodes: [...get().nodes, newNode],
    });
  },
  
  // Update the text content, title, and name of a node with styling options
  updateNodeText: (
    nodeId: string, 
    text: string, 
    label?: string, 
    name?: string, 
    textStyle?: CSSProperties, 
    fontSize?: string, 
    fontFamily?: string,
    richTextFormats?: RichTextFormat[]
  ) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          const updatedData = { ...node.data, text };
          
          // Only update label if provided
          if (label !== undefined) {
            updatedData.label = label;
          }
          
          // Only update name if provided
          if (name !== undefined) {
            updatedData.name = name;
          }
          
          // Only update textStyle if provided
          if (textStyle !== undefined) {
            updatedData.textStyle = textStyle;
          }
          
          // Only update fontSize if provided
          if (fontSize !== undefined) {
            updatedData.fontSize = fontSize;
          }
          
          // Only update fontFamily if provided
          if (fontFamily !== undefined) {
            updatedData.fontFamily = fontFamily;
          }
          
          // Only update richTextFormats if provided
          if (richTextFormats !== undefined) {
            updatedData.richTextFormats = richTextFormats;
          }
          
          return {
            ...node,
            data: updatedData,
          };
        }
        return node;
      }),
    });
  },
  
  // Delete a node and its connected edges
  deleteNode: (nodeId: string) => {
    // Remove the node
    const newNodes = get().nodes.filter((node) => node.id !== nodeId);
    
    // Remove any edges connected to this node
    const newEdges = get().edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    );
    
    set({
      nodes: newNodes,
      edges: newEdges,
    });
  },
  
  // Delete a specific edge by ID
  deleteEdge: (edgeId: string) => {
    const newEdges = get().edges.filter(edge => edge.id !== edgeId);
    set({
      edges: newEdges,
    });
  },
  
  // Delete edges that pass near a specific position (for the knife tool)
  deleteEdgesByPosition: (x: number, y: number, radius: number) => {
    // To determine if an edge is close enough to delete, we calculate the
    // minimum distance from the point (x,y) to the edge path
    // For simplicity, we check proximity to the straight line between source and target
    const edgesToDelete: string[] = [];
    
    get().edges.forEach(edge => {
      // Find source and target nodes to get their positions
      const sourceNode = get().nodes.find(node => node.id === edge.source);
      const targetNode = get().nodes.find(node => node.id === edge.target);
      
      if (sourceNode && targetNode) {
        // Simplification: Calculate center points of nodes
        const sourceX = sourceNode.position.x + (sourceNode.width || 0) / 2;
        const sourceY = sourceNode.position.y + (sourceNode.height || 0) / 2;
        const targetX = targetNode.position.x + (targetNode.width || 0) / 2;
        const targetY = targetNode.position.y + (targetNode.height || 0) / 2;
        
        // Calculate distance from point to line segment
        const distance = distanceToLineSegment(
          sourceX, sourceY, targetX, targetY, x, y
        );
        
        // If close enough, mark for deletion
        if (distance <= radius) {
          edgesToDelete.push(edge.id);
        }
      }
    });
    
    // Delete all marked edges
    const newEdges = get().edges.filter(edge => !edgesToDelete.includes(edge.id));
    set({
      edges: newEdges,
    });
  },
}));

// Helper function to calculate distance from a point to a line segment
function distanceToLineSegment(x1: number, y1: number, x2: number, y2: number, px: number, py: number): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  // Parameter for closest point on line
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;
  
  let xx, yy;
  
  // Find closest point on line segment
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = px - xx;
  const dy = py - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
} 