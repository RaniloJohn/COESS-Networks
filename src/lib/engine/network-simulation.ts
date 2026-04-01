import { DeviceNodeData, NetworkInterface, RoutingEntry, ArpEntry, HopResult } from '../types/topology';
import { Node, Edge } from '@xyflow/react';

/**
 * COESS Networks — Global Convergence Engine
 * 
 * Simulates Layer 2 and Layer 3 convergence across the entire topology.
 * Updates each device's dynamic routing table and ARP/VLAN states.
 */

export interface SimulationResult {
  updatedNodes: Node[];
}

export function calculateGlobalNetworkState(nodes: Node[], edges: Edge[]): SimulationResult {
  // 1. Initial State Preparation
  const initialNodes = nodes.map(node => {
    const data = node.data as unknown as DeviceNodeData;
    
    // Reset Dynamic Routes (Keep Static 'S' and Connected 'C')
    const staticAndConnected = (data.routingTable || []).filter(r => r.type === 'S' || r.type === 'C');
    
    // Identify Connected Networks ('C')
    const connectedRoutes: RoutingEntry[] = (data.interfaces || [])
      .filter(iface => iface.isUp && iface.ipAddress && iface.subnetMask)
      .map(iface => ({
        type: 'C',
        network: getNetworkAddress(iface.ipAddress!, iface.subnetMask!),
        mask: iface.subnetMask!,
        nextHop: 'directly connected',
        interface: iface.name,
        administrativeDistance: 0,
        metric: 0,
      }));

    const baseRoutes = [...staticAndConnected.filter(r => r.type !== 'C'), ...connectedRoutes];
    
    return {
      ...node,
      data: {
        ...data,
        routingTable: baseRoutes,
      }
    };
  });

  // 2. Simulate Protocol Propagation (RIP/OSPF/BGP)
  let converged = false;
  let iterations = 0;
  let currentNodes = [...initialNodes];

  while (!converged && iterations < 5) {
    let changed = false;
    const nextNodes = currentNodes.map(node => {
      const data = node.data as unknown as DeviceNodeData;
      const neighbors = getNeighbors(node.id, currentNodes, edges);
      const newRoutes: RoutingEntry[] = [...data.routingTable];

      neighbors.forEach(neighbor => {
        const neighborData = neighbor.node.data as unknown as DeviceNodeData;
        const neighborRoutes = neighborData.routingTable || [];

        neighborRoutes.forEach(nRoute => {
          // RIP Propagation
          if (data.rip?.enabled && neighborData.rip?.enabled && data.rip.version === neighborData.rip.version) {
            if (neighborData.rip.networks.some(net => isIpInSubnet(nRoute.network, net, nRoute.mask))) {
              const ripRoute: RoutingEntry = {
                ...nRoute,
                type: 'R',
                nextHop: neighbor.interface.remoteIp || '',
                interface: neighbor.interface.localName,
                administrativeDistance: 120,
                metric: (nRoute.metric || 0) + 1,
              };
              if (addBetterRoute(newRoutes, ripRoute)) changed = true;
            }
          }

          // OSPF Propagation
          if (data.ospf?.enabled && neighborData.ospf?.enabled && data.ospf.processId === neighborData.ospf.processId) {
             // Basic check: share common subnet for adjacency
             if (data.ospf.networks.some(on => isIpInSubnet(neighbor.interface.localIp, on.network, on.wildcardMask ? prefixToMask(32 - maskToPrefix(on.wildcardMask)) : '255.255.255.0'))) {
                const ospfRoute: RoutingEntry = {
                  ...nRoute,
                  type: 'O',
                  nextHop: neighbor.interface.remoteIp || '',
                  interface: neighbor.interface.localName,
                  administrativeDistance: 110,
                  metric: (nRoute.metric || 0) + 10,
                };
                if (addBetterRoute(newRoutes, ospfRoute)) changed = true;
             }
          }
        });
      });

      return { ...node, data: { ...data, routingTable: newRoutes } };
    });

    if (!changed) converged = true;
    currentNodes = nextNodes;
    iterations++;
  }

  // 3. Final State: Generate ARP Tables for direct neighbors
  const finalNodes = currentNodes.map(node => {
     const data = node.data as unknown as DeviceNodeData;
     const arpTable = calculateArpTable(node.id, currentNodes, edges);
     return { ...node, data: { ...data, arpTable } };
  });

  return { updatedNodes: finalNodes };
}

/**
 * Generates ARP entries for all devices on common L2 segments
 */
function calculateArpTable(nodeId: string, nodes: Node[], edges: Edge[]): ArpEntry[] {
  const neighbors = getNeighbors(nodeId, nodes, edges);
  return neighbors
    .filter(n => n.interface.remoteIp)
    .map(n => ({
      ipAddress: n.interface.remoteIp,
      macAddress: n.node.id.substring(0, 8).toUpperCase(), 
      interface: n.interface.localName,
      type: 'dynamic',
    }));
}

/**
 * Simulates a packet traversal across the topology
 */
export function findPacketPath(srcIp: string, dstIp: string, nodes: Node[]): HopResult[] {
  const path: HopResult[] = [];
  let currentHopCount = 0;
  let currentNode = nodes.find(n => (n.data as unknown as DeviceNodeData).interfaces?.some(i => i.ipAddress === srcIp));
  
  if (!currentNode) return [{ nodeId: 'unknown', interfaceName: 'unknown', status: 'failure', reason: 'Source IP not found' }];

  while (currentHopCount < 15) {
    const data = currentNode.data as unknown as DeviceNodeData;
    
    // Check local subnets
    const localInt = (data.interfaces || []).find(i => {
      const addr = i.ipAddress;
      const mask = i.subnetMask;
      return addr && mask && isIpInSubnet(dstIp, addr, mask);
    });

    if (localInt) {
       // NEW: Target Verification (Simulating ARP failure for ghost IPs)
       const targetExists = nodes.some(n => 
         (n.data as unknown as DeviceNodeData).interfaces?.some(i => i.ipAddress === dstIp && i.isUp)
       );

       if (!targetExists) {
         // The router is connected to the right subnet, but the destination device doesn't physically exist
         path.push({ nodeId: currentNode.id, interfaceName: localInt.name, status: 'timeout', reason: 'Host Unreachable' });
         return path;
       }

       path.push({ nodeId: currentNode.id, interfaceName: localInt.name, status: 'success' });
       return path;
    }

    // Routing Lookup
    const route = (data.routingTable || []).find(r => isIpInSubnet(dstIp, r.network, r.mask));
    if (!route) {
       path.push({ nodeId: currentNode.id, interfaceName: 'gateway', status: 'failure', reason: 'No route to host' });
       return path;
    }

    path.push({ nodeId: currentNode.id, interfaceName: route.interface || 'unknown', status: 'success' });

    if (route.nextHop === 'directly connected') return path;

    const nextNode = nodes.find(n => (n.data as unknown as DeviceNodeData).interfaces?.some(i => i.ipAddress === route.nextHop));
    if (!nextNode) {
       path.push({ nodeId: 'unknown', interfaceName: 'unknown', status: 'timeout' });
       return path;
    }

    currentNode = nextNode;
    currentHopCount++;
  }

  return path;
}

// ── Helpers ──

function getNetworkAddress(ip: string, mask: string): string {
  const ipParts = ip.split('.').map(Number);
  const maskParts = mask.split('.').map(Number);
  return ipParts.map((p, i) => p & maskParts[i]).join('.');
}

function isIpInSubnet(ip: string, networkAddr: string, mask: string): boolean {
  if (!ip || !networkAddr || !mask) return false;
  const ipParts = ip.split('.').map(Number);
  const netParts = networkAddr.split('.').map(Number);
  const maskParts = mask.split('.').map(Number);
  
  if (ipParts.length !== 4 || netParts.length !== 4 || maskParts.length !== 4) return false;
  
  return ipParts.every((p, i) => (p & maskParts[i]) === (netParts[i] & maskParts[i]));
}

// Keep the utility imports for OSPF conversion if needed, but we'll stick to robust local logic for now
import { prefixToMask, maskToPrefix } from './ip-math';

function getNeighbors(nodeId: string, nodes: Node[], edges: Edge[]) {
  const nodeEdges = edges.filter(e => e.source === nodeId || e.target === nodeId);
  return nodeEdges.map(edge => {
    const isSource = edge.source === nodeId;
    const neighborId = isSource ? edge.target : edge.source;
    const neighborNode = nodes.find(n => n.id === neighborId);
    
    if (!neighborNode) return null;

    const localNode = nodes.find(n => n.id === nodeId);
    const localData = localNode?.data as unknown as DeviceNodeData;
    const neighborData = neighborNode.data as unknown as DeviceNodeData;

    // Use edge-aware interface lookup to find specifically connected ports
    const localIface = localData.interfaces?.find(i => i.connectedEdgeId === edge.id && i.isUp);
    const remoteIface = neighborData.interfaces?.find(i => i.connectedEdgeId === edge.id && i.isUp);

    if (!localIface || !remoteIface) return null;

    return {
      node: neighborNode,
      interface: {
        localName: localIface.name,
        localIp: localIface.ipAddress || '',
        remoteIp: remoteIface.ipAddress || '',
      }
    };
  }).filter((n): n is NonNullable<typeof n> => n !== null);
}

function addBetterRoute(routes: RoutingEntry[], newRoute: RoutingEntry): boolean {
  const existingIndex = routes.findIndex(r => r.network === newRoute.network);
  if (existingIndex === -1) {
    routes.push(newRoute);
    return true;
  }
  const existing = routes[existingIndex];
  if (newRoute.administrativeDistance! < existing.administrativeDistance!) {
    routes[existingIndex] = newRoute;
    return true;
  }
  if (newRoute.administrativeDistance === existing.administrativeDistance && newRoute.metric! < existing.metric!) {
    routes[existingIndex] = newRoute;
    return true;
  }
  return false;
}
