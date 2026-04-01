import { z } from 'zod';

/* ============================================
   Topology Types — React Flow Device Nodes
   ============================================ */

/** Device types available in the topology builder */
export type DeviceType = 'router' | 'switch' | 'pc' | 'server';

/** Network interface on a device */
export interface NetworkInterface {
  name: string;
  ipAddress: string;
  subnetMask: string;
  defaultGateway?: string;
  isUp: boolean;
  connectedEdgeId?: string;
  // Switch-specific
  switchportMode?: 'access' | 'trunk' | 'none';
  accessVlan?: number;
  trunkAllowedVlans?: number[];
  description?: string;
}

const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/** Zod Schema for validation */
export const interfaceSchema = z.object({
  name: z.string(),
  ipAddress: z.string().regex(ipv4Regex).optional().or(z.literal('')),
  subnetMask: z.string().regex(ipv4Regex).optional().or(z.literal('')),
  defaultGateway: z.string().regex(ipv4Regex).optional().or(z.literal('')),
  isUp: z.boolean(),
  connectedEdgeId: z.string().optional(),
});

// ── Routing Table ──

export interface RoutingEntry {
  type: 'C' | 'S' | 'R' | 'O' | 'B'; // Connected, Static, RIP, OSPF, BGP
  network: string;
  mask: string;
  nextHop: string;            // IP or interface name
  interface?: string;          // Outgoing interface
  metric?: number;
  administrativeDistance?: number;
}

// ── VLAN Table (Switch) ──

export interface VlanEntry {
  id: number;
  name: string;
  ports: string[];             // Interface names assigned to this VLAN
}

// ── ARP Table ──

export interface ArpEntry {
  ipAddress: string;
  macAddress: string;
  interface: string;
  type: 'dynamic' | 'static';
}

export interface HopResult {
  nodeId: string;
  interfaceName: string;
  status: 'success' | 'failure' | 'timeout';
  reason?: string;
}

// ── Routing Protocol State ──

export interface RIPConfig {
  enabled: boolean;
  version: 1 | 2;
  networks: string[];           // Networks being advertised
}

export interface OSPFConfig {
  enabled: boolean;
  processId: number;
  routerId: string;
  networks: { network: string; wildcardMask: string; area: number }[];
}

export interface BGPConfig {
  enabled: boolean;
  asn: number;
  neighbors: { ip: string; remoteAsn: number }[];
  networks: string[];
}

// ── Enable Password ──

export interface SecurityConfig {
  enablePassword?: string;
  enableSecret?: string;
  consolePassword?: string;
  vtyPassword?: string;
}

/** Data payload for a device node in React Flow */
export interface DeviceNodeData {
  label: string;
  deviceType: DeviceType;
  interfaces: NetworkInterface[];
  hostname: string;

  // Routing (Router)
  routingTable: RoutingEntry[];
  rip: RIPConfig;
  ospf: OSPFConfig;
  bgp: BGPConfig;

  // Switching (Switch)
  vlans: VlanEntry[];

  // Shared
  arpTable: ArpEntry[];
  security: SecurityConfig;
}

export const deviceNodeDataSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  deviceType: z.enum(['router', 'switch', 'pc', 'server']),
  interfaces: z.array(interfaceSchema),
  hostname: z.string().min(1, 'Hostname is required'),
});

export interface DeviceNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: DeviceNodeData;
}

export const deviceNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  data: deviceNodeDataSchema,
});

/** Complete topology data structure */
export interface TopologyData {
  metadata: {
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  };
  nodes: any[];
  edges: any[];
}

export const topologySchema = z.object({
  metadata: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  nodes: z.array(z.object({
    id: z.string(),
    type: z.string(),
    position: z.object({ x: z.number(), y: z.number() }),
    data: deviceNodeDataSchema,
  })),
  edges: z.array(z.any()),
});

// ── Default State Factories ──

const DEFAULT_RIP: RIPConfig = { enabled: false, version: 2, networks: [] };
const DEFAULT_OSPF: OSPFConfig = { enabled: false, processId: 1, routerId: '', networks: [] };
const DEFAULT_BGP: BGPConfig = { enabled: false, asn: 0, neighbors: [], networks: [] };
const DEFAULT_SECURITY: SecurityConfig = {};

const DEFAULT_VLANS: VlanEntry[] = [
  { id: 1, name: 'default', ports: [] },
];

/** Default interface templates per device type */
export const DEFAULT_INTERFACES: Record<DeviceType, NetworkInterface[]> = {
  router: [
    { name: 'FastEthernet0/0', ipAddress: '', subnetMask: '', isUp: false, switchportMode: 'none' },
    { name: 'FastEthernet0/1', ipAddress: '', subnetMask: '', isUp: false, switchportMode: 'none' },
    { name: 'Serial0/0', ipAddress: '', subnetMask: '', isUp: false, switchportMode: 'none' },
  ],
  switch: [
    { name: 'FastEthernet0/1', ipAddress: '', subnetMask: '', isUp: true, switchportMode: 'access', accessVlan: 1 },
    { name: 'FastEthernet0/2', ipAddress: '', subnetMask: '', isUp: true, switchportMode: 'access', accessVlan: 1 },
    { name: 'FastEthernet0/3', ipAddress: '', subnetMask: '', isUp: true, switchportMode: 'access', accessVlan: 1 },
    { name: 'FastEthernet0/4', ipAddress: '', subnetMask: '', isUp: true, switchportMode: 'access', accessVlan: 1 },
    { name: 'FastEthernet0/5', ipAddress: '', subnetMask: '', isUp: true, switchportMode: 'access', accessVlan: 1 },
    { name: 'FastEthernet0/6', ipAddress: '', subnetMask: '', isUp: true, switchportMode: 'access', accessVlan: 1 },
    { name: 'FastEthernet0/7', ipAddress: '', subnetMask: '', isUp: true, switchportMode: 'access', accessVlan: 1 },
    { name: 'FastEthernet0/8', ipAddress: '', subnetMask: '', isUp: true, switchportMode: 'access', accessVlan: 1 },
    { name: 'FastEthernet0/24', ipAddress: '', subnetMask: '', isUp: true, switchportMode: 'access', accessVlan: 1 },
    { name: 'Vlan1', ipAddress: '', subnetMask: '', isUp: true, switchportMode: 'none' },
  ],
  pc: [
    { name: 'Ethernet0', ipAddress: '', subnetMask: '', defaultGateway: '', isUp: true, switchportMode: 'none' },
  ],
  server: [
    { name: 'Ethernet0', ipAddress: '', subnetMask: '', defaultGateway: '', isUp: true, switchportMode: 'none' },
  ],
};

/** Create default DeviceNodeData for a given type */
export function createDefaultNodeData(type: DeviceType, index: number): DeviceNodeData {
  return {
    label: `${type.charAt(0).toUpperCase() + type.slice(1)}${index}`,
    deviceType: type,
    hostname: `${type.charAt(0).toUpperCase() + type.slice(1)}${index}`,
    interfaces: DEFAULT_INTERFACES[type].map(i => ({ ...i })),
    routingTable: [],
    rip: { ...DEFAULT_RIP },
    ospf: { ...DEFAULT_OSPF },
    bgp: { ...DEFAULT_BGP },
    vlans: type === 'switch' ? DEFAULT_VLANS.map(v => ({ ...v, ports: [...v.ports] })) : [],
    arpTable: [],
    security: { ...DEFAULT_SECURITY },
  };
}
