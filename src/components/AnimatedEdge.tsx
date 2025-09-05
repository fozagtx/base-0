import React from "react";
import { EdgeProps, getStraightPath } from "reactflow";

const AnimatedEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) => {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <g>
      {/* Define the flowing gradient */}
      <defs>
        <linearGradient
          id={`flowingGradient-${id}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="rgba(59, 130, 246, 0)" />
          <stop offset="30%" stopColor="rgba(59, 130, 246, 0.8)" />
          <stop offset="70%" stopColor="rgba(147, 197, 253, 1)" />
          <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
        </linearGradient>
      </defs>

      {/* Background edge */}
      <path
        id={id}
        style={{ ...style, strokeWidth: 3 }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />

      {/* Animated flowing particles */}
      <path
        d={edgePath}
        fill="none"
        stroke={`url(#flowingGradient-${id})`}
        strokeWidth="2"
        strokeDasharray="8 12"
        className="power-flow"
      />
    </g>
  );
};

export default AnimatedEdge;
