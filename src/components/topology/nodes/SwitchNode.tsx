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
      {/* 4 Multi-Port Handles */}
      <Handle type="target" position={Position.Top} id="fa0/1" className={styles.portHandle} />
      <Handle type="source" position={Position.Bottom} id="fa0/2" className={styles.portHandle} />
      <Handle type="target" position={Position.Left} id="fa0/3" className={styles.portHandle} />
      <Handle type="source" position={Position.Right} id="fa0/4" className={styles.portHandle} />

      <div className={styles.nodeIcon}>
        <CiscoSwitch />
      </div>
      <div className={styles.nodeLabel}>{data.label || 'Switch'}</div>
    </div>
  );
}
