"use client";

import styles from '../../app/topology/topology.module.css';
import { CiscoRouter, CiscoSwitch, CiscoPC } from './nodes/NetworkIcons';

const devices = [
  { type: 'router', label: 'Router', icon: CiscoRouter },
  { type: 'switch', label: 'Switch', icon: CiscoSwitch },
  { type: 'pc', label: 'PC', icon: CiscoPC },
];

export function DevicePalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={styles.palette}>
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
  );
}
