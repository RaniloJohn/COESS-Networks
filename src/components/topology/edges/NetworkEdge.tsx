"use client";

import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
} from '@xyflow/react';
import { CableType } from '@/lib/types/topology';

export default function NetworkEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  sourceHandleId,
  targetHandleId,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const cableType = (data?.cableType as CableType) || 'straight';

  let stroke = '#ffffff';
  let strokeDasharray = 'none';

  switch (cableType) {
    case 'crossover':
      strokeDasharray = '5,5';
      break;
    case 'serial':
      stroke = '#ef4444'; // Red for Serial links
      break;
    case 'straight':
    default:
      strokeDasharray = 'none';
      break;
  }

  const finalStyle = {
    ...style,
    stroke,
    strokeDasharray,
    strokeWidth: 2,
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={finalStyle} />
      <EdgeLabelRenderer>
        {/* Source Interface Label */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${sourceX + (labelX - sourceX) * 0.2}px,${
              sourceY + (labelY - sourceY) * 0.2
            }px)`,
            background: '#1a1a1a',
            padding: '2px 4px',
            borderRadius: '4px',
            fontSize: '10px',
            color: '#888',
            pointerEvents: 'none',
            border: '1px solid #333',
            zIndex: 10,
          }}
          className="nodrag nopan"
        >
          {sourceHandleId}
        </div>

        {/* Target Interface Label */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${targetX + (labelX - targetX) * 0.2}px,${
              targetY + (labelY - targetY) * 0.2
            }px)`,
            background: '#1a1a1a',
            padding: '2px 4px',
            borderRadius: '4px',
            fontSize: '10px',
            color: '#888',
            pointerEvents: 'none',
            border: '1px solid #333',
            zIndex: 10,
          }}
          className="nodrag nopan"
        >
          {targetHandleId}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
