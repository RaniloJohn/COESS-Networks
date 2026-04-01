"use client";

import { Handle, Position } from '@xyflow/react';
import styles from '../../../app/topology/topology.module.css';
import { DeviceNodeData } from '@/lib/types/topology';
import { CiscoSwitch } from './NetworkIcons';

interface SwitchNodeProps {
  data: DeviceNodeData;
  selected?: boolean;
}

export function SwitchNode({ data, selected }: SwitchNodeProps) {
  return (
    <div className={`${styles.nodeBase} ${styles.switch} ${selected ? styles.selected : ''}`}>
      {/* Dynamic Interface Handles - Centered and invisible for auto-negotiation */}
      {data.interfaces.map((iface) => (
        <Handle
          key={iface.name}
          type="source"
          position={Position.Bottom} 
          id={iface.name}
          style={{ 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            opacity: 0,
            pointerEvents: 'none'
          }}
        />
      ))}

      <div className={styles.nodeIcon}>
        <CiscoSwitch />
      </div>
      <div className={styles.nodeLabel}>{data.label || 'Switch'}</div>
    </div>
  );
}
