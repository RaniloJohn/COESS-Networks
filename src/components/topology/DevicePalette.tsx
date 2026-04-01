"use client";

import styles from '../../app/topology/topology.module.css';
import { CiscoRouter, CiscoSwitch, CiscoPC } from './nodes/NetworkIcons';
import { useTopologyStore } from '@/lib/store/topology-store';
import { Minus, Activity, Zap } from 'lucide-react';
import { CableType } from '@/lib/types/topology';

const devices = [
  { type: 'router', label: 'Router', icon: CiscoRouter },
  { type: 'switch', label: 'Switch', icon: CiscoSwitch },
  { type: 'pc', label: 'PC', icon: CiscoPC },
];

const cables: { type: CableType, label: string, icon: any }[] = [
  { type: 'straight', label: 'Straight', icon: Minus },
  { type: 'crossover', label: 'Crossover', icon: Activity },
  { type: 'serial', label: 'Serial', icon: Zap },
];

export function DevicePalette() {
  const { activeCableType, setCableType } = useTopologyStore();

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={styles.palette}>
      <div className={styles.paletteSection}>
        <div className={styles.paletteTitle}>Devices</div>
        <div className={styles.paletteGridHorizontal}>
          {devices.map((device) => (
            <div
              key={device.type}
              className={styles.paletteItemHorizontal}
              onDragStart={(event) => onDragStart(event, device.type)}
              draggable
            >
              <div className={styles.paletteIcon}>
                <device.icon className={styles.paletteIconSvg} />
              </div>
              <span className={styles.paletteLabel}>{device.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.paletteDivider} />

      <div className={styles.paletteSection}>
        <div className={styles.paletteTitle}>Cables</div>
        <div className={styles.paletteGridHorizontal}>
          {cables.map((cable) => (
            <div
              key={cable.type}
              className={`${styles.paletteItemHorizontal} ${activeCableType === cable.type ? styles.activeCable : ''}`}
              onClick={() => setCableType(cable.type)}
            >
              <div className={`${styles.paletteIcon} ${styles.cableIcon}`}>
                <cable.icon size={20} className={cable.type === 'serial' ? styles.serialColor : ''} />
              </div>
              <span className={styles.paletteLabel}>{cable.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
