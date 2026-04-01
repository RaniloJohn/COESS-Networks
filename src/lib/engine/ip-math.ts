/* ============================================
   IP Math Engine — Subnet & VLSM Calculator
   Pure client-side TypeScript. No dependencies.
   ============================================ */

import type { SubnetResult, VLSMInput, VLSMResult, VLSMAllocation, TutorialStep } from '@/lib/types/network';

// ── IP Conversion Utilities ──

/** Convert an IP address string to a 32-bit integer */
export function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/** Convert a 32-bit integer to an IP address string */
export function intToIp(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join('.');
}

/** Convert an IP address to its 32-bit binary string */
export function ipToBinary(ip: string): string {
  return ip
    .split('.')
    .map((octet) => parseInt(octet).toString(2).padStart(8, '0'))
    .join('.');
}

/** Convert a binary string (with dots) back to IP */
export function binaryToIp(binary: string): string {
  return binary
    .split('.')
    .map((octet) => parseInt(octet, 2).toString())
    .join('.');
}

/** Convert a prefix length to a subnet mask string */
export function prefixToMask(prefix: number): string {
  if (prefix === 0) return '0.0.0.0';
  const mask = (~0 << (32 - prefix)) >>> 0;
  return intToIp(mask);
}

/** Convert a subnet mask string to a prefix length */
export function maskToPrefix(mask: string): number {
  const num = ipToInt(mask);
  let count = 0;
  let n = num;
  while (n) {
    count += n & 1;
    n >>>= 1;
  }
  return count;
}

/** Calculate the wildcard mask from a subnet mask */
export function getWildcard(mask: string): string {
  const maskInt = ipToInt(mask);
  const wildcard = (~maskInt) >>> 0;
  return intToIp(wildcard);
}

/** Determine the IP class (A, B, C, D, E) */
export function getIpClass(ip: string): string {
  const firstOctet = parseInt(ip.split('.')[0]);
  if (firstOctet >= 1 && firstOctet <= 126) return 'A';
  if (firstOctet === 127) return 'A (Loopback)';
  if (firstOctet >= 128 && firstOctet <= 191) return 'B';
  if (firstOctet >= 192 && firstOctet <= 223) return 'C';
  if (firstOctet >= 224 && firstOctet <= 239) return 'D (Multicast)';
  return 'E (Reserved)';
}

/** Check if an IP is in a given subnet */
export function isIpInSubnet(ip: string, networkAddress: string, prefix: number): boolean {
  const ipInt = ipToInt(ip);
  const netInt = ipToInt(networkAddress);
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return (ipInt & mask) === (netInt & mask);
}

/** Validate an IP address string */
export function isValidIp(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const num = parseInt(part);
    return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
  });
}

/** Validate a CIDR prefix (0-32) */
export function isValidPrefix(prefix: number): boolean {
  return Number.isInteger(prefix) && prefix >= 0 && prefix <= 32;
}

// ── Subnet Calculation ──

/** Calculate full subnet details from IP + prefix */
export function calculateSubnet(ip: string, prefix: number): SubnetResult {
  const ipInt = ipToInt(ip);
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const wildcardInt = (~mask) >>> 0;

  const networkInt = (ipInt & mask) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;

  const networkAddress = intToIp(networkInt);
  const broadcastAddress = intToIp(broadcastInt);
  const subnetMask = intToIp(mask);
  const wildcardMask = intToIp(wildcardInt);

  const totalIPs = Math.pow(2, 32 - prefix);
  const usableHosts = prefix >= 31 ? (prefix === 32 ? 1 : 2) : totalIPs - 2;

  const firstUsableHost = prefix >= 31
    ? networkAddress
    : intToIp(networkInt + 1);
  const lastUsableHost = prefix >= 31
    ? broadcastAddress
    : intToIp(broadcastInt - 1);

  return {
    ipAddress: ip,
    prefix,
    networkAddress,
    broadcastAddress,
    firstUsableHost,
    lastUsableHost,
    usableHosts,
    totalIPs,
    subnetMask,
    wildcardMask,
    ipClass: getIpClass(ip),
    cidrNotation: `${networkAddress}/${prefix}`,
    ipBinary: ipToBinary(ip),
    maskBinary: ipToBinary(subnetMask),
    networkBinary: ipToBinary(networkAddress),
  };
}

// ── VLSM Calculation ──

/** Find the minimum prefix needed to accommodate a number of hosts */
function getMinPrefix(hosts: number): number {
  // We need 2^n >= hosts + 2 (network + broadcast)
  let hostBits = 0;
  while (Math.pow(2, hostBits) < hosts + 2) {
    hostBits++;
  }
  return 32 - hostBits;
}

/** Calculate VLSM allocations from a parent network and department requirements */
export function calculateVLSM(input: VLSMInput): VLSMResult {
  const { networkAddress, prefix, departments } = input;

  // Sort departments by host count (largest first) — VLSM algorithm
  const sorted = [...departments].sort((a, b) => b.hosts - a.hosts);

  const parentNetInt = ipToInt(networkAddress);
  const parentMask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const totalAvailable = Math.pow(2, 32 - prefix);

  let currentAddress = parentNetInt;
  const allocations: VLSMAllocation[] = [];
  let totalAllocated = 0;

  for (const dept of sorted) {
    const subnetPrefix = getMinPrefix(dept.hosts);

    // Check if this subnet prefix is valid (at least as specific as parent)
    if (subnetPrefix < prefix) {
      return {
        parentNetwork: `${networkAddress}/${prefix}`,
        totalAvailable,
        totalAllocated,
        remainingAddresses: totalAvailable - totalAllocated,
        allocations,
        success: false,
        error: `Department "${dept.name}" requires ${dept.hosts} hosts, which exceeds the parent network capacity.`,
      };
    }

    const subnetSize = Math.pow(2, 32 - subnetPrefix);
    const subnetMaskInt = (~0 << (32 - subnetPrefix)) >>> 0;

    // Align current address to subnet boundary
    if (currentAddress % subnetSize !== 0) {
      currentAddress = Math.ceil(currentAddress / subnetSize) * subnetSize;
    }

    // Check if we've exceeded the parent network
    if (currentAddress + subnetSize > parentNetInt + totalAvailable) {
      return {
        parentNetwork: `${networkAddress}/${prefix}`,
        totalAvailable,
        totalAllocated,
        remainingAddresses: totalAvailable - totalAllocated,
        allocations,
        success: false,
        error: `Not enough address space for department "${dept.name}". Ran out of IPs.`,
      };
    }

    const netAddr = intToIp(currentAddress);
    const broadcastAddr = intToIp(currentAddress + subnetSize - 1);
    const hostsAllocated = subnetSize - 2;

    allocations.push({
      name: dept.name,
      hostsRequired: dept.hosts,
      hostsAllocated,
      wastedAddresses: hostsAllocated - dept.hosts,
      networkAddress: netAddr,
      broadcastAddress: broadcastAddr,
      firstUsableHost: intToIp(currentAddress + 1),
      lastUsableHost: intToIp(currentAddress + subnetSize - 2),
      subnetMask: intToIp(subnetMaskInt),
      prefix: subnetPrefix,
      cidrNotation: `${netAddr}/${subnetPrefix}`,
    });

    totalAllocated += subnetSize;
    currentAddress += subnetSize;
  }

  return {
    parentNetwork: `${networkAddress}/${prefix}`,
    totalAvailable,
    totalAllocated,
    remainingAddresses: totalAvailable - totalAllocated,
    allocations,
    success: true,
  };
}

// ── Tutorial Step Generator ──

/** Generate step-by-step tutorial for a subnet calculation */
export function generateSubnetTutorial(ip: string, prefix: number): TutorialStep[] {
  const steps: TutorialStep[] = [];
  const result = calculateSubnet(ip, prefix);

  steps.push({
    step: 1,
    title: 'Identify the Prefix',
    explanation: `Your IP is ${ip} with prefix /${prefix}. This means the first ${prefix} bits are the network portion and the remaining ${32 - prefix} bits are the host portion.`,
    highlight: `/${prefix}`,
    binary: {
      value: result.ipBinary.replace(/\./g, ''),
      networkBits: prefix,
      hostBits: 32 - prefix,
    },
  });

  steps.push({
    step: 2,
    title: 'Convert IP to Binary',
    explanation: `${ip} → ${result.ipBinary}`,
    highlight: result.ipBinary,
  });

  steps.push({
    step: 3,
    title: 'Calculate the Subnet Mask',
    explanation: `With a /${prefix} prefix, the subnet mask has ${prefix} consecutive 1s followed by ${32 - prefix} consecutive 0s: ${result.maskBinary}. In decimal: ${result.subnetMask}`,
    highlight: result.subnetMask,
    binary: {
      value: result.maskBinary.replace(/\./g, ''),
      networkBits: prefix,
      hostBits: 32 - prefix,
    },
  });

  steps.push({
    step: 4,
    title: 'Find the Network Address',
    explanation: `AND the IP with the subnet mask: ${result.ipBinary} AND ${result.maskBinary} = ${result.networkBinary}. The network address is ${result.networkAddress}.`,
    highlight: result.networkAddress,
  });

  steps.push({
    step: 5,
    title: 'Find the Broadcast Address',
    explanation: `Set all host bits to 1: the broadcast address is ${result.broadcastAddress}.`,
    highlight: result.broadcastAddress,
  });

  steps.push({
    step: 6,
    title: 'Calculate Usable Hosts',
    explanation: `Total IPs = 2^${32 - prefix} = ${result.totalIPs}. Usable hosts = ${result.totalIPs} - 2 (network + broadcast) = ${result.usableHosts}. First usable: ${result.firstUsableHost}, Last usable: ${result.lastUsableHost}.`,
    highlight: `${result.usableHosts} hosts`,
  });

  return steps;
}
