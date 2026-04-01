"use client";

import { Handle, Position } from '@xyflow/react';
import styles from '../../../app/topology/topology.module.css';
import { DeviceNodeData } from '@/lib/types/topology';
import { CiscoPC } from './NetworkIcons';

interface PCNodeProps {
  data: DeviceNodeData;
  selected?: boolean;
}

export function PCNode({ data, selected }: PCNodeProps) {
  return (
    <div className={`${styles.nodeBase} ${styles.pc} ${selected ? styles.selected : ''}`}>
      {/* Network Handle (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        id="eth0"
        className={styles.portHandle}
      />
      <span className={styles.portLabel} style={{ top: '-15px' }}>eth0</span>

      <div className={styles.nodeIcon}>
        <CiscoPC />
      </div>
      <div className={styles.nodeLabel}>{data.label || 'PC'}</div>
    </div>
  );
}
