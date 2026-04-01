"use client";

import { Handle, Position } from '@xyflow/react';
import { useTopologyStore } from '@/lib/store/topology-store';
import styles from '../../../app/topology/topology.module.css';
import { DeviceNodeData } from '@/lib/types/topology';
import { CiscoSwitch } from './NetworkIcons';

interface SwitchNodeProps {
  data: DeviceNodeData;
  selected?: boolean;
}

export function SwitchNode({ data, selected }: SwitchNodeProps) {
  const toolMode = useTopologyStore((s) => s.toolMode);
  const isCableMode = toolMode === 'cable';

  return (
    <div className={`${styles.nodeBase} ${styles.switch} ${selected ? styles.selected : ''}`}>
      {/* Dynamic Interface Handles - Interactive only in cable mode */}
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
            pointerEvents: isCableMode ? 'auto' : 'none',
            width: isCableMode ? '100%' : '1px',
            height: isCableMode ? '100%' : '1px',
            zIndex: isCableMode ? 10 : -1,
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
