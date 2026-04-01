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
import { DeviceNode, DeviceType, DeviceNodeData, createDefaultNodeData, CableType } from '../types/topology';
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
  
  // Cable State
  activeCableType: CableType;
  setCableType: (type: CableType) => void;
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
    const currentEdges = get().edges;
    const currentNodes = get().nodes;
    
    // Handle interface cleanup when an edge is removed
    const removedEdges = changes
      .filter(c => c.type === 'remove')
      .map(c => currentEdges.find(e => e.id === (c as any).id))
      .filter(Boolean);

    if (removedEdges.length > 0) {
      const updatedNodes = [...currentNodes];
      removedEdges.forEach(edge => {
        if (!edge) return;
        
        // Reset source node interface
        const sourceNode = updatedNodes.find(n => n.id === edge.source);
        if (sourceNode) {
          const data = sourceNode.data as unknown as DeviceNodeData;
          const ifaces = data.interfaces.map(i => 
            i.connectedEdgeId === edge.id ? { ...i, isUp: false, connectedEdgeId: undefined } : i
          );
          sourceNode.data = { ...data, interfaces: ifaces } as any;
        }

        // Reset target node interface
        const targetNode = updatedNodes.find(n => n.id === edge.target);
        if (targetNode) {
          const data = targetNode.data as unknown as DeviceNodeData;
          const ifaces = data.interfaces.map(i => 
            i.connectedEdgeId === edge.id ? { ...i, isUp: false, connectedEdgeId: undefined } : i
          );
          targetNode.data = { ...data, interfaces: ifaces } as any;
        }
      });
      
      set({ nodes: updatedNodes });
      // We don't trigger converge yet, it will be done after edges are applied
    }

    set({
      edges: applyEdgeChanges(changes, currentEdges),
    });
    
    if (removedEdges.length > 0) {
      get().converge();
    }
  },

  onConnect: (params) => {
    const { nodes, edges, activeCableType } = get();
    
    // 1. Find 1st available interface on source node
    const sourceNode = nodes.find(n => n.id === params.source);
    const sourceData = sourceNode?.data as unknown as DeviceNodeData;
    const sourceIface = sourceData?.interfaces.find(i => !i.connectedEdgeId && i.name.toLowerCase().startsWith('fast') || i.name.toLowerCase().startsWith('ethernet'));
    
    // 2. Find 1st available interface on target node 
    const targetNode = nodes.find(n => n.id === params.target);
    const targetData = targetNode?.data as unknown as DeviceNodeData;
    const targetIface = targetData?.interfaces.find(i => !i.connectedEdgeId && i.name.toLowerCase().startsWith('fast') || i.name.toLowerCase().startsWith('ethernet'));

    if (!sourceIface || !targetIface) {
      console.warn("No available interfaces for connection");
      return;
    }

    const edgeId = `e-${params.source}-${params.target}-${Date.now()}`;
    const connection: Connection = {
      ...params,
      sourceHandle: sourceIface.name,
      targetHandle: targetIface.name,
    };

    // 3. Update nodes state with allocated interfaces
    const updatedNodes = nodes.map(node => {
      if (node.id === params.source) {
        const data = node.data as unknown as DeviceNodeData;
        const ifaces = data.interfaces.map(i => i.name === sourceIface.name ? { ...i, isUp: true, connectedEdgeId: edgeId } : i);
        return { ...node, data: { ...data, interfaces: ifaces } };
      }
      if (node.id === params.target) {
        const data = node.data as unknown as DeviceNodeData;
        const ifaces = data.interfaces.map(i => i.name === targetIface.name ? { ...i, isUp: true, connectedEdgeId: edgeId } : i);
        return { ...node, data: { ...data, interfaces: ifaces } };
      }
      return node;
    });

    const newEdge: Edge = {
      ...connection,
      id: edgeId,
      type: 'network', // Custom edge type
      data: { cableType: activeCableType }
    } as Edge;

    set({ 
      nodes: updatedNodes as unknown as Node[],
      edges: addEdge(newEdge, edges) 
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

  activeCableType: 'straight',
  setCableType: (type) => set({ activeCableType: type }),
}));
