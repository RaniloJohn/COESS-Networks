import { create } from 'zustand';
import { 
  Connection, 
  Edge, 
  EdgeChange, 
  Node, 
  NodeChange, 
  addEdge, 
  applyEdgeChanges, 
  applyNodeChanges,
} from '@xyflow/react';
import { DeviceNode, DeviceType, DeviceNodeData, createDefaultNodeData } from '../types/topology';
import { calculateGlobalNetworkState } from '../engine/network-simulation';

interface TopologyState {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addDevice: (type: DeviceType, position: { x: number, y: number }) => void;
  updateNodeData: (nodeId: string, data: Partial<DeviceNodeData>) => void;
  selectedNode: Node | null;
  setSelectedNode: (node: Node | null) => void;
  
  // Terminal State
  terminalOpen: boolean;
  setTerminalOpen: (open: boolean) => void;
  
  // Persistence/Bulk
  setTopology: (nodes: Node[], edges: Edge[]) => void;
  clearTopology: () => void;
  deleteSelected: () => void;
  
  // View State
  toolMode: 'select' | 'delete';
  setToolMode: (mode: 'select' | 'delete') => void;
  
  // Simulation
  converge: () => void;
}

export const useTopologyStore = create<TopologyState>((set, get) => ({
  nodes: [],
  edges: [],

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
    get().converge();
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addDevice: (type, position) => {
    const id = `${type}-${Date.now()}`;
    const index = get().nodes.length + 1;
    const newNode: DeviceNode = {
      id,
      type,
      position,
      data: createDefaultNodeData(type, index),
    };

    set({ nodes: [...get().nodes, newNode as unknown as Node] });
  },

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          const prevData = node.data as unknown as DeviceNodeData;
          let newData = { ...prevData, ...data };

          // Handle Action-based updates
          if ((data as any).action) {
            switch ((data as any).action) {
              case 'set-vlan-name':
                const vlans = [...(prevData.vlans || [])];
                const vIdx = vlans.findIndex(v => v.id === (data as any).vlanId);
                if (vIdx !== -1) {
                  vlans[vIdx] = { ...vlans[vIdx], name: (data as any).vlanName };
                } else {
                  vlans.push({ id: (data as any).vlanId, name: (data as any).vlanName, ports: [] });
                }
                newData = { ...newData, vlans };
                break;
              case 'add-rip-network':
                const ripNets = [...(prevData.rip?.networks || [])];
                if (!ripNets.includes((data as any).network)) ripNets.push((data as any).network);
                newData = { ...newData, rip: { ...prevData.rip, enabled: true, networks: ripNets } };
                break;
              case 'add-ospf-network':
                const ospfNets = [...(prevData.ospf?.networks || [])];
                ospfNets.push({ 
                  network: (data as any).network, 
                  wildcardMask: (data as any).wildcard, 
                  area: (data as any).area 
                });
                newData = { ...newData, ospf: { ...prevData.ospf, enabled: true, networks: ospfNets } };
                break;
              case 'set-ospf-router-id':
                newData = { ...newData, ospf: { ...prevData.ospf, enabled: true, routerId: (data as any).routerId } };
                break;
              case 'add-bgp-network':
                const bgpNets = [...(prevData.bgp?.networks || [])];
                if (!bgpNets.includes((data as any).network)) bgpNets.push((data as any).network);
                newData = { ...newData, bgp: { ...prevData.bgp, enabled: true, networks: bgpNets } };
                break;
              case 'add-bgp-neighbor':
                const neighbors = [...(prevData.bgp?.neighbors || [])];
                neighbors.push({ ip: (data as any).ip, remoteAsn: (data as any).remoteAsn });
                newData = { ...newData, bgp: { ...prevData.bgp, enabled: true, neighbors } };
                break;
            }
            // Remove action from final data
            delete (newData as any).action;
          }

          return { ...node, data: newData };
        }
        return node;
      }),
    });
    
    // Sync selectedNode if it's the one being updated
    const updatedNode = get().nodes.find(n => n.id === nodeId);
    if (updatedNode && get().selectedNode?.id === nodeId) {
      set({ selectedNode: updatedNode });
    }

    get().converge();
  },

  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node }),

  terminalOpen: false,
  setTerminalOpen: (open) => set({ terminalOpen: open }),

  setTopology: (nodes, edges) => set({ nodes, edges }),
  
  clearTopology: () => set({ nodes: [], edges: [], selectedNode: null }),

  deleteSelected: () => {
    const { selectedNode, nodes, edges } = get();
    if (!selectedNode) return;

    set({
      nodes: nodes.filter((n) => n.id !== selectedNode.id),
      edges: edges.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id),
      selectedNode: null,
    });
  },

  toolMode: 'select',
  setToolMode: (mode) => set({ toolMode: mode }),

  converge: () => {
    const { nodes, edges } = get();
    const result = calculateGlobalNetworkState(nodes, edges);
    set({ nodes: result.updatedNodes });
  },
}));
