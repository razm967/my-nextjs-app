import { NodeTypes } from 'reactflow';
import TextNode from './nodes/TextNode';
import ConnectorNode from './nodes/ConnectorNode';

// Define the custom node types available in our application
const nodeTypes: NodeTypes = {
  textNode: TextNode,
  connectorNode: ConnectorNode,
};

export default nodeTypes; 