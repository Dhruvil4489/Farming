'use client';

import React, { useMemo, useState } from 'react';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';

interface TelemetryPoint {
  measuredAt: string;
  soilMoisturePct: number | null;
  airTempC: number | null;
  airHumidityPct: number | null;
  qualityStatus: string;
  isDemo: boolean;
  [key: string]: any;
}

interface IotHistoryChartProps {
  data: TelemetryPoint[];
  range: '24h' | '7d';
  isDemo: boolean;
}

type Metric = 'moisture' | 'temperature' | 'humidity';

const METRIC_CONFIG: Record<Metric, { label: string; unit: string; color: string; key: keyof TelemetryPoint; min: number; max: number }> = {
  moisture: { label: 'Soil Moisture', unit: '%', color: '#0891b2', key: 'soilMoisturePct', min: 0, max: 100 },
  temperature: { label: 'Air Temperature', unit: '°C', color: '#ea580c', key: 'airTempC', min: -10, max: 55 },
  humidity: { label: 'Air Humidity', unit: '%', color: '#6366f1', key: 'airHumidityPct', min: 0, max: 100 },
};

// Aggregate points for 7-day view to prevent infinite chart points
function aggregatePoints(
  points: { x: number; y: number; date: Date; quality: string }[],
  maxPoints: number
): { x: number; y: number; date: Date; quality: string }[] {
  if (points.length <= maxPoints) return points;
  const bucketSize = Math.ceil(points.length / maxPoints);
  const result: { x: number; y: number; date: Date; quality: string }[] = [];

  for (let i = 0; i < points.length; i += bucketSize) {
    const bucket = points.slice(i, i + bucketSize);
    const avgY = bucket.reduce((s, p) => s + p.y, 0) / bucket.length;
    // Use middle point's date and first quality status
    const midIdx = Math.floor(bucket.length / 2);
    result.push({
      x: bucket[midIdx].x,
      y: avgY,
      date: bucket[midIdx].date,
      quality: bucket[0].quality,
    });
  }
  return result;
}

export function IotHistoryChart({ data, range, isDemo }: IotHistoryChartProps) {
  const [activeMetric, setActiveMetric] = useState<Metric>('moisture');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const config = METRIC_CONFIG[activeMetric];
  const maxDisplayPoints = range === '24h' ? 144 : 168; // Reasonable cap

  const chartData = useMemo(() => {
    // Sort oldest first for chart drawing
    const sorted = [...data]
      .filter((d) => d[config.key] != null)
      .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());

    if (sorted.length === 0) return [];

    const now = Date.now();
    const rangeMs = range === '24h' ? 24 * 3600000 : 7 * 24 * 3600000;
    const startTime = now - rangeMs;

    const points = sorted
      .filter((d) => {
        const t = new Date(d.measuredAt).getTime();
        return !isNaN(t) && t >= startTime && t <= now;
      })
      .map((d) => ({
        x: (new Date(d.measuredAt).getTime() - startTime) / rangeMs,
        y: d[config.key] as number,
        date: new Date(d.measuredAt),
        quality: d.qualityStatus,
      }));

    return aggregatePoints(points, maxDisplayPoints);
  }, [data, config.key, range, maxDisplayPoints]);

  // Chart dimensions
  const W = 700;
  const H = 220;
  const PAD = { top: 20, right: 20, bottom: 30, left: 45 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  // Y-axis auto-scale
  const yValues = chartData.map((p) => p.y);
  const dataMin = yValues.length > 0 ? Math.min(...yValues) : config.min;
  const dataMax = yValues.length > 0 ? Math.max(...yValues) : config.max;
  const yMin = Math.max(config.min, Math.floor(dataMin - (dataMax - dataMin) * 0.1));
  const yMax = Math.min(config.max, Math.ceil(dataMax + (dataMax - dataMin) * 0.1));
  const yRange = Math.max(yMax - yMin, 1);

  const toX = (frac: number) => PAD.left + frac * plotW;
  const toY = (val: number) => PAD.top + plotH - ((val - yMin) / yRange) * plotH;

  // Build SVG path
  const linePath = chartData
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.x).toFixed(1)} ${toY(p.y).toFixed(1)}`)
    .join(' ');

  // Gradient fill path
  const fillPath = chartData.length > 0
    ? `${linePath} L ${toX(chartData[chartData.length - 1].x).toFixed(1)} ${(PAD.top + plotH).toFixed(1)} L ${toX(chartData[0].x).toFixed(1)} ${(PAD.top + plotH).toFixed(1)} Z`
    : '';

  // Time axis labels
  const timeLabels = useMemo(() => {
    if (range === '24h') {
      // Every 4 hours
      return Array.from({ length: 7 }, (_, i) => {
        const frac = i / 6;
        const now = Date.now();
        const t = new Date(now - 24 * 3600000 + frac * 24 * 3600000);
        return {
          frac,
          label: t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }),
        };
      });
    } else {
      // Every day
      return Array.from({ length: 8 }, (_, i) => {
        const frac = i / 7;
        const now = Date.now();
        const t = new Date(now - 7 * 24 * 3600000 + frac * 7 * 24 * 3600000);
        return {
          frac,
          label: t.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' }),
        };
      });
    }
  }, [range]);

  // Y-axis labels (5 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = yMin + (i / 4) * yRange;
    return { val, y: toY(val) };
  });

  // Hovered point tooltip
  const hoveredPoint = hoveredIdx != null ? chartData[hoveredIdx] : null;

  return (
    <div className="space-y-3">
      {/* Metric Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {(Object.keys(METRIC_CONFIG) as Metric[]).map((m) => {
          const mc = METRIC_CONFIG[m];
          const hasData = data.some((d) => d[mc.key] != null);
          return (
            <button
              key={m}
              onClick={() => hasData && setActiveMetric(m)}
              disabled={!hasData}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                activeMetric === m
                  ? 'bg-white shadow-xs border-stone-300 text-stone-900'
                  : hasData
                    ? 'bg-stone-50 border-stone-200 text-stone-600 hover:text-stone-900'
                    : 'bg-stone-50 border-stone-100 text-stone-400 cursor-not-allowed'
              }`}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: mc.color }} />
              {mc.label} ({mc.unit})
            </button>
          );
        })}
        <span className="text-[10px] text-stone-400 ml-auto">
          {chartData.length} readings • IST timezone
        </span>
      </div>

      {/* SVG Chart */}
      <div className="relative rounded-2xl border border-stone-200 bg-stone-50/50 overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto"
          style={{ maxHeight: 280 }}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={PAD.left}
                y1={tick.y}
                x2={W - PAD.right}
                y2={tick.y}
                stroke="#e7e5e4"
                strokeWidth={0.5}
                strokeDasharray={i === 0 ? 'none' : '3,3'}
              />
              <text
                x={PAD.left - 6}
                y={tick.y + 3}
                textAnchor="end"
                className="fill-stone-500"
                fontSize={9}
                fontWeight={600}
              >
                {tick.val.toFixed(0)}{config.unit}
              </text>
            </g>
          ))}

          {/* Time axis labels */}
          {timeLabels.map((tl, i) => (
            <text
              key={i}
              x={toX(tl.frac)}
              y={H - 6}
              textAnchor="middle"
              className="fill-stone-500"
              fontSize={9}
              fontWeight={500}
            >
              {tl.label}
            </text>
          ))}

          {/* Gradient fill */}
          {chartData.length > 1 && (
            <>
              <defs>
                <linearGradient id={`fill-${activeMetric}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={config.color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={config.color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <path d={fillPath} fill={`url(#fill-${activeMetric})`} />
            </>
          )}

          {/* Data line */}
          {chartData.length > 1 && (
            <path
              d={linePath}
              fill="none"
              stroke={config.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points */}
          {chartData.map((p, i) => (
            <circle
              key={i}
              cx={toX(p.x)}
              cy={toY(p.y)}
              r={hoveredIdx === i ? 5 : chartData.length < 50 ? 3 : 1.5}
              fill={p.quality !== 'clean' ? '#f59e0b' : config.color}
              stroke="white"
              strokeWidth={hoveredIdx === i ? 2 : 0.5}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredIdx(i)}
            />
          ))}

          {/* Single data point — render as large dot */}
          {chartData.length === 1 && (
            <circle
              cx={toX(chartData[0].x)}
              cy={toY(chartData[0].y)}
              r={6}
              fill={config.color}
              stroke="white"
              strokeWidth={2}
            />
          )}
        </svg>

        {/* Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-10 bg-white border border-stone-200 rounded-xl shadow-lg px-3 py-2 text-xs pointer-events-none"
            style={{
              left: `${Math.min(85, Math.max(5, hoveredPoint.x * 100))}%`,
              top: 10,
            }}
          >
            <div className="font-bold text-stone-900">
              {hoveredPoint.y.toFixed(1)}{config.unit}
            </div>
            <div className="text-stone-500 font-mono text-[10px]">
              {hoveredPoint.date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })}
            </div>
            {hoveredPoint.quality !== 'clean' && (
              <div className="text-amber-700 text-[10px] font-bold mt-0.5">
                ⚠ {hoveredPoint.quality}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Demo label */}
      {isDemo && (
        <div className="flex items-center gap-2 text-[10px] text-orange-800 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5">
          <ProvenanceChip type="demo" label="SIMULATED DATA" />
          <span>Chart displays simulated sensor readings from the demo IoT device.</span>
        </div>
      )}
    </div>
  );
}
