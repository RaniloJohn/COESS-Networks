"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import styles from '../../app/topology/topology.module.css';
import { 
  CLIState, 
  createInitialState, 
  executeCommand, 
  getPrompt, 
  getSplashText 
} from '../../lib/engine/command-parser';
import { useTopologyStore } from '../../lib/store/topology-store';
import { DeviceType, DeviceNodeData, NetworkInterface } from '../../lib/types/topology';

interface TerminalProps {
  deviceId: string;
  deviceType: DeviceType;
  hostname: string;
}

export function Terminal({ deviceId, deviceType, hostname }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  // Use refs for CLI state so xterm's onData closure always sees the latest value
  const cliStateRef = useRef<CLIState>(createInitialState(deviceType, hostname));
  const inputRef = useRef<string>('');
  const historyIndexRef = useRef<number>(-1);
  // Track hostname via ref to avoid terminal re-init when CLI changes hostname
  const hostnameRef = useRef<string>(hostname);
  hostnameRef.current = hostname;

  const { updateNodeData, nodes } = useTopologyStore();

  // Helper to get fresh interface data from the store
  const getInterfaces = useCallback((): NetworkInterface[] => {
    const node = nodes.find(n => n.id === deviceId);
    if (!node) return [];
    const data = node.data as unknown as DeviceNodeData;
    return data.interfaces || [];
  }, [nodes, deviceId]);

  const getNodeData = useCallback(() => {
    const node = nodes.find(n => n.id === deviceId);
    if (!node) return null;
    return node.data as unknown as DeviceNodeData;
  }, [nodes, deviceId]);

  // Wrapper that calls updateNodeData with the device ID
  const handleUpdateNodeData = useCallback((data: Record<string, any>) => {
    updateNodeData(deviceId, data as any);
  }, [updateNodeData, deviceId]);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Reset state for this device
    cliStateRef.current = createInitialState(deviceType, hostname);
    inputRef.current = '';
    historyIndexRef.current = -1;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"JetBrains Mono", Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#0d1117',
        foreground: '#e6edf3',
        cursor: '#58a6ff',
        selectionBackground: '#264f78',
        black: '#484f58',
        red: '#ff7b72',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39d353',
        white: '#b1bac4',
      },
      scrollback: 1000,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    // Small delay to ensure the container has rendered
    setTimeout(() => fitAddon.fit(), 50);

    // Write splash screen
    const splash = getSplashText(deviceType, hostname);
    term.writeln(splash);

    // Write initial prompt
    const prompt = getPrompt(cliStateRef.current);
    term.write(prompt);

    // ── Input Handler ──
    term.onData((data) => {
      const code = data.charCodeAt(0);

      // Enter key
      if (code === 13) {
        term.write('\r\n');
        const cmd = inputRef.current;
        inputRef.current = '';
        historyIndexRef.current = -1;

        if (cmd.trim()) {
          // Get fresh node data from store at execution time
          const nodeData = getNodeData();
          if (nodeData) {
            const result = executeCommand(
              cmd,
              cliStateRef.current,
              nodeData,
              handleUpdateNodeData,
            );

            // Update CLI state via ref (no React re-render needed)
            cliStateRef.current = result.newState;

            if (result.output) {
              term.writeln(result.output);
            }
          }
        }

        // Write new prompt (may have changed mode)
        term.write(getPrompt(cliStateRef.current));
        return;
      }

      // Backspace
      if (code === 127) {
        if (inputRef.current.length > 0) {
          inputRef.current = inputRef.current.slice(0, -1);
          term.write('\b \b');
        }
        return;
      }

      // Tab — basic completion (just echo for now)
      if (code === 9) {
        return;
      }

      // ? key — inline help
      if (data === '?') {
        term.write('?\r\n');
        const nodeData = getNodeData();
        if (nodeData) {
          const result = executeCommand(
            '?',
            cliStateRef.current,
            nodeData,
            handleUpdateNodeData,
          );
          if (result.output) {
            term.writeln(result.output);
          }
        }
        term.write(getPrompt(cliStateRef.current));
        inputRef.current = '';
        return;
      }

      // Arrow keys (escape sequences: \x1b[A = up, \x1b[B = down)
      if (data === '\x1b[A') {
        // Up arrow — history back
        const history = cliStateRef.current.history;
        if (history.length === 0) return;
        if (historyIndexRef.current === -1) {
          historyIndexRef.current = history.length - 1;
        } else if (historyIndexRef.current > 0) {
          historyIndexRef.current--;
        }
        // Clear current line
        const clearLen = inputRef.current.length;
        term.write('\b \b'.repeat(clearLen));
        inputRef.current = history[historyIndexRef.current];
        term.write(inputRef.current);
        return;
      }

      if (data === '\x1b[B') {
        // Down arrow — history forward
        const history = cliStateRef.current.history;
        if (historyIndexRef.current === -1) return;
        const clearLen = inputRef.current.length;
        term.write('\b \b'.repeat(clearLen));
        if (historyIndexRef.current < history.length - 1) {
          historyIndexRef.current++;
          inputRef.current = history[historyIndexRef.current];
          term.write(inputRef.current);
        } else {
          historyIndexRef.current = -1;
          inputRef.current = '';
        }
        return;
      }

      // Ignore other control characters
      if (code < 32) return;

      // Normal character input
      inputRef.current += data;
      term.write(data);
    });

    xtermRef.current = term;

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      xtermRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, deviceType]);

  return (
    <div className={styles.cliContainer}>
      <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
