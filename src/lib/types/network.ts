/* ============================================
   Network Types — IP Math & Simulation Engine
   ============================================ */

/** Result of a subnet calculation */
export interface SubnetResult {
  /** Original input IP address */
  ipAddress: string;
  /** CIDR prefix length (0-32) */
  prefix: number;
  /** Network address (e.g., "192.168.1.0") */
  networkAddress: string;
  /** Broadcast address (e.g., "192.168.1.255") */
  broadcastAddress: string;
  /** First usable host (e.g., "192.168.1.1") */
  firstUsableHost: string;
  /** Last usable host (e.g., "192.168.1.254") */
  lastUsableHost: string;
  /** Number of usable hosts */
  usableHosts: number;
  /** Total number of IPs in the subnet */
  totalIPs: number;
  /** Subnet mask (e.g., "255.255.255.0") */
  subnetMask: string;
  /** Wildcard mask (e.g., "0.0.0.255") */
  wildcardMask: string;
  /** IP class (A, B, C, D, E) */
  ipClass: string;
  /** CIDR notation (e.g., "192.168.1.0/24") */
  cidrNotation: string;
  /** Binary representation of the IP */
  ipBinary: string;
  /** Binary representation of the subnet mask */
  maskBinary: string;
  /** Binary representation of the network address */
  networkBinary: string;
}

/** A single VLSM allocation for a department/subnet */
export interface VLSMAllocation {
  /** Department or subnet name */
  name: string;
  /** Number of hosts required */
  hostsRequired: number;
  /** Number of hosts allocated (2^n - 2) */
  hostsAllocated: number;
  /** Wasted addresses */
  wastedAddresses: number;
  /** Network address for this allocation */
  networkAddress: string;
  /** Broadcast address */
  broadcastAddress: string;
  /** First usable host */
  firstUsableHost: string;
  /** Last usable host */
  lastUsableHost: string;
  /** Subnet mask */
  subnetMask: string;
  /** CIDR prefix */
  prefix: number;
  /** CIDR notation */
  cidrNotation: string;
}

/** Input for VLSM calculation */
export interface VLSMInput {
  /** Parent network address */
  networkAddress: string;
  /** Parent network prefix */
  prefix: number;
  /** List of departments with host requirements */
  departments: {
    name: string;
    hosts: number;
  }[];
}

/** Result of a VLSM calculation */
export interface VLSMResult {
  /** Parent network CIDR */
  parentNetwork: string;
  /** Total available hosts in parent */
  totalAvailable: number;
  /** Total hosts allocated */
  totalAllocated: number;
  /** Remaining unallocated addresses */
  remainingAddresses: number;
  /** Individual allocations (sorted largest to smallest) */
  allocations: VLSMAllocation[];
  /** Whether the allocation succeeded (enough space) */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/** Tutorial step for step-by-step mode */
export interface TutorialStep {
  /** Step number */
  step: number;
  /** Step title */
  title: string;
  /** Explanation text (supports highlighting) */
  explanation: string;
  /** Optional highlighted value */
  highlight?: string;
  /** Optional binary visualization */
  binary?: {
    value: string;
    networkBits: number;
    hostBits: number;
  };
}

/** Ping simulation result */
export interface PingResult {
  success: boolean;
  sourceDevice: string;
  destinationIP: string;
  replies: PingReply[];
  summary: {
    sent: number;
    received: number;
    lost: number;
    lossPercent: number;
  };
}

export interface PingReply {
  from: string;
  bytes: number;
  time: string;
  ttl: number;
  success: boolean;
  errorMessage?: string;
}

/** Traceroute hop */
export interface TracerouteHop {
  hop: number;
  address: string;
  deviceName: string;
  time: string;
  reachable: boolean;
}

/** Traceroute result */
export interface TracerouteResult {
  source: string;
  destination: string;
  hops: TracerouteHop[];
  reachable: boolean;
}
