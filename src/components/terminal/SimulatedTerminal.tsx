"use client";

import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useTopologyStore } from '@/lib/store/topology-store';
import { 
  executeCommand, 
  createInitialState, 
  CLIState, 
  getPrompt,
  getSplashText
} from '@/lib/engine/command-parser';
import { DeviceNodeData } from '@/lib/types/topology';

interface SimulatedTerminalProps {
  nodeId: string;
}

export default function SimulatedTerminal({ nodeId }: SimulatedTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const cliStateRef = useRef<CLIState | null>(null);
  const inputRef = useRef<string>('');
  
  const { nodes, updateNodeData } = useTopologyStore();
  const activeNode = nodes.find(n => n.id === nodeId);

  useEffect(() => {
    if (!terminalRef.current || !activeNode) return;

    const data = activeNode.data as unknown as DeviceNodeData;
    
    // Initialize CLI State
    cliStateRef.current = createInitialState(data.deviceType, data.hostname);

    // Initialize Terminal
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'JetBrains Mono, Menlo, monospace',
      theme: {
        background: '#0d1117',
        foreground: '#e6edf3',
        cursor: '#58a6ff',
        selectionBackground: 'rgba(88, 166, 255, 0.3)',
      },
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    fitAddon.fit();
    
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Splash Text
    term.write(getSplashText(data.deviceType, data.hostname));
    term.write(getPrompt(cliStateRef.current));

    // Input Handling
    term.onData(input => {
      const code = input.charCodeAt(0);
      
      if (code === 13) { // Enter
        term.write('\r\n');
        const cmd = inputRef.current.trim();
        
        if (cmd && cliStateRef.current) {
          const nodeData = (nodes.find(n => n.id === nodeId)?.data as unknown as DeviceNodeData);
          const result = executeCommand(
            cmd,
            cliStateRef.current,
            nodeData,
            (update) => updateNodeData(nodeId, update as any)
          );
          
          cliStateRef.current = result.newState;
          if (result.output) {
            term.writeln(result.output);
          }
        }
        
        inputRef.current = '';
        if (cliStateRef.current) {
          term.write(getPrompt(cliStateRef.current));
        }
      } else if (code === 127) { // Backspace
        if (inputRef.current.length > 0) {
          inputRef.current = inputRef.current.slice(0, -1);
          term.write('\b \b');
        }
      } else if (code >= 32) { // Typed text
        inputRef.current += input;
        term.write(input);
      }
    });

    // Cleanup
    return () => {
      term.dispose();
    };
  }, [nodeId]); // Re-init if nodeId changes

  // Handle resizing
  useEffect(() => {
    const handleResize = () => {
      fitAddonRef.current?.fit();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      ref={terminalRef} 
      style={{ 
        width: '100%', 
        height: '350px', 
        background: '#0d1117',
        padding: '10px',
        borderRadius: '6px',
        overflow: 'hidden'
      }} 
    />
  );
}
