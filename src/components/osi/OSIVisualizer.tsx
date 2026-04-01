'use client';

import { useState } from 'react';
import { 
  Layers, Database, Network, Share2, 
  Cpu, Activity, AppWindow, ChevronDown, 
  ChevronUp, Zap, Info
} from 'lucide-react';
import styles from './OSIVisualizer.module.css';

interface OSILayer {
  number: number;
  name: string;
  dataUnit: string;
  description: string;
  protocols: string[];
  icon: any;
  color: string;
}

const OSI_LAYERS: OSILayer[] = [
  {
    number: 7,
    name: 'Application',
    dataUnit: 'Data',
    description: 'The layer that provides network services directly to applications. It interfaces with the software you use, such as web browsers or email clients.',
    protocols: ['HTTP', 'HTTPS', 'FTP', 'DNS', 'SMTP', 'SSH'],
    icon: AppWindow,
    color: '#ff5f1f', // Bright orange
  },
  {
    number: 6,
    name: 'Presentation',
    dataUnit: 'Data',
    description: 'Responsible for data translation, encryption, and compression. It ensures that the sending and receiving systems can understand the data being exchanged.',
    protocols: ['SSL', 'TLS', 'JPEG', 'MPEG', 'GIF'],
    icon: Layers,
    color: '#ffac1c', // Golden yellow
  },
  {
    number: 5,
    name: 'Session',
    dataUnit: 'Data',
    description: 'Maintains connections and is responsible for controlling ports and sessions. It manages the setup, coordination, and termination of communication.',
    protocols: ['NetBIOS', 'RPC', 'PPTP', 'PAP'],
    icon: Activity,
    color: '#f0c000', // Yellow
  },
  {
    number: 4,
    name: 'Transport',
    dataUnit: 'Segments',
    description: 'Responsible for end-to-end communication, flow control, and error correction. It breaks data into segments and ensures they arrive in order.',
    protocols: ['TCP', 'UDP', 'SCTP'],
    icon: Share2,
    color: '#3fb950', // Green
  },
  {
    number: 3,
    name: 'Network',
    dataUnit: 'Packets',
    description: 'Handles routing and addressing of data between different networks. This is where IP addresses live and where routers operate.',
    protocols: ['IPv4', 'IPv6', 'ICMP', 'IPsec', 'IGMP'],
    icon: Network,
    color: '#00d4ff', // Cyan
  },
  {
    number: 2,
    name: 'Data Link',
    dataUnit: 'Frames',
    description: 'Provides reliable data transfer between two nodes on the same network. It handles physical addressing (MAC addresses) and error detection.',
    protocols: ['Ethernet', 'PPP', 'Switching', 'VLAN', 'ARP'],
    icon: Database,
    color: '#58a6ff', // Blue
  },
  {
    number: 1,
    name: 'Physical',
    dataUnit: 'Bits',
    description: 'The physical medium through which raw bitstreams are transmitted. Includes hardware, cables, frequencies, and pinouts.',
    protocols: ['Ethernet Physical', 'Wi-Fi Frequencies', 'Fiber Optics', 'USB'],
    icon: Cpu,
    color: '#bc8cff', // Purple
  },
];

export default function OSIVisualizer() {
  const [expandedLayer, setExpandedLayer] = useState<number | null>(7);

  const toggleLayer = (num: number) => {
    setExpandedLayer(expandedLayer === num ? null : num);
  };

  return (
    <div className={styles.visualizer}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          <Layers className={styles.titleIcon} />
          OSI 7-Layer Model
        </h2>
        <p className={styles.subtitle}>
          Click a layer to explore its function, data units, and protocols.
        </p>
      </header>

      <div className={styles.stack}>
        {OSI_LAYERS.map((layer) => {
          const isExpanded = expandedLayer === layer.number;
          const Icon = layer.icon;

          return (
            <div 
              key={layer.number} 
              className={`${styles.layer} ${isExpanded ? styles.expanded : ''}`}
              style={{ '--layer-color': layer.color } as any}
            >
              <button 
                className={styles.layerHeader} 
                onClick={() => toggleLayer(layer.number)}
              >
                <div className={styles.layerInfo}>
                  <div className={styles.layerNumber}>L{layer.number}</div>
                  <div className={styles.iconBox}>
                    <Icon size={18} />
                  </div>
                  <div className={styles.layerName}>{layer.name}</div>
                </div>
                
                <div className={styles.headerRight}>
                  <span className={styles.dataUnit}>{layer.dataUnit}</span>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>

              {isExpanded && (
                <div className={styles.content}>
                  <div className={styles.description}>
                    <p>{layer.description}</p>
                  </div>
                  
                  <div className={styles.protocolGrid}>
                    <div className={styles.protocolHeader}>
                      <Zap size={14} />
                      <span>Protocols & Technologies</span>
                    </div>
                    <div className={styles.tags}>
                      {layer.protocols.map((p) => (
                        <span key={p} className={styles.tag}>{p}</span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.dataUnitInfo}>
                    <Info size={14} />
                    <span>Data at this layer is wrapped in **{layer.dataUnit}**</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <footer className={styles.footer}>
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={styles.dot} style={{ background: '#ff5f1f' }} />
            <span>Host Layers (Software)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.dot} style={{ background: '#00d4ff' }} />
            <span>Media Layers (Hardware)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
