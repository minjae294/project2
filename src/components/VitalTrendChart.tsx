import React, { useState } from 'react';
import { VitalHistoryPoint } from '../data/protocolData';

interface VitalTrendChartProps {
  history: VitalHistoryPoint[];
  previewPoint?: VitalHistoryPoint | null;
}

const EXAMPLE_TIME_SET = new Set(['14:00', '15:30', '17:00', '18:20']);

export const VitalTrendChart: React.FC<VitalTrendChartProps> = ({
  history,
  previewPoint,
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const combinedPoints = previewPoint ? [...history, previewPoint] : history;

  if (combinedPoints.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-5 text-xs text-slate-500">
        아직 기록된 변화 그래프 데이터가 없습니다.
      </div>
    );
  }

  const width = 640;
  const height = 314;
  const padL = 52;
  const padR = 54;

  // 상단 그래프: 등받이 각도(좌측 축 0~90°) + 1분 호흡수(우측 축 8~36회)
  const topY = 46;
  const topH = 90;
  const topBottom = topY + topH; // 136

  // 하단 그래프: 1분 맥박수(좌측 축 40~145회) + 산소포화도(우측 축 80~100%)
  // 중간 여백(137~177)에 하단 축 제목을 배치하고 세로 표시선이 관통하지 않도록 상/하 분리
  const botY = 178;
  const botH = 96;
  const botBottom = botY + botH; // 274

  const plotW = width - padL - padR;

  const getX = (i: number) =>
    combinedPoints.length === 1
      ? padL + plotW / 2
      : padL + (i / (combinedPoints.length - 1)) * plotW;

  const yHob = (hob: number) => {
    const clamped = Math.max(0, Math.min(90, hob));
    return topY + topH - (clamped / 90) * topH;
  };

  const yRr = (rr: number) => {
    const clamped = Math.max(8, Math.min(36, rr));
    return topY + topH - ((clamped - 8) / (36 - 8)) * topH;
  };

  const yHr = (hr: number) => {
    const clamped = Math.max(40, Math.min(145, hr));
    return botY + botH - ((clamped - 40) / (145 - 40)) * botH;
  };

  const ySpo2 = (spo2: number) => {
    const clamped = Math.max(80, Math.min(100, spo2));
    return botY + botH - ((clamped - 80) / (100 - 80)) * botH;
  };

  const buildPath = (pts: VitalHistoryPoint[], fn: (pt: VitalHistoryPoint) => number) =>
    pts
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${fn(pt).toFixed(1)}`)
      .join(' ');

  const safeHoverIdx =
    hoverIdx !== null && hoverIdx >= 0 && hoverIdx < combinedPoints.length ? hoverIdx : null;
  const activePoint =
    safeHoverIdx !== null
      ? combinedPoints[safeHoverIdx]
      : combinedPoints[combinedPoints.length - 1];

  const rrNormalTop = yRr(20);
  const rrNormalBot = yRr(12);
  const hrNormalTop = yHr(100);
  const hrNormalBot = yHr(60);

  // 예시 기록 구간 판별 (초기 14:00~18:20 가상 예시 데이터)
  let lastExampleIdx = -1;
  combinedPoints.forEach((pt, idx) => {
    if (pt.isExample || (EXAMPLE_TIME_SET.has(pt.timeLabel) && !pt.eventType)) {
      lastExampleIdx = idx;
    }
  });
  const exampleZoneWidth =
    lastExampleIdx >= 0
      ? lastExampleIdx < combinedPoints.length - 1
        ? (getX(lastExampleIdx) + getX(lastExampleIdx + 1)) / 2 - padL
        : plotW
      : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            등받이 각도에 따른 호흡·맥박·산소 변화 그래프 (호흡·맥박 축 분리)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            14:00~18:20은 초기 <strong className="text-slate-700">예시 기록</strong>이며, 이후 시각은{' '}
            <strong className="text-slate-700">누적 경과 시간</strong>과 연동됩니다
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
          <span className="inline-flex items-center gap-1.5 text-blue-700">
            <span className="w-3 h-0.5 bg-blue-600 inline-block" />
            각도 {activePoint.hob}°
          </span>
          <span className="inline-flex items-center gap-1.5 text-emerald-700">
            <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
            호흡 {activePoint.rr}회
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-700">
            <span className="w-3 h-0.5 bg-amber-600 inline-block" />
            맥박 {activePoint.hr}회
          </span>
          <span className="inline-flex items-center gap-1.5 text-cyan-700">
            <span className="w-3 h-0.5 bg-cyan-600 inline-block" />
            산소 {activePoint.spo2}%
          </span>
          {activePoint.eventLabel && (
            <>
              <span className="text-slate-400">·</span>
              <span className="text-indigo-700 font-semibold">{activePoint.eventLabel}</span>
            </>
          )}
        </div>
      </div>

      {/* 표시선 및 구간 범례 */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-2.5 bg-slate-100 border border-slate-300 inline-block rounded-xs" />
          예시 기록 구간
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 border-t-2 border-dashed border-indigo-600 inline-block" />
          각도 입력·시연
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 border-t-2 border-solid border-sky-600 inline-block" />
          교정·간호사 확인
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 border-t-2 border-dotted border-slate-400 inline-block" />
          입력 예상
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto cursor-crosshair select-none"
        onMouseLeave={() => setHoverIdx(null)}
        role="img"
        aria-label="시간별 등받이 각도, 호흡수, 맥박수, 산소포화도 분리 축 변화 그래프"
      >
        {/* 예시 기록 배경 음영 (상단·하단 플롯 영역) */}
        {lastExampleIdx >= 0 && exampleZoneWidth > 0 && (
          <g>
            <rect
              x={padL}
              y={topY}
              width={exampleZoneWidth}
              height={topH}
              fill="#F8FAFC"
            />
            <rect
              x={padL}
              y={botY}
              width={exampleZoneWidth}
              height={botH}
              fill="#F8FAFC"
            />
            <text
              x={padL + 6}
              y={topY + 12}
              fontSize="9.5"
              fontWeight="600"
              fill="#64748B"
            >
              예시 기록
            </text>
          </g>
        )}

        {/* 상단 축 제목 (세로선이 지나가지 않는 위치) */}
        <text x={padL} y={36} fontSize="10" fontWeight="600" fill="#2563EB">
          등받이 각도 (°)
        </text>
        <text x={width - padR} y={36} textAnchor="end" fontSize="10" fontWeight="600" fill="#059669">
          1분 호흡수 (회/분 · 정상 12~20)
        </text>

        {/* 호흡 정상 구간 음영 (12~20회) */}
        <rect
          x={padL}
          y={rrNormalTop}
          width={plotW}
          height={rrNormalBot - rrNormalTop}
          fill="#ECFDF5"
          opacity="0.65"
        />

        {/* 상단 눈금선 */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = topY + topH * ratio;
          return (
            <line
              key={`top-grid-${idx}`}
              x1={padL}
              y1={y}
              x2={width - padR}
              y2={y}
              stroke="#E2E8F0"
              strokeWidth="1"
            />
          );
        })}

        {/* 상단 좌측 Y축 (각도 0~90°) */}
        <text x={padL - 6} y={topY + 4} textAnchor="end" fontSize="10" fill="#2563EB" fontFamily="JetBrains Mono, monospace">
          90°
        </text>
        <text x={padL - 6} y={topY + topH / 2 + 3} textAnchor="end" fontSize="10" fill="#64748B" fontFamily="JetBrains Mono, monospace">
          45°
        </text>
        <text x={padL - 6} y={topBottom + 3} textAnchor="end" fontSize="10" fill="#2563EB" fontFamily="JetBrains Mono, monospace">
          0°
        </text>

        {/* 상단 우측 Y축 (호흡수 8~36회) */}
        <text x={width - padR + 6} y={topY + 4} fontSize="10" fill="#059669" fontFamily="JetBrains Mono, monospace">
          36회
        </text>
        <text x={width - padR + 6} y={rrNormalTop + 3} fontSize="9.5" fill="#059669" fontFamily="JetBrains Mono, monospace">
          20회
        </text>
        <text x={width - padR + 6} y={topBottom + 3} fontSize="10" fill="#059669" fontFamily="JetBrains Mono, monospace">
          8회
        </text>

        {/* 각도 입력 / 교정 확인 표시선 — 상단(topY~topBottom)과 하단(botY~botBottom)으로 분리해 축 제목을 가리지 않음 */}
        {combinedPoints.map((pt, i) => {
          if (!pt.eventType || pt.eventType === 'time') return null;
          const x = getX(i);
          const isInput = pt.eventType === 'input';
          const isConfirmed = pt.eventType === 'confirmed';
          const lineColor = isInput ? '#4F46E5' : isConfirmed ? '#0284C7' : '#94A3B8';
          const dash = isInput ? '4 3' : isConfirmed ? undefined : '2 3';
          const label = pt.eventLabel || (isInput ? '입력' : isConfirmed ? '교정' : '예상');

          return (
            <g key={`marker-${i}`}>
              {/* 상단 그래프 내 세로 표시선 */}
              <line
                x1={x}
                y1={topY}
                x2={x}
                y2={topBottom}
                stroke={lineColor}
                strokeWidth={isConfirmed ? '1.5' : '1.25'}
                strokeDasharray={dash}
                opacity="0.85"
              />
              {/* 하단 그래프 내 세로 표시선 (중간 맥박 축 제목 영역 비움) */}
              <line
                x1={x}
                y1={botY}
                x2={x}
                y2={botBottom}
                stroke={lineColor}
                strokeWidth={isConfirmed ? '1.5' : '1.25'}
                strokeDasharray={dash}
                opacity="0.85"
              />
              <text
                x={x}
                y={15}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill={lineColor}
                fontFamily="JetBrains Mono, monospace"
              >
                ▼ {label}
              </text>
            </g>
          );
        })}

        {/* 상단 데이터 선 (각도 + 호흡수) */}
        {history.length > 0 && (
          <>
            <path d={buildPath(history, (pt) => yHob(pt.hob))} fill="none" stroke="#2563EB" strokeWidth="2" />
            <path d={buildPath(history, (pt) => yRr(pt.rr))} fill="none" stroke="#059669" strokeWidth="2" />
          </>
        )}

        {previewPoint && history.length > 0 && (
          <>
            <line
              x1={getX(history.length - 1)}
              y1={yHob(history[history.length - 1].hob)}
              x2={getX(combinedPoints.length - 1)}
              y2={yHob(previewPoint.hob)}
              stroke="#2563EB"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <line
              x1={getX(history.length - 1)}
              y1={yRr(history[history.length - 1].rr)}
              x2={getX(combinedPoints.length - 1)}
              y2={yRr(previewPoint.rr)}
              stroke="#059669"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          </>
        )}

        {/* 하단 축 제목 (세로선이 끊어져 있으므로 절대 가려지지 않음) */}
        <text x={padL} y={166} fontSize="10" fontWeight="600" fill="#B45309">
          1분 맥박수 (회/분 · 정상 60~100)
        </text>
        <text x={width - padR} y={166} textAnchor="end" fontSize="10" fontWeight="600" fill="#0891B2">
          산소포화도 (SpO₂ % · 80~100%)
        </text>

        {/* 맥박 정상 구간 음영 (60~100회) */}
        <rect
          x={padL}
          y={hrNormalTop}
          width={plotW}
          height={hrNormalBot - hrNormalTop}
          fill="#FFFBEB"
          opacity="0.75"
        />

        {/* 하단 좌측 눈금선 및 맥박 축 (145 / 100 / 60 / 40) */}
        {[145, 100, 60, 40].map((tick) => {
          const y = yHr(tick);
          const isThreshold = tick === 100 || tick === 60;
          return (
            <g key={`hr-grid-${tick}`}>
              <line
                x1={padL}
                y1={y}
                x2={width - padR}
                y2={y}
                stroke={isThreshold ? '#FCD34D' : '#E2E8F0'}
                strokeWidth="1"
                strokeDasharray={isThreshold ? '3 3' : undefined}
              />
              <text
                x={padL - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="#B45309"
                fontFamily="JetBrains Mono, monospace"
              >
                {tick}회
              </text>
            </g>
          );
        })}

        {/* 하단 우측 산소포화도 눈금 (100% / 94% / 88% / 80%) */}
        {[100, 94, 88, 80].map((spo2Tick) => {
          const y = ySpo2(spo2Tick);
          return (
            <text
              key={`spo2-axis-${spo2Tick}`}
              x={width - padR + 6}
              y={y + 3}
              fontSize="9.5"
              fill="#0891B2"
              fontFamily="JetBrains Mono, monospace"
            >
              {spo2Tick}%
            </text>
          );
        })}

        {/* 하단 맥박 + 산소포화도 데이터 선 */}
        {history.length > 0 && (
          <>
            <path d={buildPath(history, (pt) => yHr(pt.hr))} fill="none" stroke="#D97706" strokeWidth="2.2" />
            <path d={buildPath(history, (pt) => ySpo2(pt.spo2))} fill="none" stroke="#0891B2" strokeWidth="1.9" />
          </>
        )}

        {previewPoint && history.length > 0 && (
          <>
            <line
              x1={getX(history.length - 1)}
              y1={yHr(history[history.length - 1].hr)}
              x2={getX(combinedPoints.length - 1)}
              y2={yHr(previewPoint.hr)}
              stroke="#D97706"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <line
              x1={getX(history.length - 1)}
              y1={ySpo2(history[history.length - 1].spo2)}
              x2={getX(combinedPoints.length - 1)}
              y2={ySpo2(previewPoint.spo2)}
              stroke="#0891B2"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          </>
        )}

        {/* 호버 세로 기준선 (상·하 분리) */}
        {safeHoverIdx !== null && (
          <>
            <line
              x1={getX(safeHoverIdx)}
              y1={topY}
              x2={getX(safeHoverIdx)}
              y2={topBottom}
              stroke="#94A3B8"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <line
              x1={getX(safeHoverIdx)}
              y1={botY}
              x2={getX(safeHoverIdx)}
              y2={botBottom}
              stroke="#94A3B8"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          </>
        )}

        {/* 데이터 포인트 & X축 시간(분 단위 중복 없음) */}
        {combinedPoints.map((pt, i) => {
          const x = getX(i);
          const isPreview = Boolean(previewPoint && i === combinedPoints.length - 1);
          const isExamplePt = Boolean(
            pt.isExample || (EXAMPLE_TIME_SET.has(pt.timeLabel) && !pt.eventType)
          );
          return (
            <g key={i} onMouseEnter={() => setHoverIdx(i)}>
              <rect x={x - 18} y={topY} width="36" height={botBottom - topY + 26} fill="transparent" />
              <circle
                cx={x}
                cy={yHob(pt.hob)}
                r={isPreview ? '4.5' : '3.5'}
                fill={isPreview ? '#FFFFFF' : '#2563EB'}
                stroke="#2563EB"
                strokeWidth="2"
              />
              <circle
                cx={x}
                cy={yRr(pt.rr)}
                r={isPreview ? '4.5' : '3.5'}
                fill={isPreview ? '#FFFFFF' : '#059669'}
                stroke="#059669"
                strokeWidth="2"
              />
              <circle
                cx={x}
                cy={yHr(pt.hr)}
                r={isPreview ? '4.5' : '3.5'}
                fill={isPreview ? '#FFFFFF' : '#D97706'}
                stroke="#D97706"
                strokeWidth="2"
              />
              <circle
                cx={x}
                cy={ySpo2(pt.spo2)}
                r={isPreview ? '4' : '3.2'}
                fill={isPreview ? '#FFFFFF' : '#0891B2'}
                stroke="#0891B2"
                strokeWidth="1.8"
              />
              <text
                x={x}
                y={height - 12}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight={isPreview ? '600' : '400'}
                fill={isExamplePt ? '#94A3B8' : '#475569'}
                fontFamily="JetBrains Mono, monospace"
              >
                {pt.timeLabel}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

