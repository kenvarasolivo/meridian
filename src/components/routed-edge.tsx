"use client";

import { BaseEdge, type EdgeProps } from "@xyflow/react";

/** Routes the database connection through the gap above Payments. */
export function RoutedEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
  label,
  labelStyle,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
}: EdgeProps) {
  const channel = sourceX + 46;
  const shelf = targetY + 21;
  const radius = 8;
  const upwards = sourceY > shelf;
  const direction = upwards ? -1 : 1;
  const path = `M ${sourceX},${sourceY} H ${channel - radius} Q ${channel},${sourceY} ${channel},${sourceY + radius * direction} V ${shelf - radius * direction} Q ${channel},${shelf} ${channel + radius},${shelf} H ${targetX - radius} Q ${targetX},${shelf} ${targetX},${shelf - radius} V ${targetY}`;
  return (
    <BaseEdge
      path={path}
      markerEnd={markerEnd}
      style={style}
      label={label}
      labelX={channel}
      labelY={(sourceY + shelf) / 2}
      labelStyle={labelStyle}
      labelBgStyle={labelBgStyle}
      labelBgPadding={labelBgPadding}
      labelBgBorderRadius={labelBgBorderRadius}
    />
  );
}
