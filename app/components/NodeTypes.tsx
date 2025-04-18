import { NodeTypes } from 'reactflow';
import TextNode from './nodes/TextNode';
import ConnectorNode from './nodes/ConnectorNode';
import TitleNode from './nodes/TitleNode';
import GroupNode from './GroupNode';

// Define the custom node types available in our application
const nodeTypes: NodeTypes = {
  textNode: TextNode,
  connectorNode: ConnectorNode,
  titleNode: TitleNode,
  groupNode: GroupNode
};

export default nodeTypes; 