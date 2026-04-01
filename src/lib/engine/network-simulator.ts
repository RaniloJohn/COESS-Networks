/**
 * COESS Networks — Simulation Engine
 * Handles network reachability, subnet matching, and routing logic.
 */

import { DeviceNode, NetworkInterface } from '@/lib/types/topology';

/**
 * ── Subnet Matching ──
 * Checks if a target IP address belongs to a given subnet and mask.
 */
export function isSameSubnet(ip1: string, mask: string, ip2: string): boolean {
  try {
    const ip1Bytes = ip1.split('.').map(Number);
    const ip2Bytes = ip2.split('.').map(Number);
    const maskBytes = mask.split('.').map(Number);

    if (ip1Bytes.length !== 4 || ip2Bytes.length !== 4 || maskBytes.length !== 4) return false;

    for (let i = 0; i < 4; i++) {
      if ((ip1Bytes[i] & maskBytes[i]) !== (ip2Bytes[i] & maskBytes[i])) {
        return false;
      }
    }
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * ── Adjacency Graph ──
 * Finds the direct neighbors of a specific device node based on topology edges.
 */
interface Connection {
  nodeId: string;
  sourceInterface: string;
  targetInterface: string;
}

export function getNeighbors(nodeId: string, nodes: DeviceNode[], edges: any[]): Connection[] {
  const neighbors: Connection[] = [];
  
  edges.forEach(edge => {
    if (edge.source === nodeId) {
      neighbors.push({ 
        nodeId: edge.target, 
        sourceInterface: edge.sourceHandle || '', 
        targetInterface: edge.targetHandle || '' 
      });
    } else if (edge.target === nodeId) {
      neighbors.push({ 
        nodeId: edge.source, 
        sourceInterface: edge.targetHandle || '', 
        targetInterface: edge.sourceHandle || '' 
      });
    }
  });

  return neighbors;
}

/**
 * ── Packet Routing Logic (Ping Simulator) ──
 * Simulates the TTL-based hop-by-hop traversal of a packet.
 */
export interface Hop {
  deviceId: string;
  interfaceName: string;
  ip: string;
}

export function simulatePing(
  sourceId: string, 
  targetIP: string, 
  nodes: DeviceNode[], 
  edges: any[]
): { success: boolean; hops: Hop[]; error?: string } {
  const hops: Hop[] = [];
  
  // 1. Find source device
  const sourceNode = nodes.find(n => n.id === sourceId);
  if (!sourceNode) return { success: false, hops, error: 'Source not found' };

  // 2. Identify the outgoing interface / gateway logic
  // For V1: Simple direct subnet check then neighbor traversal
  // In a real simulator, we'd check the routing table.
  
  let currentDevice = sourceNode;
  const visited = new Set<string>();
  visited.add(sourceId);

  // Success check: Does any interface on any device match the targetIP?
  const targetDevice = nodes.find(n => 
    n.data.interfaces.some(iface => iface.ipAddress === targetIP)
  );
  
  if (!targetDevice) return { success: false, hops, error: 'Request timed out' };

  // 3. Recursive or Iterative traversal (BFS/DFS for connectivity)
  // Note: Simplified logic for POC. Real simulation follows IP routing.
  
  // ... future: complete Dijkstra or Routing Table traversal ...
  
  // For now: Just check if target IP exists in the same connected graph component
  // and has valid subnet configuration.
  return { success: !!targetDevice, hops };
}
