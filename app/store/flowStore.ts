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
};

// Initial nodes for our flow
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'textNode',
    position: { x: 250, y: 5 },
    data: { 
      label: 'Start here', 
      text: 'Welcome to Flow Whiteboard!',
      name: 'Initial Node',
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
        label: `New ${type}`, 
        text: 'Add your text here',
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
})); 