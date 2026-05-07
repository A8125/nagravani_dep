import { Fragment, useEffect, useMemo, useState } from "react";
import { CircleMarker, Tooltip } from "react-leaflet";
import { getWardStats, type WardStat } from "../lib/api";

const MAP_CENTER: [number, number] = [12.5218, 76.8951];
const LOW_COLOR = [29, 158, 117] as const;
const MID_COLOR = [239, 159, 39] as const;
const HIGH_COLOR = [226, 75, 74] as const;

const WARD_CENTERS: Record<string, [number, number]> = {
  "Ward 1 - Mandya Town": [12.5218, 76.8951],
  "Ward 2 - Mandya Town": [12.5252, 76.9012],
  "Ward 3 - Mandya Town": [12.5281, 76.8898],
  "Ward 4 - Mandya Town": [12.5168, 76.9035],
  "Ward 5 - Mandya Town": [12.5144, 76.8874],
  "Ward 6 - Mandya Town": [12.5322, 76.8966],
  "Ward 7 - Mandya Town": [12.5193, 76.9081],
  "Ward 8 - Mandya Town": [12.5107, 76.8962],
  "Ward 9 - Mandya Town": [12.5267, 76.8829],
  "Ward 10 - Mandya Town": [12.5364, 76.9046],
  "Ward 11 - Mandya Town": [12.5079, 76.9059],
  "Ward 12 - Mandya Town": [12.5331, 76.8861],
};

function mixChannel(start: number, end: number, amount: number) {
  return Math.round(start + (end - start) * amount);
}

function interpolateColor(
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  amount: number,
) {
  return `rgb(${mixChannel(from[0], to[0], amount)}, ${mixChannel(from[1], to[1], amount)}, ${mixChannel(from[2], to[2], amount)})`;
}

function getHeatColor(count: number, maxCount: number) {
  if (count <= 0 || maxCount <= 0) return "#1D9E75";

  const ratio = Math.min(count / maxCount, 1);
  if (ratio <= 0.5) {
    return interpolateColor(LOW_COLOR, MID_COLOR, ratio / 0.5);
  }

  return interpolateColor(MID_COLOR, HIGH_COLOR, (ratio - 0.5) / 0.5);
}

function getSeverityLabel(avgPriority: number) {
  if (avgPriority >= 80) return "High";
  if (avgPriority >= 50) return "Medium";
  return "Low";
}

function getWardCenter(ward: string, index: number): [number, number] {
  const hardcodedCenter = WARD_CENTERS[ward];
  if (hardcodedCenter) return hardcodedCenter;

  const angle = (index / 12) * Math.PI * 2;
  const latOffset = Math.sin(angle) * 0.015;
  const lngOffset = Math.cos(angle) * 0.018;

  return [MAP_CENTER[0] + latOffset, MAP_CENTER[1] + lngOffset];
}

export default function WardHeatMap() {
  const [wardStats, setWardStats] = useState<WardStat[]>([]);

  useEffect(() => {
    let active = true;

    getWardStats()
      .then((rows) => {
        if (active) setWardStats(rows);
      })
      .catch((err) => {
        console.error("[WardHeatMap]", err);
      });

    return () => {
      active = false;
    };
  }, []);

  const maxCount = useMemo(
    () => wardStats.reduce((highest, stat) => Math.max(highest, stat.count), 0),
    [wardStats],
  );

  return (
    <>
      {wardStats.map((stat, index) => {
        const center = getWardCenter(stat.ward, index);
        const radius = 15 + ((stat.count / Math.max(maxCount, 1)) * 35);
        const color = getHeatColor(stat.count, maxCount);
        const severity = stat.severity ?? getSeverityLabel(stat.avg_priority);

        return (
          <Fragment key={`${stat.ward}-${stat.count}-${stat.top_category ?? "none"}`}>
            <CircleMarker
              key={`${stat.ward}-outer`}
              center={center}
              radius={radius + 6}
              pathOptions={{
                color,
                opacity: 0.35,
                weight: 6,
                fillOpacity: 0,
              }}
            />
            <CircleMarker
              key={`${stat.ward}-${stat.count}-${stat.top_category ?? "none"}`}
              center={center}
              radius={radius}
              pathOptions={{
                color,
                fillColor: color,
                opacity: 0.85,
                fillOpacity: 0.85,
                weight: 2,
              }}
            >
              <Tooltip direction="top" opacity={0.95}>
                <div className="min-w-[180px]">
                  <div className="font-semibold">{stat.ward}</div>
                  <div>Complaints: {stat.count}</div>
                  <div>Top category: {stat.top_category ?? "No active category"}</div>
                  <div>Severity: {severity}</div>
                </div>
              </Tooltip>
            </CircleMarker>
          </Fragment>
        );
      })}
    </>
  );
}
