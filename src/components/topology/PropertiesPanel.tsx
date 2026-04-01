"use client";

import { X, Network, Monitor, Layers, Settings2, Terminal as TerminalIcon } from 'lucide-react';
import styles from '../../app/topology/topology.module.css';
import { useTopologyStore } from '@/lib/store/topology-store';
import { NetworkInterface, DeviceNodeData } from '@/lib/types/topology';
import { Terminal } from './Terminal';

export function PropertiesPanel() {
  const { 
    selectedNode, 
    setSelectedNode, 
    updateNodeData,
    terminalOpen,
    setTerminalOpen
  } = useTopologyStore();

  if (!selectedNode) return null;

  const data = selectedNode.data as unknown as DeviceNodeData;
  const type = data.deviceType;

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(selectedNode.id, { label: e.target.value });
  };

  const handleHostnameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(selectedNode.id, { hostname: e.target.value });
  };

  const handleInterfaceChange = (index: number, field: keyof NetworkInterface, value: string) => {
    const newInterfaces = [...data.interfaces];
    newInterfaces[index] = { ...newInterfaces[index], [field]: value };
    updateNodeData(selectedNode.id, { interfaces: newInterfaces });
  };

  const getIcon = () => {
    switch (type) {
      case 'router': return <Network size={20} />;
      case 'switch': return <Layers size={20} />;
      case 'pc': return <Monitor size={20} />;
      default: return <Settings2 size={20} />;
    }
  };

  return (
    <div className={`${styles.propertiesPanel} ${terminalOpen ? styles.wide : ''}`}>
      <div className={styles.propHeader}>
        <div className={styles.propTitle}>
          {getIcon()}
          <span>{`${type.charAt(0).toUpperCase() + type.slice(1)} Config`}</span>
        </div>
        <div className={styles.propHeaderActions}>
          <button 
            onClick={() => setTerminalOpen(!terminalOpen)} 
            className={`${styles.consoleBtn} ${terminalOpen ? styles.active : ''}`}
            title="Open Console"
          >
            <TerminalIcon size={18} />
          </button>
          <button onClick={() => setSelectedNode(null)} className={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
        <div style={{ flex: terminalOpen ? '0 0 300px' : '1', overflowY: 'auto', paddingRight: '12px' }}>
          <div className={styles.propSection}>
            <div className={styles.propGroup}>
              <label className={styles.propLabel}>Display Label</label>
              <input 
                type="text" 
                value={data.label} 
                onChange={handleLabelChange}
                className={styles.inputSmall}
              />
            </div>

            <div className={styles.propGroup}>
              <label className={styles.propLabel}>Hostname</label>
              <input 
                type="text" 
                value={data.hostname} 
                onChange={handleHostnameChange}
                className={styles.inputSmall}
              />
            </div>
          </div>

          <div className={styles.propSection} style={{ marginTop: '20px' }}>
            <label className={styles.propLabel}>Interfaces</label>
            <div className={styles.interfaceList}>
              {data.interfaces.map((iface: NetworkInterface, idx: number) => (
                <div key={iface.name} className={styles.interfaceCard}>
                  <div className={styles.interfaceHeader}>
                    <span>{iface.name}</span>
                    <div className={styles.statusIndicator} style={{ background: iface.isUp ? 'var(--accent-green)' : 'var(--text-tertiary)' }} />
                  </div>
                  
                  {type === 'switch' && !iface.name.toLowerCase().includes('vlan') ? (
                    <div className={styles.l2Message}>
                      Layer 2 Interface - Assign IP via CLI SVI (VLAN)
                    </div>
                  ) : (
                    <>
                      <div className={styles.propGroup}>
                        <label style={{ fontSize: '10px' }}>IP Address</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 192.168.1.1"
                          value={iface.ipAddress}
                          onChange={(e) => handleInterfaceChange(idx, 'ipAddress', e.target.value)}
                          className={styles.inputSmall}
                        />
                      </div>

                      <div className={styles.propGroup}>
                        <label style={{ fontSize: '10px' }}>Subnet Mask</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 255.255.255.0"
                          value={iface.subnetMask}
                          onChange={(e) => handleInterfaceChange(idx, 'subnetMask', e.target.value)}
                          className={styles.inputSmall}
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {terminalOpen && (
          <div style={{ flex: '1', minWidth: '400px', display: 'flex', flexDirection: 'column' }}>
            <label className={styles.propLabel} style={{ marginBottom: '8px' }}>CLI Console</label>
            <Terminal 
              deviceId={selectedNode.id} 
              deviceType={type} 
              hostname={data.hostname || type} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
