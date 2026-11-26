import React from 'react';
import { LateralTiltPosition } from '../data/protocolData';

interface BedAngleVisualizerProps {
  currentHobAngle: number;
  hobAngle: number;
  kneeGatchDeg: number;
  reverseTrendelenburgDeg: number;
  legRaiseDeg: number;
  tripodSupport: boolean;
  lateralTilt: LateralTiltPosition;
  severity: 'nominal' | 'adjust' | 'caution' | 'critical';
}

export const BedAngleVisualizer: React.FC<BedAngleVisualizerProps> = ({
  currentHobAngle,
  hobAngle,
  kneeGatchDeg,
  reverseTrendelenburgDeg,
  legRaiseDeg,
  tripodSupport,
  lateralTilt,
  severity,
}) => {
  const hipX = 270;
  const hipY = 205;
  const backrestLen = 128;
  const thighLen = 78;
  const calfLen = 84;

  const rad = (deg: number) => (deg * Math.PI) / 180;
  const effectiveHob = tripodSupport ? 82 : hobAngle;

  // Dashed guide for previous angle
  const curBackEndX = hipX - backrestLen * Math.cos(rad(currentHobAngle));
  const curBackEndY = hipY - backrestLen * Math.sin(rad(currentHobAngle));

  const effectiveKnee = legRaiseDeg > 0 ? legRaiseDeg : kneeGatchDeg;
  const kneeX = hipX + thighLen * Math.cos(rad(effectiveKnee));
  const kneeY = hipY - thighLen * Math.sin(rad(effectiveKnee));

  const footX =
    legRaiseDeg > 0 ? kneeX + calfLen * Math.cos(rad(legRaiseDeg)) : kneeX + calfLen;
  const footY =
    legRaiseDeg > 0
      ? kneeY - calfLen * Math.sin(rad(legRaiseDeg))
      : kneeY + (effectiveKnee > 0 ? 10 : 0);

  const accentColor =
    severity === 'critical'
      ? '#DC2626'
      : severity === 'caution'
        ? '#D97706'
        : '#2563EB';

  const diaphragmLabel =
    reverseTrendelenburgDeg > 0
      ? '허리는 펴고 침대 전체를 기울여 숨쉬기 편하게 함'
      : effectiveHob >= 60
        ? '폐가 가장 넓게 열림 · 어지러움 주의'
        : effectiveHob >= 30
          ? '숨쉬기 가장 편하고 역류를 막는 표준 자세'
          : effectiveHob >= 15
            ? '심장 부담 감소 · 편안한 휴식 자세'
            : '배 속 장기가 폐를 눌러 숨쉬기 좁아진 상태';

  const lateralLabel =
    lateralTilt === 'left_30'
      ? '왼쪽 30° 돌림'
      : lateralTilt === 'right_30'
        ? '오른쪽 30° 돌림'
        : '정면(0°)';

  const lateralTiltDeg =
    lateralTilt === 'left_30' ? -30 : lateralTilt === 'right_30' ? 30 : 0;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 mb-3 border-b border-slate-200">
        <div>
          <span className="text-xs font-medium text-slate-500">침대 옆모습 및 몸 상태 그림</span>
          <div className="text-sm font-semibold text-slate-900 mt-0.5">{diaphragmLabel}</div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums text-slate-600">
          <span>
            이전 <strong className="text-slate-700">{currentHobAngle}°</strong>
          </span>
          <span aria-hidden="true">→</span>
          <span>
            등받이 <strong className="text-blue-700">{hobAngle}°</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            무릎 <strong className="text-slate-900">{kneeGatchDeg}°</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            돌아눕기 <strong className="text-slate-900">{lateralLabel}</strong>
          </span>
          {reverseTrendelenburgDeg > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                전체기울기 <strong className="text-blue-700">+{reverseTrendelenburgDeg}°</strong>
              </span>
            </>
          )}
        </div>
      </div>

      <svg
        viewBox="0 0 640 285"
        className="w-full h-auto max-h-[280px] select-none"
        role="img"
        aria-label={`등받이 각도 ${hobAngle}도, 무릎 받침 ${kneeGatchDeg}도, 돌아눕기 ${lateralLabel} 침대 그림`}
      >
        <defs>
          <pattern id="clinicalGrid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#E2E8F0" strokeWidth="0.7" />
          </pattern>
        </defs>
        <rect width="640" height="285" fill="url(#clinicalGrid)" rx="4" />

        <line x1="36" y1="255" x2="604" y2="255" stroke="#94A3B8" strokeWidth="1.5" />

        <path
          d={`M ${hipX - 72} ${hipY} A 72 72 0 0 1 ${hipX} ${hipY - 72}`}
          fill="none"
          stroke="#CBD5E1"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <line
          x1={hipX - 88}
          y1={hipY}
          x2={hipX}
          y2={hipY}
          stroke="#CBD5E1"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        <g
          transform={`rotate(${reverseTrendelenburgDeg}, 310, 225)`}
          style={{ transition: 'transform 550ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          <rect x="175" y="218" width="260" height="10" rx="2" fill="#475569" />
          <line x1="205" y1="228" x2="205" y2="245" stroke="#475569" strokeWidth="4" />
          <line x1="405" y1="228" x2="405" y2="245" stroke="#475569" strokeWidth="4" />
          <circle cx="205" cy="249" r="6" fill="#334155" />
          <circle cx="405" cy="249" r="6" fill="#334155" />

          {Math.abs(currentHobAngle - effectiveHob) > 2 && reverseTrendelenburgDeg === 0 && (
            <line
              x1={hipX}
              y1={hipY}
              x2={curBackEndX}
              y2={curBackEndY}
              stroke="#94A3B8"
              strokeWidth="4"
              strokeDasharray="5 5"
              strokeLinecap="round"
            />
          )}

          {/* Smoothly rotating backrest + upper torso around hip pivot */}
          <g
            transform={`rotate(${effectiveHob}, ${hipX}, ${hipY})`}
            style={{ transition: 'transform 550ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <line
              x1={hipX}
              y1={hipY}
              x2={hipX - backrestLen}
              y2={hipY}
              stroke="#1E293B"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* 옆으로 돌아눕기 지지 쿠션 (측와위 시 등 뒤 받침 표시) */}
            {lateralTilt !== 'center' && (
              <polygon
                points={`${hipX - 16},${hipY - 6} ${hipX - 90},${hipY - 6} ${hipX - 42},${hipY - 19}`}
                fill="#93C5FD"
                opacity="0.7"
              />
            )}
            <line
              x1={hipX - 4}
              y1={hipY - (lateralTilt !== 'center' ? 16 : 12)}
              x2={hipX - 98}
              y2={hipY - (lateralTilt !== 'center' ? 16 : 12)}
              stroke={accentColor}
              strokeWidth="14"
              strokeLinecap="round"
              opacity="0.22"
            />
            <line
              x1={hipX - 4}
              y1={hipY - (lateralTilt !== 'center' ? 16 : 12)}
              x2={hipX - 98}
              y2={hipY - (lateralTilt !== 'center' ? 16 : 12)}
              stroke={accentColor}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle
              cx={hipX - 122}
              cy={hipY - (lateralTilt !== 'center' ? 18 : 14)}
              r="14"
              fill="#FFFFFF"
              stroke={accentColor}
              strokeWidth="3"
            />
          </g>

          {/* Lower body & Knee Gatch */}
          <line
            x1={hipX}
            y1={hipY}
            x2={kneeX}
            y2={kneeY}
            stroke="#1E293B"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <line
            x1={kneeX}
            y1={kneeY}
            x2={footX}
            y2={footY}
            stroke="#1E293B"
            strokeWidth="10"
            strokeLinecap="round"
          />

          <path
            d={`M ${hipX - 4} ${hipY - 12} L ${kneeX} ${kneeY - 12} L ${footX - 6} ${footY - 11}`}
            fill="none"
            stroke={accentColor}
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.22"
          />
          <path
            d={`M ${hipX - 4} ${hipY - 12} L ${kneeX} ${kneeY - 12} L ${footX - 6} ${footY - 11}`}
            fill="none"
            stroke={accentColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {reverseTrendelenburgDeg > 0 && (
            <line
              x1={footX + 6}
              y1={footY + 6}
              x2={footX + 6}
              y2={footY - 38}
              stroke="#0F172A"
              strokeWidth="4"
              strokeLinecap="round"
            />
          )}

          {tripodSupport && (
            <g>
              <line x1="330" y1="255" x2="330" y2="128" stroke="#64748B" strokeWidth="3" />
              <rect x="275" y="122" width="70" height="7" rx="2" fill="#475569" />
              <rect
                x="282"
                y="108"
                width="48"
                height="13"
                rx="6"
                fill="#E2E8F0"
                stroke="#94A3B8"
                strokeWidth="1"
              />
              <path
                d={`M ${hipX - 18} ${hipY - 90} L 298 112`}
                fill="none"
                stroke={accentColor}
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
          )}

          <circle cx={hipX} cy={hipY} r="4.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
          <circle cx={kneeX} cy={kneeY} r="4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
        </g>

        <g transform="translate(36, 26)">
          <rect
            x="0"
            y="0"
            width="164"
            height="58"
            rx="4"
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <text
            x="12"
            y="20"
            fontSize="11"
            fill="#64748B"
            fontFamily="Plus Jakarta Sans, Noto Sans KR, sans-serif"
          >
            등받이 각도 (상체)
          </text>
          <text
            x="12"
            y="45"
            fontSize="22"
            fontWeight="700"
            fill={accentColor}
            fontFamily="JetBrains Mono, monospace"
          >
            {reverseTrendelenburgDeg > 0 ? `+${reverseTrendelenburgDeg}° 경사` : `${hobAngle}°`}
          </text>
        </g>

        <g transform="translate(420, 26)">
          <rect
            x="0"
            y="0"
            width="184"
            height="58"
            rx="4"
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <text
            x="12"
            y="20"
            fontSize="11"
            fill="#64748B"
            fontFamily="Plus Jakarta Sans, Noto Sans KR, sans-serif"
          >
            혈액 흐름 · 몸 방향 ({lateralLabel})
          </text>
          <text
            x="12"
            y="43"
            fontSize="12"
            fontWeight="600"
            fill="#0F172A"
            fontFamily="Plus Jakarta Sans, Noto Sans KR, sans-serif"
          >
            {legRaiseDeg > 0
              ? '심장으로 피 보충 (다리 올림)'
              : effectiveHob >= 60
                ? '숨쉬기 최대 · 혈압 저하 주의'
                : effectiveHob >= 30
                  ? '숨쉬기·혈압 가장 균형 잡힘'
                  : effectiveHob >= 15
                    ? '심장 부담 ↓ · 편안한 안정'
                    : '배가 폐를 누름 · 심장 부담 ↑'}
          </text>
        </g>

        {/* 요구사항 (6): 발치 방향에서 본 몸 기울기(돌아눕기) 단면 그림 */}
        <g transform="translate(468, 102)">
          <rect
            x="0"
            y="0"
            width="136"
            height="136"
            rx="6"
            fill="#FFFFFF"
            stroke="#CBD5E1"
            strokeWidth="1"
          />
          <text
            x="68"
            y="18"
            textAnchor="middle"
            fontSize="10.5"
            fontWeight="700"
            fill="#334155"
            fontFamily="Plus Jakarta Sans, Noto Sans KR, sans-serif"
          >
            돌아눕기 몸 기울기
          </text>
          <text
            x="68"
            y="32"
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill={lateralTilt === 'center' ? '#64748B' : '#2563EB'}
            fontFamily="JetBrains Mono, monospace"
          >
            {lateralLabel}
          </text>

          {/* 매트리스 단면 */}
          <rect x="16" y="108" width="104" height="10" rx="2" fill="#475569" />

          {/* 베개/쿠션 받침 */}
          {lateralTilt === 'left_30' && (
            <polygon points="70,108 106,108 102,88" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1" />
          )}
          {lateralTilt === 'right_30' && (
            <polygon points="30,108 66,108 34,88" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1" />
          )}

          {/* 기울어지는 환자 상체/어깨/머리 정면 단면 */}
          <g
            transform={`rotate(${lateralTiltDeg}, 68, 92)`}
            style={{ transition: 'transform 450ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            {/* 어깨/몸통 타원 */}
            <rect
              x="36"
              y="78"
              width="64"
              height="24"
              rx="12"
              fill="#EFF6FF"
              stroke={accentColor}
              strokeWidth="2.5"
            />
            {/* 왼팔 / 오른팔 방향 표시 */}
            <circle cx="38" cy="90" r="4" fill={accentColor} opacity="0.5" />
            <circle cx="98" cy="90" r="4" fill={accentColor} opacity="0.5" />
            {/* 머리 */}
            <circle
              cx="68"
              cy="64"
              r="11"
              fill="#FFFFFF"
              stroke={accentColor}
              strokeWidth="2.5"
            />
            {/* 얼굴 중심선(코 방향 표시) */}
            <line x1="68" y1="59" x2="68" y2="66" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
          </g>

          <text x="16" y="130" fontSize="9" fill="#64748B">
            왼쪽
          </text>
          <text x="120" y="130" textAnchor="end" fontSize="9" fill="#64748B">
            오른쪽
          </text>
        </g>
      </svg>
    </div>
  );
};
