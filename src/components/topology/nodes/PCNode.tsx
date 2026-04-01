"use client";

import { Handle, Position } from '@xyflow/react';
import { useTopologyStore } from '@/lib/store/topology-store';
import styles from '../../../app/topology/topology.module.css';
import { DeviceNodeData } from '@/lib/types/topology';
import { CiscoPC } from './NetworkIcons';

interface PCNodeProps {
  data: DeviceNodeData;
  selected?: boolean;
}

export function PCNode({ data, selected }: PCNodeProps) {
  const toolMode = useTopologyStore((s) => s.toolMode);
  const isCableMode = toolMode === 'cable';

  return (
    <div className={`${styles.nodeBase} ${styles.pc} ${selected ? styles.selected : ''}`}>
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
        <CiscoPC />
      </div>
      <div className={styles.nodeLabel}>{data.label || 'PC'}</div>
    </div>
  );
}
