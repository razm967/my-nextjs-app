// my-nextjs-app/app/store/historyStore.ts
import { create } from 'zustand';
import { useFlowStore } from './flowStore';
import { Node, Edge } from 'reactflow';

// Define the state snapshot type
type StateSnapshot = {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
};

// Define the history store type
type HistoryState = {
  past: StateSnapshot[];
  future: StateSnapshot[];
  isSaving: boolean;
  
  // Methods
  saveState: () => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  startBatchOperation: () => void;
  endBatchOperation: () => void;
};

// Create history store
export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  isSaving: false,
  
  // Save current state to history
  saveState: () => {
    // Skip if we're in the middle of an undo/redo operation
    if (get().isSaving) return;
    
    const { nodes, edges } = useFlowStore.getState();
    
    // Create a snapshot
    const snapshot: StateSnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      timestamp: Date.now()
    };
    
    set(state => ({
      past: [...state.past, snapshot],
      future: [], // Clear redo history on new action
    }));
  },
  
  // Undo the last action
  undo: () => {
    const { past } = get();
    
    if (past.length === 0) return;
    
    // Mark that we're in an undo operation
    set({ isSaving: true });
    
    // Get the current state for the redo stack
    const { nodes, edges } = useFlowStore.getState();
    const currentState: StateSnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      timestamp: Date.now()
    };
    
    // Get the last state from history
    const previousState = past[past.length - 1];
    
    // Apply the previous state
    useFlowStore.setState({
      nodes: previousState.nodes,
      edges: previousState.edges
    });
    
    // Update history stacks
    set(state => ({
      past: state.past.slice(0, state.past.length - 1),
      future: [currentState, ...state.future],
      isSaving: false
    }));
  },
  
  // Redo the previously undone action
  redo: () => {
    const { future } = get();
    
    if (future.length === 0) return;
    
    // Mark that we're in a redo operation
    set({ isSaving: true });
    
    // Get the current state for the undo stack
    const { nodes, edges } = useFlowStore.getState();
    const currentState: StateSnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      timestamp: Date.now()
    };
    
    // Get the next state from the future stack
    const nextState = future[0];
    
    // Apply the future state
    useFlowStore.setState({
      nodes: nextState.nodes,
      edges: nextState.edges
    });
    
    // Update history stacks
    set(state => ({
      past: [...state.past, currentState],
      future: state.future.slice(1),
      isSaving: false
    }));
  },
  
  // Clear all history
  clearHistory: () => {
    set({
      past: [],
      future: []
    });
  },
  
  // Start a batch operation (prevents saving intermittent states)
  startBatchOperation: () => {
    set({ isSaving: true });
  },
  
  // End a batch operation and save the final state
  endBatchOperation: () => {
    set({ isSaving: false });
    get().saveState();
  }
}));