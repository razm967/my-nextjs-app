import { NodeTypes } from 'reactflow';
import TextNode from './nodes/TextNode';
import ConnectorNode from './nodes/ConnectorNode';
import TitleNode from './nodes/TitleNode';

// Define the custom node types available in our application
const nodeTypes: NodeTypes = {
  textNode: TextNode,
  connectorNode: ConnectorNode,
  titleNode: TitleNode,
};

export default nodeTypes; 