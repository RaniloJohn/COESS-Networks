"use client";

import { useCallback, useEffect, useRef } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  Panel,
  ReactFlowProvider,
  useReactFlow,
  ConnectionMode
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import styles from './topology.module.css';

// Import Custom Components
import { RouterNode } from '@/components/topology/nodes/RouterNode';
import { SwitchNode } from '@/components/topology/nodes/SwitchNode';
import { PCNode } from '@/components/topology/nodes/PCNode';
import { DevicePalette } from '@/components/topology/DevicePalette';
import { PropertiesPanel } from '@/components/topology/PropertiesPanel';
import NetworkEdge from '@/components/topology/edges/NetworkEdge';
import { useTopologyStore } from '@/lib/store/topology-store';
import { DeviceType, TopologyData } from '@/lib/types/topology';
import { Save, FolderOpen, Trash2, Loader2, MousePointer2, X, Layers } from 'lucide-react';
import { useState } from 'react';

// Define Node Types (outside to keep stable)
const nodeTypes = {
  router: RouterNode,
  switch: SwitchNode,
  pc: PCNode,
};

const edgeTypes = {
  network: NetworkEdge,
};

function TopologyBuilder() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  
  const { 
    nodes, 
    edges, 
    selectedNode,
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    addDevice, 
    setSelectedNode,
    setTopology,
    clearTopology,
    deleteSelected,
    toolMode,
    setToolMode
  } = useTopologyStore();

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Persistence Logic ──
  const handleSave = async () => {
    setSaving(true);
    try {
      const topologyData: TopologyData = {
        metadata: {
          name: 'My Custom Topology',
          description: 'A manually designed network',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        nodes,
        edges,
      };

      const res = await fetch('/api/topologies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topologyData),
      });

      if (!res.ok) throw new Error('Failed to save');
      alert('Topology saved successfully!');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/topologies');
      const data = await res.json();

      if (data.topologies && data.topologies.length > 0) {
        const first = data.topologies[0].data; // For now, load the latest
        setTopology(first.nodes, first.edges);
      } else {
        alert('No saved topologies found.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Drag & Drop Handlers ──
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow') as DeviceType;
    if (!type) return;

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    addDevice(type, position);
  }, [screenToFlowPosition, addDevice]);

  // ── Layout Tweak ──
  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.classList.add('wide');

    return () => {
      if (mainContent) mainContent.classList.remove('wide');
    };
  }, []);

  return (
    <div className={styles.wrapper} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        className={toolMode === 'delete' ? 'delete-mode' : ''}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeClick={(_, node) => {
          if (toolMode === 'delete') {
            const changes: any[] = [{ id: node.id, type: 'remove' }];
            onNodesChange(changes);
            setSelectedNode(null);
          } else {
            setSelectedNode(node);
          }
        }}
        onEdgeClick={(_, edge) => {
          if (toolMode === 'delete') {
            const changes: any[] = [{ id: edge.id, type: 'remove' }];
            onEdgesChange(changes);
          }
        }}
        onPaneClick={() => setSelectedNode(null)}
        colorMode="dark"
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <Background gap={20} size={1} color="rgba(255, 255, 255, 0.05)" />
        <Controls showInteractive={false} />
        <MiniMap 
          position="bottom-left"
          nodeStrokeWidth={3} 
          maskColor="rgba(0, 0, 0, 0.1)"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
        />
        
        <Panel position="top-left" className={styles.toolbar}>
          <div className={styles.toolbarTitle}>
            <Layers size={18} />
            <span>Tools</span>
          </div>
          
          <div className={styles.toolbarActions}>
            <button onClick={handleSave} disabled={saving} className={styles.actionBtn}>
              {saving ? <Loader2 className={styles.spin} size={16} /> : <Save size={16} />}
              <span>Save</span>
            </button>
            <button onClick={handleLoad} disabled={loading} className={styles.actionBtn}>
              {loading ? <Loader2 className={styles.spin} size={16} /> : <FolderOpen size={16} />}
              <span>Load</span>
            </button>
            <div className={styles.divider} />
            <button onClick={deleteSelected} className={`${styles.actionBtn} ${styles.dangerBtn}`} title="Delete Selection (Backspace)">
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
            <button onClick={clearTopology} className={`${styles.actionBtn} ${styles.dangerBtn}`} title="Clear All">
              <Trash2 size={16} />
              <span>Clear</span>
            </button>
            <div className={styles.divider} />
            <div className={styles.toolGroup}>
              <button 
                onClick={() => setToolMode('select')} 
                className={`${styles.toolBtn} ${toolMode === 'select' ? styles.activeTool : ''}`}
                title="Selection Tool (V)"
              >
                <MousePointer2 size={16} />
              </button>
              <button 
                onClick={() => setToolMode('delete')} 
                className={`${styles.toolBtn} ${toolMode === 'delete' ? styles.activeTool : ''} ${styles.dangerTool}`}
                title="Delete Tool (D)"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </Panel>

        <Panel position="bottom-center">
          <DevicePalette />
        </Panel>

        {selectedNode && (
          <Panel position="top-right">
            <PropertiesPanel />
          </Panel>
        )}

        <Panel position="bottom-right" className={styles.stats}>
          Nodes: {nodes.length} | Edges: {edges.length}
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function TopologyPage() {
  return (
    <ReactFlowProvider>
      <TopologyBuilder />
    </ReactFlowProvider>
  );
}
