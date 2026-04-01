"use client";

import { Handle, Position } from '@xyflow/react';
import styles from '../../../app/topology/topology.module.css';
import { DeviceNodeData } from '@/lib/types/topology';
import { CiscoRouter } from './NetworkIcons';

interface RouterNodeProps {
  data: DeviceNodeData;
  selected?: boolean;
}

export function RouterNode({ data, selected }: RouterNodeProps) {
  return (
    <div className={`${styles.nodeBase} ${styles.router} ${selected ? styles.selected : ''}`}>
      {/* Fa0/0 Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="fa0/0"
        className={styles.portHandle}
      />
      <span className={styles.portLabel} style={{ left: '-25px' }}>Fa0/0</span>

      {/* Fa0/1 Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="fa0/1"
        className={styles.portHandle}
      />
      <span className={styles.portLabel} style={{ right: '-25px' }}>Fa0/1</span>

      <div className={styles.nodeIcon}>
        <CiscoRouter />
      </div>
      <div className={styles.nodeLabel}>{data.label || 'Router'}</div>
    </div>
  );
}
