/**
 * COESS Networks — Cisco IOS Command Engine
 * 
 * A mode-based state machine that simulates real Cisco IOS behavior.
 * Supports Router (IOS), Switch (IOS), and PC (endpoint) modes.
 */

import { 
  DeviceType, 
  NetworkInterface, 
  VlanEntry, 
  RIPConfig, 
  OSPFConfig, 
  BGPConfig, 
  RoutingEntry,
  DeviceNodeData
} from '../types/topology';
import { findPacketPath } from './network-simulation';
import { useTopologyStore } from '../store/topology-store';

// ── CLI Mode Definitions ──

export type CLIMode = 
  | 'user' 
  | 'priv' 
  | 'config' 
  | 'config-if' 
  | 'config-line' 
  | 'config-vlan'
  | 'config-router-rip'
  | 'config-router-ospf'
  | 'config-router-bgp'
  | 'pc';

export interface CLIState {
  mode: CLIMode;
  currentInterface: string | null;
  currentVlan: number | null;
  currentRouterProtocol: string | null;
  hostname: string;
  history: string[];
}

export function createInitialState(deviceType: DeviceType, hostname: string): CLIState {
  return {
    mode: deviceType === 'pc' ? 'pc' : 'user',
    currentInterface: null,
    currentVlan: null,
    currentRouterProtocol: null,
    hostname,
    history: [],
  };
}

export interface CommandResult {
  output: string;
  newState: CLIState;
}

// ── Prompt Generator ──

export function getPrompt(state: CLIState): string {
  const h = state.hostname;
  switch (state.mode) {
    case 'user':               return `${h}>`;
    case 'priv':               return `${h}#`;
    case 'config':             return `${h}(config)#`;
    case 'config-if':          return `${h}(config-if)#`;
    case 'config-line':        return `${h}(config-line)#`;
    case 'config-vlan':        return `${h}(config-vlan)#`;
    case 'config-router-rip':  return `${h}(config-router)#`;
    case 'config-router-ospf': return `${h}(config-router)#`;
    case 'config-router-bgp':  return `${h}(config-router)#`;
    case 'pc':                 return `C:\\Users\\admin>`;
    default:                   return `${h}>`;
  }
}

// ── Splash Screens ──

export function getSplashText(deviceType: DeviceType, hostname: string): string {
  if (deviceType === 'pc') {
    return [
      'Microsoft Windows [Version 10.0.19045.3324]',
      '(c) Microsoft Corporation. All rights reserved.',
      '',
    ].join('\r\n');
  }
  return [
    '',
    `COESS Networks Virtual IOS (${deviceType === 'router' ? 'Router' : 'Switch'})`,
    'Copyright (c) 2026 COESS Networks',
    '',
    `${hostname} con0 is now available`,
    '',
    'Press RETURN to get started.',
    '',
  ].join('\r\n');
}

// ── Shorthand Resolver ──

const SHORTHANDS: Record<string, string> = {
  'en': 'enable',
  'conf': 'configure',
  't': 'terminal',
  'int': 'interface',
  'sh': 'show',
  'run': 'running-config',
  'ip': 'ip',
  'add': 'address',
  'no': 'no',
  'shut': 'shutdown',
  'v': 'vlan',
  'rou': 'router',
  'route': 'route', // Ensure exact match for routing table
  'hos': 'hostname',
  'wr': 'write',
  'mem': 'memory',
  'exit': 'exit',
  'end': 'end',
  'do': 'do',
};

function resolveShorthand(token: string): string {
  const lower = token.toLowerCase();
  
  if (SHORTHANDS[lower]) return SHORTHANDS[lower];
  
  const candidates = [
    'enable', 'configure', 'terminal', 'interface', 'show', 
    'running-config', 'address', 'vlan', 'router', 'hostname', 
    'write', 'shutdown', 'exit', 'end', 'network', 'neighbor',
    'switchport', 'access', 'trunk', 'mode', 'allowed'
  ];
  const match = candidates.find(c => c.startsWith(lower));
  return match || token;
}

function resolveTokens(tokens: string[]): string[] {
  return tokens.map((t, i) => {
    if (i < 3) return resolveShorthand(t);
    return t;
  });
}

function partialMatch(input: string, candidate: string): boolean {
  return candidate.startsWith(input.toLowerCase());
}

// ── The Command Execution Engine ──

export function executeCommand(
  rawInput: string,
  state: CLIState,
  nodeData: DeviceNodeData,
  updateNodeData: (data: Record<string, any>) => void,
): CommandResult {
  const trimmed = rawInput.trim();
  if (!trimmed) return { output: '', newState: state };

  const tokens = resolveTokens(trimmed.split(/\s+/));
  const newState: CLIState = { ...state, history: [...state.history, trimmed] };

  if (state.mode === 'pc') {
    return executePCCommand(tokens, newState, nodeData.interfaces, updateNodeData);
  }

  switch (state.mode) {
    case 'user':
      return executeUserMode(tokens, newState, nodeData);
    case 'priv':
      return executePrivMode(tokens, newState, nodeData);
    case 'config':
      return executeConfigMode(tokens, newState, nodeData, updateNodeData);
    case 'config-if':
      return executeConfigIfMode(tokens, newState, nodeData, updateNodeData);
    case 'config-vlan':
      return executeConfigVlanMode(tokens, newState, updateNodeData);
    case 'config-router-rip':
      return executeConfigRouterRipMode(tokens, newState, updateNodeData);
    case 'config-router-ospf':
      return executeConfigRouterOspfMode(tokens, newState, updateNodeData);
    case 'config-router-bgp':
      return executeConfigRouterBgpMode(tokens, newState, updateNodeData);
    case 'config-line':
      return executeConfigLineMode(tokens, newState);
    default:
      return { output: '', newState };
  }
}

// ════════════════════════════════════════════════════
//   PC / USER / PRIV HANDLERS
// ════════════════════════════════════════════════════

function executePCCommand(
  tokens: string[],
  state: CLIState,
  interfaces: NetworkInterface[],
  updateNodeData: (data: Record<string, any>) => void,
): CommandResult {
  const cmd = tokens[0].toLowerCase();
  
  if (cmd === 'ipconfig') {
    const iface = interfaces[0];
    if (!iface) return { output: 'No ethernet adapters found.', newState: state };
    const out = [
      '', 'Windows IP Configuration', '',
      'Ethernet adapter Local Area Connection:', '',
      `   IPv4 Address. . . . . . . . . . . : ${iface.ipAddress || 'Not configured'}`,
      `   Subnet Mask . . . . . . . . . . . : ${iface.subnetMask || 'Not configured'}`,
      `   Default Gateway . . . . . . . . . : ${iface.defaultGateway || 'Not configured'}`,
    ];
    return { output: out.join('\r\n'), newState: state };
  }

  if (cmd === 'ping') {
    return handlePingCommand(tokens.slice(1), state, interfaces);
  }

  if (cmd === 'hostname') return { output: state.hostname, newState: state };
  if (cmd === 'cls' || cmd === 'clear') return { output: '\x1b[2J\x1b[H', newState: state };

  return { output: `'${tokens[0]}' is not recognized as an command.`, newState: state };
}

function executeUserMode(tokens: string[], state: CLIState, nodeData: DeviceNodeData): CommandResult {
  const cmd = tokens[0].toLowerCase();
  if (cmd === 'enable') return { output: '', newState: { ...state, mode: 'priv' } };
  if (cmd === 'show') return handleShowCommand(tokens.slice(1), state, nodeData);
  if (cmd === 'ping') return handlePingCommand(tokens.slice(1), state, nodeData.interfaces);
  if (cmd === 'exit') return { output: 'Logged out.', newState: state };
  return invalidInput(state);
}

function executePrivMode(tokens: string[], state: CLIState, nodeData: DeviceNodeData): CommandResult {
  const cmd = tokens[0].toLowerCase();
  if (cmd === 'configure') {
    if (!tokens[1] || tokens[1] === 'terminal') {
      return { output: 'Enter configuration commands, one per line.  End with CNTL/Z.', newState: { ...state, mode: 'config' } };
    }
  }
  if (cmd === 'show') return handleShowCommand(tokens.slice(1), state, nodeData);
  if (cmd === 'ping') return handlePingCommand(tokens.slice(1), state, nodeData.interfaces);
  if (cmd === 'disable') return { output: '', newState: { ...state, mode: 'user' } };
  if (cmd === 'write') return { output: 'Building configuration...\r\n[OK]', newState: state };
  if (cmd === 'exit') return { output: '', newState: { ...state, mode: 'user' } };
  return invalidInput(state);
}

// ════════════════════════════════════════════════════
//   CONFIGURATION MODE HANDLERS
// ════════════════════════════════════════════════════

function executeConfigMode(
  tokens: string[],
  state: CLIState,
  nodeData: DeviceNodeData,
  updateNodeData: (data: Record<string, any>) => void,
): CommandResult {
  const cmd = tokens[0].toLowerCase();

  if (cmd === 'hostname') {
    const newName = tokens[1];
    if (!newName) return incompleteCommand(state);
    updateNodeData({ hostname: newName, label: newName });
    return { output: '', newState: { ...state, hostname: newName } };
  }

  if (cmd === 'interface') {
    const ifName = tokens.slice(1).join('');
    const matched = findInterface(ifName, nodeData.interfaces);
    if (!matched) return { output: `% Invalid interface: ${ifName}`, newState: state };
    return { output: '', newState: { ...state, mode: 'config-if', currentInterface: matched.name } };
  }

  if (cmd === 'vlan') {
    const id = parseInt(tokens[1], 10);
    if (isNaN(id)) return incompleteCommand(state);
    return { output: '', newState: { ...state, mode: 'config-vlan', currentVlan: id } };
  }

  if (cmd === 'router') {
    const proto = tokens[1]?.toLowerCase();
    if (proto === 'rip') return { output: '', newState: { ...state, mode: 'config-router-rip', currentRouterProtocol: 'rip' } };
    if (proto === 'ospf') {
      const id = tokens[2];
      if (!id) return incompleteCommand(state);
      return { output: '', newState: { ...state, mode: 'config-router-ospf', currentRouterProtocol: `ospf ${id}` } };
    }
  }

  if (cmd === 'exit' || cmd === 'end') return { output: '', newState: { ...state, mode: 'priv' } };
  if (cmd === 'do') return executePrivMode(tokens.slice(1), state, nodeData);

  return invalidInput(state);
}

function executeConfigIfMode(
  tokens: string[],
  state: CLIState,
  nodeData: DeviceNodeData,
  updateNodeData: (data: Record<string, any>) => void,
): CommandResult {
  const cmd = tokens[0].toLowerCase();
  const interfaces = nodeData.interfaces;

  if (cmd === 'ip' && tokens[1] === 'address') {
    const ip = tokens[2];
    const mask = tokens[3];
    if (!ip || !mask) return incompleteCommand(state);
    const newIfaces = interfaces.map(i => i.name === state.currentInterface ? { ...i, ipAddress: ip, subnetMask: mask } : i);
    updateNodeData({ interfaces: newIfaces });
    return { output: '', newState: state };
  }

  if (cmd === 'no' && tokens[1] === 'shutdown') {
    const newIfaces = interfaces.map(i => i.name === state.currentInterface ? { ...i, isUp: true } : i);
    updateNodeData({ interfaces: newIfaces });
    return { output: `%LINK-3-UPDOWN: Interface ${state.currentInterface}, changed state to up`, newState: state };
  }

  if (cmd === 'shutdown') {
    const newIfaces = interfaces.map(i => i.name === state.currentInterface ? { ...i, isUp: false } : i);
    updateNodeData({ interfaces: newIfaces });
    return { output: `%LINK-5-CHANGED: Interface ${state.currentInterface}, changed state to administratively down`, newState: state };
  }

  if (cmd === 'switchport') {
    const sub = tokens[1]?.toLowerCase();
    if (sub === 'mode') {
      const m = tokens[2]?.toLowerCase() as any;
      const newIfaces = interfaces.map(i => i.name === state.currentInterface ? { ...i, switchportMode: m } : i);
      updateNodeData({ interfaces: newIfaces });
      return { output: '', newState: state };
    }
    if (sub === 'access' && tokens[2] === 'vlan') {
      const v = parseInt(tokens[3], 10);
      const newIfaces = interfaces.map(i => i.name === state.currentInterface ? { ...i, accessVlan: v } : i);
      updateNodeData({ interfaces: newIfaces });
      return { output: '', newState: state };
    }
  }

  if (cmd === 'interface') {
    const ifName = tokens.slice(1).join('');
    const matched = findInterface(ifName, interfaces);
    if (!matched) return { output: `% Invalid interface: ${ifName}`, newState: state };
    return { output: '', newState: { ...state, mode: 'config-if', currentInterface: matched.name } };
  }

  if (cmd === 'exit') return { output: '', newState: { ...state, mode: 'config', currentInterface: null } };
  if (cmd === 'end') return { output: '', newState: { ...state, mode: 'priv', currentInterface: null } };
  if (cmd === 'do') return executePrivMode(tokens.slice(1), state, nodeData);

  return invalidInput(state);
}

function executeConfigVlanMode(tokens: string[], state: CLIState, updateNodeData: (data: Record<string, any>) => void): CommandResult {
  if (tokens[0] === 'name') {
    updateNodeData({ action: 'set-vlan-name', vlanId: state.currentVlan, vlanName: tokens[1] });
    return { output: '', newState: state };
  }
  if (tokens[0] === 'exit') return { output: '', newState: { ...state, mode: 'config', currentVlan: null } };
  return invalidInput(state);
}

function executeConfigRouterRipMode(tokens: string[], state: CLIState, updateNodeData: (data: Record<string, any>) => void): CommandResult {
  if (tokens[0] === 'network') {
    updateNodeData({ action: 'add-rip-network', network: tokens[1] });
    return { output: '', newState: state };
  }
  if (tokens[0] === 'exit') return { output: '', newState: { ...state, mode: 'config', currentRouterProtocol: null } };
  return invalidInput(state);
}

function executeConfigRouterOspfMode(tokens: string[], state: CLIState, updateNodeData: (data: Record<string, any>) => void): CommandResult {
  if (tokens[0] === 'network') {
    updateNodeData({ action: 'add-ospf-network', network: tokens[1], wildcard: tokens[2], area: parseInt(tokens[4], 10) });
    return { output: '', newState: state };
  }
  if (tokens[0] === 'exit') return { output: '', newState: { ...state, mode: 'config', currentRouterProtocol: null } };
  return invalidInput(state);
}

function executeConfigRouterBgpMode(tokens: string[], state: CLIState, updateNodeData: (data: Record<string, any>) => void): CommandResult {
  if (tokens[0] === 'network') {
    updateNodeData({ action: 'add-bgp-network', network: tokens[1] });
    return { output: '', newState: state };
  }
  if (tokens[0] === 'exit') return { output: '', newState: { ...state, mode: 'config', currentRouterProtocol: null } };
  return invalidInput(state);
}

function executeConfigLineMode(tokens: string[], state: CLIState): CommandResult {
  if (tokens[0] === 'exit') return { output: '', newState: { ...state, mode: 'config' } };
  return { output: '', newState: state };
}

// ════════════════════════════════════════════════════
//   SHOW HANDLERS
// ════════════════════════════════════════════════════

function handleShowCommand(tokens: string[], state: CLIState, nodeData: DeviceNodeData): CommandResult {
  const sub = tokens[0]?.toLowerCase();
  
  if (sub === 'ip') {
    const next = tokens[1]?.toLowerCase();
    if (next === 'interface') {
      const lines = ['Interface              IP-Address      OK? Method Status                Protocol'];
      nodeData.interfaces.forEach(i => lines.push(`${i.name.padEnd(22)} ${(i.ipAddress || 'unassigned').padEnd(15)} YES manual ${i.isUp ? 'up' : 'down'} up`));
      return { output: lines.join('\r\n'), newState: state };
    }
    if (next === 'route') {
      const lines = ['Codes: C - connected, S - static, R - RIP, O - OSPF, B - BGP', '', 'Gateway of last resort is not set', ''];
      (nodeData.routingTable || []).forEach(r => {
        const subnet = r.mask?.split('.').filter(x => x === '255').length * 8 || 0;
        lines.push(`${r.type}    ${r.network}/${subnet} [${r.administrativeDistance}/${r.metric}] via ${r.nextHop}, ${r.interface}`);
      });
      return { output: lines.join('\r\n'), newState: state };
    }
  }

  if (sub === 'vlan') {
    const lines = ['VLAN Name                             Status    Ports', '---- -------------------------------- --------- -------------------------------'];
    (nodeData.vlans || []).forEach(v => lines.push(`${v.id.toString().padEnd(4)} ${v.name.padEnd(32)} active`));
    return { output: lines.join('\r\n'), newState: state };
  }

  if (sub === 'arp' || (sub === 'ip' && tokens[1] === 'arp')) {
    const lines = ['Protocol  Address          Age (min)  Hardware Addr   Type   Interface'];
    (nodeData.arpTable || []).forEach(a => {
      lines.push(`Internet  ${a.ipAddress.padEnd(15)}    -          ${a.macAddress.padEnd(13)}   ARPA   ${a.interface}`);
    });
    return { output: lines.join('\r\n'), newState: state };
  }

  if (sub === 'running-config') {
    const lines = [
      'Building configuration...',
      '',
      'Current configuration : 1024 bytes',
      '!',
      'version 15.2',
      '!',
      `hostname ${state.hostname}`,
      '!',
      '!',
      '!',
      '!',
    ];
    nodeData.interfaces.forEach(iface => {
      lines.push(`interface ${iface.name}`);
      if (iface.ipAddress) {
        lines.push(` ip address ${iface.ipAddress} ${iface.subnetMask}`);
      } else {
        lines.push(' no ip address');
      }
      if (iface.isUp === false) {
        lines.push(' shutdown');
      } else {
        lines.push(' no shutdown');
      }
      if (iface.switchportMode) lines.push(` switchport mode ${iface.switchportMode}`);
      if (iface.accessVlan) lines.push(` switchport access vlan ${iface.accessVlan}`);
      lines.push('!');
    });
    
    if (nodeData.rip?.enabled) {
        lines.push('router rip');
        lines.push(` version ${nodeData.rip.version}`);
        nodeData.rip.networks.forEach(net => lines.push(` network ${net}`));
        lines.push('!');
    }
    
    return { output: lines.join('\r\n'), newState: state };
  }

  return { output: `% Unrecognized show command`, newState: state };
}

// ── Helpers ──

function findInterface(name: string, interfaces: NetworkInterface[]): NetworkInterface | undefined {
  const lower = name.toLowerCase().replace(/\s+/g, '');
  return interfaces.find(i => {
    const iName = i.name.toLowerCase().replace(/\s+/g, '');
    const shortName = iName.replace('fastethernet', 'fa').replace('gigabitethernet', 'gi');
    return iName === lower || shortName === lower;
  });
}

function invalidInput(state: CLIState): CommandResult {
  return { output: '% Invalid input detected at \'^\' marker.', newState: state };
}

function incompleteCommand(state: CLIState): CommandResult {
  return { output: '% Incomplete command.', newState: state };
}

function handlePingCommand(tokens: string[], state: CLIState, interfaces: NetworkInterface[]): CommandResult {
  const target = tokens[0];
  if (!target) return { output: state.mode === 'pc' ? 'Usage: ping <ip>' : '% Incomplete command.', newState: state };
  
  const nodes = useTopologyStore.getState().nodes;
  
  // Find a source IP. In IOS, it often uses the outgoing interface. 
  // For our sim, we'll pick the first up interface with an IP.
  const sourceIface = interfaces.find(i => i.isUp && i.ipAddress);
  if (!sourceIface) return { output: state.mode === 'pc' ? 'Interface not configured.' : '% No source IP found.', newState: state };
  
  const path = findPacketPath(sourceIface.ipAddress, target, nodes);
  const last = path[path.length - 1];
  
  if (state.mode === 'pc') {
    if (last && last.status === 'success') {
      return { output: `Pinging ${target} with 32 bytes of data:\r\nReply from ${target}: bytes=32 time<1ms TTL=128\r\nReply from ${target}: bytes=32 time<1ms TTL=128\r\nReply from ${target}: bytes=32 time<1ms TTL=128\r\nReply from ${target}: bytes=32 time<1ms TTL=128\r\n\r\nPing statistics for ${target}:\r\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)`, newState: state };
    }
    return { output: `Pinging ${target} with 32 bytes of data:\r\nRequest timed out.\r\nRequest timed out.\r\nRequest timed out.\r\nRequest timed out.\r\n\r\nPing statistics for ${target}:\r\n    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)`, newState: state };
  } else {
    // IOS Style Result
    if (last && last.status === 'success') {
      return { output: `Type escape sequence to abort.\r\nSending 5, 100-byte ICMP Echos to ${target}, timeout is 2 seconds:\r\n!!!!!\r\nSuccess rate is 100 percent (5/5), round-trip min/avg/max = 1/1/1 ms`, newState: state };
    }
    return { output: `Type escape sequence to abort.\r\nSending 5, 100-byte ICMP Echos to ${target}, timeout is 2 seconds:\r\n.....\r\nSuccess rate is 0 percent (0/5)`, newState: state };
  }
}

function isValidIPv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => {
    const n = parseInt(p, 10);
    return !isNaN(n) && n >= 0 && n <= 255;
  });
}
