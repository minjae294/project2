import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  formatTiltKo,
  LateralTiltPosition,
  WardPatient,
} from '../data/protocolData';
import {
  getEffectiveCriticalAlertFor,
  getPatientRepositionMetrics,
  isCriticalPriorityActiveFor,
  isDoctorNotifiedFor,
} from '../utils/wardHelpers';

interface QuickRepositionBarProps {
  activePatient: WardPatient;
  onQuickReposition: (patient: WardPatient, tilt: LateralTiltPosition) => void;
  onQuickAngle: (patient: WardPatient, targetHob: number) => void;
  onToggleSafetyConfirmed: (patient: WardPatient, confirmed: boolean) => void;
  onHeightChange?: (height: number) => void;
}

const QUICK_BAR_ANGLES = [15, 30, 45, 60] as const;

export const QuickRepositionBar: React.FC<QuickRepositionBarProps> = ({
  activePatient,
  onQuickReposition,
  onQuickAngle,
  onToggleSafetyConfirmed,
  onHeightChange,
}) => {
  const barRef = useRef<HTMLElement | null>(null);
  const [angleDrawerOpen, setAngleDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    const el = barRef.current;
    if (!el || typeof ResizeObserver === 'undefined' || !onHeightChange) return;
    const update = () => onHeightChange(el.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [onHeightChange]);

  const metrics = getPatientRepositionMetrics(activePatient);
  const isCriticalActive = isCriticalPriorityActiveFor(activePatient);
  const effCrit = getEffectiveCriticalAlertFor(activePatient);
  const isDoctorNotified = isDoctorNotifiedFor(activePatient);
  const isSafetyConfirmed = Boolean(effCrit.safetyChangeConfirmed);
  const isCriticalBlocked = isCriticalActive && (!isDoctorNotified || !isSafetyConfirmed);

  // B(7) 상태별 배경·테두리 색상
  const barColorClass =
    metrics.overdue > 0
      ? 'bg-red-50 border-t-2 border-red-500 text-red-950'
      : metrics.isImminent
        ? 'bg-amber-50 border-t-2 border-amber-400 text-amber-950'
        : 'bg-white border-t-2 border-slate-300 text-slate-900';

  const criticalDisabledReason = !isDoctorNotified
    ? '위험 상태: 먼저 위쪽 알림에서 [의료진에게 알리기] 후 아래 확인을 체크해 주세요.'
    : '위험 상태: 위 확인 체크 전까지 체위·각도 변경이 비활성화됩니다.';

  return (
    <section
      ref={barRef}
      aria-label="체위변경 빠른 조작 바"
      className={`fixed bottom-0 inset-x-0 z-30 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] transition-colors ${barColorClass}`}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-2.5 space-y-2 text-xs">
        {/* C(9) 위험 상태일 때만 공유 확인 체크 + 비활성화 1줄 이유 표시 */}
        {isCriticalActive && (
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-red-200/80 text-[11px]">
            <label className="inline-flex items-center gap-1.5 font-semibold text-red-900 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSafetyConfirmed}
                onChange={(e) => onToggleSafetyConfirmed(activePatient, e.target.checked)}
                className="w-3.5 h-3.5 accent-red-600 cursor-pointer"
              />
              <span>의료진에게 체위·각도 변경 가능 여부를 확인했습니다</span>
            </label>
            {isCriticalBlocked && (
              <span className="font-semibold text-red-700">※ {criticalDisabledReason}</span>
            )}
          </div>
        )}

        {/* B(5)~(8) 환자 요약 · 유지/남은(지연) 시간 · [왼쪽 30°][정면][오른쪽 30°] · 접이식 각도 빠른 변경 */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {/* 왼쪽: 선택된 환자 + 현재 자세 + 유지 시간 + 다음 체위변경까지/지연 */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
            <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
              {activePatient.bedNumber} · {activePatient.patientName}
            </span>

            <span className="text-slate-300" aria-hidden="true">
              |
            </span>

            <span className="whitespace-nowrap">
              현재{' '}
              <strong className="text-slate-900">
                {formatTiltKo(activePatient.inputs.lateralTilt)}
              </strong>
            </span>

            <span className="font-mono tabular-nums whitespace-nowrap text-slate-700">
              유지 <strong>{metrics.maintained}분</strong>
            </span>

            {metrics.overdue > 0 ? (
              <span className="font-mono tabular-nums font-bold text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded whitespace-nowrap">
                지연 {metrics.overdue}분
              </span>
            ) : (
              <span
                className={`font-mono tabular-nums font-semibold whitespace-nowrap ${
                  metrics.isImminent ? 'text-amber-900' : 'text-blue-700'
                }`}
              >
                {metrics.remaining === 0
                  ? '지금 변경 필요'
                  : `다음 체위변경까지 ${metrics.remaining}분`}
              </span>
            )}
          </div>

          {/* 오른쪽: 빠른 체위 버튼 3개 + 현재 자세 안내 + 접이식 각도 버튼 */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              {(
                [
                  ['left_30', '왼쪽 30°'],
                  ['center', '정면'],
                  ['right_30', '오른쪽 30°'],
                ] as const
              ).map(([tiltKey, label]) => {
                const isCurrent = activePatient.inputs.lateralTilt === tiltKey;
                const isRecommendedNext = !isCurrent && metrics.nextCycleTilt === tiltKey;
                const isDisabled = isCurrent || isCriticalBlocked;

                return (
                  <button
                    key={tiltKey}
                    type="button"
                    disabled={isDisabled}
                    title={
                      isCurrent
                        ? '현재 자세와 같아요'
                        : isCriticalBlocked
                          ? criticalDisabledReason
                          : isRecommendedNext
                            ? `다음 권장 자세: ${label}`
                            : `${label}로 바로 변경`
                    }
                    onClick={() => onQuickReposition(activePatient, tiltKey)}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                      isCurrent
                        ? 'bg-slate-200/80 text-slate-500 border-slate-300 cursor-not-allowed font-semibold'
                        : isCriticalBlocked
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed font-medium'
                          : isRecommendedNext
                            ? 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-600 ring-2 ring-blue-500/70 font-bold cursor-pointer'
                            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 font-semibold cursor-pointer'
                    }`}
                  >
                    {label}
                    {isCurrent && ' (현재)'}
                  </button>
                );
              })}
            </div>

            <span className="text-[11px] text-slate-500 whitespace-nowrap">
              현재 자세와 같아요(비활성)
            </span>

            {/* B(8) 접이식 각도 빠른 변경 토글 */}
            <button
              type="button"
              onClick={() => setAngleDrawerOpen((v) => !v)}
              aria-expanded={angleDrawerOpen}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>각도 {activePatient.inputs.currentHob}°</span>
              {angleDrawerOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* 접을 수 있는 각도 빠른 변경 영역 (15° / 30° / 45° / 60°) */}
        {angleDrawerOpen && (
          <div className="pt-1.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-700">
              등받이 각도 빠른 변경 (스크롤 없이 즉시 적용):
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {QUICK_BAR_ANGLES.map((deg) => {
                const isSameAngle = activePatient.inputs.currentHob === deg;
                const isDisabled = isSameAngle || isCriticalBlocked;
                return (
                  <button
                    key={deg}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onQuickAngle(activePatient, deg)}
                    className={`px-3 py-1 text-xs font-mono tabular-nums rounded border whitespace-nowrap ${
                      isSameAngle
                        ? 'bg-slate-800 text-white border-slate-800 cursor-not-allowed font-bold'
                        : isCriticalBlocked
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-400 text-slate-800 border-slate-300 font-semibold cursor-pointer'
                    }`}
                  >
                    {deg}°{isSameAngle ? ' (현재)' : ''}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
