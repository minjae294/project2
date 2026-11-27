import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, ChevronUp, Volume2, VolumeX } from 'lucide-react';
import {
  formatTiltKo,
  LateralTiltPosition,
  WardPatient,
} from '../data/protocolData';
import {
  CriticalPatientAlertItem,
  HOLD_CHIPS,
  HoldChipReason,
  QueuedNormalAlert,
} from '../utils/wardHelpers';

interface OrderDraft {
  note: string;
  hob: number | null;
}

interface RecheckDraft {
  rr: number;
  hr: number;
  spo2: number;
}

interface GlobalCriticalAlertZoneProps {
  activePatientId: string | null;
  patientsCount: number;
  criticalAlerts: CriticalPatientAlertItem[];
  normalAlerts: QueuedNormalAlert[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSelectPatientAndGoWorkspace: (patientId: string) => void;
  onNotifyDoctorCritical: (patient: WardPatient) => void;
  onSubmitDoctorOrder: (patient: WardPatient, note: string, hob: number | null) => void;
  onSubmitRecheck: (
    patient: WardPatient,
    mode: 'manual' | 'unchanged',
    vitals: { rr: number; hr: number; spo2: number }
  ) => void;
  onApplyCriticalRecommendedAngle: (
    patient: WardPatient,
    targetHob: number,
    revTilt: number
  ) => void;
  onToggleSafetyConfirmed: (patient: WardPatient, confirmed: boolean) => void;
  onAcknowledgeNormalAngle: (patientId: string, angleKey: string) => void;
  onApplyNormalAngle: (
    patient: WardPatient,
    targetAngle: number,
    targetRevTilt?: number,
    angleKey?: string
  ) => void;
  onApplyRepositionFromAlert: (
    patient: WardPatient,
    tilt: LateralTiltPosition,
    isCriticalOverride?: boolean
  ) => void;
  onHoldReposition: (patient: WardPatient, reason: HoldChipReason, customReason: string) => void;
  onHeightChange?: (height: number) => void;
}

export const GlobalCriticalAlertZone: React.FC<GlobalCriticalAlertZoneProps> = ({
  activePatientId,
  patientsCount,
  criticalAlerts,
  normalAlerts,
  soundEnabled,
  onToggleSound,
  onSelectPatientAndGoWorkspace,
  onNotifyDoctorCritical,
  onSubmitDoctorOrder,
  onSubmitRecheck,
  onApplyCriticalRecommendedAngle,
  onToggleSafetyConfirmed,
  onAcknowledgeNormalAngle,
  onApplyNormalAngle,
  onApplyRepositionFromAlert,
  onHoldReposition,
  onHeightChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [showAllCritical, setShowAllCritical] = useState<boolean>(false);
  const [normalStackOpen, setNormalStackOpen] = useState<boolean>(false);
  const [openOrderPatientId, setOpenOrderPatientId] = useState<string | null>(null);
  const [openRecheckPatientId, setOpenRecheckPatientId] = useState<string | null>(null);
  const [orderDrafts, setOrderDrafts] = useState<Record<string, OrderDraft>>({});
  const [recheckDrafts, setRecheckDrafts] = useState<Record<string, RecheckDraft>>({});

  const [holdTargetPatientId, setHoldTargetPatientId] = useState<string | null>(null);
  const [customHoldReason, setCustomHoldReason] = useState<string>('');

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined' || !onHeightChange) return;
    const update = () => onHeightChange(el.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [onHeightChange]);

  useEffect(() => {
    const critIds = new Set(criticalAlerts.map((a) => a.patient.id));
    const normIds = new Set(normalAlerts.map((a) => a.patient.id));
    if (openOrderPatientId && !critIds.has(openOrderPatientId)) {
      setOpenOrderPatientId(null);
    }
    if (openRecheckPatientId && !critIds.has(openRecheckPatientId)) {
      setOpenRecheckPatientId(null);
    }
    if (holdTargetPatientId && !normIds.has(holdTargetPatientId)) {
      setHoldTargetPatientId(null);
      setCustomHoldReason('');
    }
    setOrderDrafts((prev) => {
      const keys = Object.keys(prev);
      if (keys.every((k) => critIds.has(k))) return prev;
      const next: Record<string, OrderDraft> = {};
      for (const k of keys) {
        if (critIds.has(k)) next[k] = prev[k];
      }
      return next;
    });
    setRecheckDrafts((prev) => {
      const keys = Object.keys(prev);
      if (keys.every((k) => critIds.has(k))) return prev;
      const next: Record<string, RecheckDraft> = {};
      for (const k of keys) {
        if (critIds.has(k)) next[k] = prev[k];
      }
      return next;
    });
  }, [criticalAlerts, normalAlerts, openOrderPatientId, openRecheckPatientId, holdTargetPatientId]);

  const visibleCritical = showAllCritical ? criticalAlerts : criticalAlerts.slice(0, 3);
  const hiddenCriticalCount = Math.max(0, criticalAlerts.length - 3);
  const topNormalAlert = normalAlerts[0] ?? null;
  const remainingNormalAlerts = normalAlerts.slice(1);
  const holdTargetPatient =
    normalAlerts.find((a) => a.patient.id === holdTargetPatientId)?.patient ?? null;

  const getOrderDraft = (pt: WardPatient): OrderDraft =>
    orderDrafts[pt.id] ?? {
      note: pt.criticalAlert?.doctorOrderNote ?? '',
      hob: pt.criticalAlert?.doctorOrderedHob ?? null,
    };

  const getRecheckDraft = (pt: WardPatient): RecheckDraft =>
    recheckDrafts[pt.id] ?? {
      rr: pt.inputs.rr,
      hr: pt.inputs.hr,
      spo2: pt.inputs.spo2,
    };

  const handleOpenOrderForm = (item: CriticalPatientAlertItem) => {
    const pt = item.patient;
    setOpenRecheckPatientId((prev) => (prev === pt.id ? null : prev));
    setOpenOrderPatientId((prev) => {
      if (prev === pt.id) return null;
      setOrderDrafts((d) => ({
        ...d,
        [pt.id]: {
          note: d[pt.id]?.note ?? pt.criticalAlert?.doctorOrderNote ?? '',
          hob: d[pt.id]?.hob ?? item.recommendedHob,
        },
      }));
      return pt.id;
    });
  };

  const handleOpenRecheckForm = (item: CriticalPatientAlertItem) => {
    const pt = item.patient;
    setOpenOrderPatientId((prev) => (prev === pt.id ? null : prev));
    setOpenRecheckPatientId((prev) => {
      if (prev === pt.id) return null;
      setRecheckDrafts((d) => ({
        ...d,
        [pt.id]: {
          rr: pt.inputs.rr,
          hr: pt.inputs.hr,
          spo2: pt.inputs.spo2,
        },
      }));
      return pt.id;
    });
  };

  const handleNormalAction = (alert: QueuedNormalAlert) => {
    if (alert.category === 'respiratory' && alert.targetAngle !== undefined) {
      onApplyNormalAngle(alert.patient, alert.targetAngle, alert.targetRevTilt, alert.angleKey);
      return;
    }
    if (alert.category === 'reposition' && alert.targetTilt) {
      onApplyRepositionFromAlert(
        alert.patient,
        alert.targetTilt,
        Boolean(alert.isCriticalRepositionOverride)
      );
    }
  };

  return (
    <div
      ref={containerRef}
      aria-label="위험 알림 영역"
      className="sticky top-16 z-20 bg-slate-50 border-b border-slate-200/90 shadow-xs"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-2 max-h-[40vh] overflow-y-auto space-y-1.5">
        {/* 상단 요약 + 소리 토글 헤더 */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Bell
              className={`w-3.5 h-3.5 ${
                criticalAlerts.length > 0 ? 'text-red-600' : 'text-slate-500'
              }`}
            />
            {patientsCount === 0 ? (
              <span className="text-slate-600">
                ● 등록된 환자가 없습니다 · 환자를 추가해 주세요
              </span>
            ) : criticalAlerts.length > 0 ? (
              <span className="text-red-700 font-bold">
                위험 환자 {criticalAlerts.length}명 (전체 표시 · +N 접기 안 함)
              </span>
            ) : topNormalAlert ? (
              <span className="text-slate-700">긴급 위험 없음 · 일반 알림 확인</span>
            ) : (
              <span className="text-emerald-700">
                ● 긴급 위험 알림 없음 · 모든 환자 안정 모니터링 중 (가상 데이터)
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleSound}
            aria-pressed={soundEnabled}
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              soundEnabled
                ? 'bg-red-600 text-white border-red-700 hover:bg-red-700'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-3 h-3" />
            ) : (
              <VolumeX className="w-3 h-3" />
            )}
            <span>소리: {soundEnabled ? '켜짐' : '꺼짐'}</span>
          </button>
        </div>

        {/* A(1)~(3) 위험 알림 줄: 환자마다 1줄씩 모두 표시 (최대 3개, 초과 시 더 보기) */}
        {visibleCritical.map((item) => {
          const pt = item.patient;
          const isUnhandled = item.stage === 'alert_required';
          const isAwaitingOrder = item.stage === 'awaiting_order';
          const isObserving =
            item.stage === 'observing' || item.stage === 'continuous_observation';
          const isOrderOpen = openOrderPatientId === pt.id && isAwaitingOrder;
          const isRecheckOpen = openRecheckPatientId === pt.id && isObserving;
          const draft = getOrderDraft(pt);
          const recheckDraft = getRecheckDraft(pt);
          const isCurrentPt = pt.id === activePatientId;
          const recAngleLabel =
            item.recommendedRevTilt > 0
              ? `침대 전체 +${item.recommendedRevTilt}° 적용`
              : `추천 각도 ${item.recommendedHob}° 적용`;

          return (
            <div
              key={pt.id}
              role="alert"
              className={`rounded-md border px-3 py-2 transition-colors space-y-1.5 ${
                isUnhandled
                  ? 'bg-red-600 border-red-700 text-white shadow-sm'
                  : 'bg-red-50 border-red-300 text-red-950'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* 왼쪽: 깜빡임 표시(미처리 시) + 크게 표시한 호실·환자이름(클릭 이동) · 위험 사유 */}
                <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-bold rounded shrink-0 ${
                      isUnhandled
                        ? 'bg-white text-red-700 animate-critical-blink'
                        : 'bg-red-200/80 text-red-900'
                    }`}
                  >
                    <span>✖</span>
                    <span>{isUnhandled ? '위험 · 확인 필요' : '위험 · 처리 중'}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => onSelectPatientAndGoWorkspace(pt.id)}
                    title="클릭 시 해당 환자를 선택하고 침대 각도 조절 탭으로 이동"
                    className={`text-sm sm:text-base font-bold underline decoration-1 underline-offset-2 cursor-pointer whitespace-nowrap ${
                      isUnhandled
                        ? 'text-white hover:text-red-100'
                        : 'text-red-950 hover:text-blue-700'
                    }`}
                  >
                    {pt.bedNumber} · {pt.patientName}
                  </button>

                  {isCurrentPt && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                        isUnhandled ? 'bg-red-800/70 text-red-100' : 'bg-white text-slate-700 border border-red-200'
                      }`}
                    >
                      선택됨
                    </span>
                  )}

                  <span
                    className={`text-sm sm:text-base font-extrabold tracking-tight ${
                      isUnhandled ? 'text-amber-100' : 'text-red-800'
                    }`}
                  >
                    {item.shortReason}
                  </span>

                  <span
                    className={`text-[11px] font-mono tabular-nums ${
                      isUnhandled ? 'text-red-100' : 'text-slate-600'
                    }`}
                  >
                    (현재 {pt.inputs.currentHob}° ·{' '}
                    {isUnhandled
                      ? '의료진 알림 대기'
                      : isAwaitingOrder
                        ? `${item.effectiveCrit.alertedAtClock ?? ''} 알림 완료`
                        : item.effectiveCrit.doctorOrderNote || '처치 중 관찰'}
                    )
                  </span>
                </div>

                {/* 오른쪽: 단계별 즉시 처리 버튼 */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {isUnhandled && (
                    <button
                      type="button"
                      onClick={() => onNotifyDoctorCritical(pt)}
                      className="px-3 py-1.5 text-xs font-bold bg-white text-red-700 hover:bg-red-50 rounded shadow-xs whitespace-nowrap cursor-pointer"
                    >
                      의료진에게 알리기
                    </button>
                  )}

                  {isAwaitingOrder && (
                    <button
                      type="button"
                      onClick={() => handleOpenOrderForm(item)}
                      className="px-3 py-1.5 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded whitespace-nowrap cursor-pointer"
                    >
                      {isOrderOpen ? '입력 창 닫기' : '지시·처치 입력'}
                    </button>
                  )}

                  {isObserving && (
                    <>
                      <button
                        type="button"
                        disabled={!item.isSafetyConfirmed}
                        onClick={() =>
                          onApplyCriticalRecommendedAngle(
                            pt,
                            item.recommendedHob,
                            item.recommendedRevTilt
                          )
                        }
                        className={`px-3 py-1.5 text-xs font-bold rounded whitespace-nowrap ${
                          item.isSafetyConfirmed
                            ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {recAngleLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenRecheckForm(item)}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-red-300 text-red-900 hover:bg-red-100 rounded whitespace-nowrap cursor-pointer"
                      >
                        {isRecheckOpen ? '재측정 닫기' : '재측정'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* C(9) 에피소드당 1회 공유 확인 체크박스 + 비활성화 1줄 이유 */}
              <div
                className={`flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1 border-t ${
                  isUnhandled ? 'border-red-500/70' : 'border-red-200/80'
                }`}
              >
                <label className="inline-flex items-center gap-1.5 font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={item.isSafetyConfirmed}
                    onChange={(e) => onToggleSafetyConfirmed(pt, e.target.checked)}
                    className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                  />
                  <span>의료진에게 체위·각도 변경 가능 여부를 확인했습니다</span>
                </label>

                {isObserving && !item.isSafetyConfirmed && (
                  <span className="text-[11px] font-semibold text-red-800">
                    ※ 왼쪽 확인 체크 전까지 추천 각도 적용이 비활성화됩니다
                  </span>
                )}
              </div>

              {/* A(3) 알림 줄 내 인라인 지시·처치 입력 창 (시연용 입력 포함) */}
              {isOrderOpen && (
                <div className="bg-white text-slate-900 border border-red-200 rounded p-2.5 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <input
                      type="text"
                      value={draft.note}
                      onChange={(e) =>
                        setOrderDrafts((prev) => ({
                          ...prev,
                          [pt.id]: { ...draft, note: e.target.value },
                        }))
                      }
                      placeholder="지시·처치 내용 입력 (예: 산소 투여, 15분 후 재측정)"
                      aria-label={`${pt.patientName} 지시 처치 내용`}
                      className="flex-1 min-w-[200px] px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setOrderDrafts((prev) => ({
                          ...prev,
                          [pt.id]: {
                            note: '산소 투여, 15분 후 재측정',
                            hob: item.recommendedHob,
                          },
                        }))
                      }
                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded whitespace-nowrap cursor-pointer"
                    >
                      시연용 입력
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[11px] text-slate-600 mr-1">지시 각도:</span>
                      {[null, 15, 30, 45, 60].map((deg) => (
                        <button
                          key={deg === null ? 'keep' : deg}
                          type="button"
                          onClick={() =>
                            setOrderDrafts((prev) => ({
                              ...prev,
                              [pt.id]: { ...draft, hob: deg },
                            }))
                          }
                          className={`px-2 py-0.5 text-[11px] font-mono rounded border cursor-pointer ${
                            draft.hob === deg
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {deg === null ? `유지(${pt.inputs.currentHob}°)` : `${deg}°`}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSubmitDoctorOrder(
                          pt,
                          draft.note.trim() || '산소 투여, 15분 후 재측정',
                          draft.hob
                        );
                        setOpenOrderPatientId(null);
                      }}
                      className="px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded whitespace-nowrap cursor-pointer"
                    >
                      지시 저장
                    </button>
                  </div>
                </div>
              )}

              {/* 알림 줄 내 인라인 재측정 입력 창 */}
              {isRecheckOpen && (
                <div className="bg-white text-slate-900 border border-red-200 rounded p-2.5 flex flex-wrap items-end gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600">
                      호흡(회)
                    </label>
                    <input
                      type="number"
                      min={4}
                      max={50}
                      value={recheckDraft.rr}
                      onChange={(e) =>
                        setRecheckDrafts((prev) => ({
                          ...prev,
                          [pt.id]: { ...recheckDraft, rr: Number(e.target.value) || 0 },
                        }))
                      }
                      className="w-16 px-2 py-1 font-mono tabular-nums border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600">
                      맥박(회)
                    </label>
                    <input
                      type="number"
                      min={20}
                      max={200}
                      value={recheckDraft.hr}
                      onChange={(e) =>
                        setRecheckDrafts((prev) => ({
                          ...prev,
                          [pt.id]: { ...recheckDraft, hr: Number(e.target.value) || 0 },
                        }))
                      }
                      className="w-16 px-2 py-1 font-mono tabular-nums border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600">
                      산소(%)
                    </label>
                    <input
                      type="number"
                      min={60}
                      max={100}
                      value={recheckDraft.spo2}
                      onChange={(e) =>
                        setRecheckDrafts((prev) => ({
                          ...prev,
                          [pt.id]: { ...recheckDraft, spo2: Number(e.target.value) || 0 },
                        }))
                      }
                      className="w-16 px-2 py-1 font-mono tabular-nums border border-slate-300 rounded"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSubmitRecheck(pt, 'unchanged', recheckDraft);
                      setOpenRecheckPatientId(null);
                    }}
                    className="px-2.5 py-1 text-xs font-medium bg-white border border-slate-300 hover:bg-slate-100 rounded cursor-pointer"
                  >
                    변화 없음
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSubmitRecheck(pt, 'manual', recheckDraft);
                      setOpenRecheckPatientId(null);
                    }}
                    className="px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded cursor-pointer"
                  >
                    재측정 저장
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* 위험 환자 3명 초과 시 '위험 환자 ○명 더 보기' */}
        {hiddenCriticalCount > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowAllCritical((v) => !v)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-red-800 bg-red-100 hover:bg-red-200 border border-red-300 rounded cursor-pointer"
            >
              <span>
                {showAllCritical
                  ? '위험 환자 접기 (최대 3개 보기)'
                  : `위험 환자 ${hiddenCriticalCount}명 더 보기`}
              </span>
              {showAllCritical ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}

        {/* A(1) 일반 알림(호흡·각도/체위변경)만 '알림 +N'으로 접어서 1줄 표시 */}
        {topNormalAlert && (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-950 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 flex-1 flex flex-wrap items-center gap-2">
                <span className="font-bold shrink-0">
                  {topNormalAlert.category === 'respiratory' ? '▲' : '●'}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectPatientAndGoWorkspace(topNormalAlert.patient.id)}
                  className="font-bold underline decoration-1 underline-offset-2 hover:text-blue-700 cursor-pointer whitespace-nowrap"
                >
                  {topNormalAlert.patient.bedNumber} {topNormalAlert.patient.patientName}
                </button>
                <span className="font-semibold truncate">{topNormalAlert.title}</span>
                <span className="text-[11px] text-slate-600 truncate hidden sm:inline">
                  · {topNormalAlert.summary}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {topNormalAlert.actionLabel && !topNormalAlert.isCriticalDelayedNotice && (
                  <button
                    type="button"
                    disabled={
                      Boolean(topNormalAlert.isCriticalRepositionOverride) &&
                      !Boolean(topNormalAlert.patient.criticalAlert?.safetyChangeConfirmed)
                    }
                    onClick={() => handleNormalAction(topNormalAlert)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded whitespace-nowrap ${
                      Boolean(topNormalAlert.isCriticalRepositionOverride) &&
                      !Boolean(topNormalAlert.patient.criticalAlert?.safetyChangeConfirmed)
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                    }`}
                  >
                    {topNormalAlert.actionLabel}
                  </button>
                )}

                {topNormalAlert.canHoldReposition && (
                  <button
                    type="button"
                    onClick={() =>
                      setHoldTargetPatientId((prev) =>
                        prev === topNormalAlert.patient.id ? null : topNormalAlert.patient.id
                      )
                    }
                    className="text-[11px] font-medium text-slate-600 hover:text-slate-900 underline px-1 cursor-pointer"
                  >
                    보류
                  </button>
                )}

                {topNormalAlert.category === 'respiratory' && topNormalAlert.angleKey && (
                  <button
                    type="button"
                    onClick={() =>
                      onAcknowledgeNormalAngle(
                        topNormalAlert.patient.id,
                        topNormalAlert.angleKey!
                      )
                    }
                    className="text-[11px] font-medium text-slate-600 hover:text-slate-900 underline px-1 cursor-pointer"
                  >
                    보류
                  </button>
                )}

                {remainingNormalAlerts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setNormalStackOpen((v) => !v)}
                    className="px-2 py-0.5 text-[11px] font-semibold bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 rounded whitespace-nowrap cursor-pointer"
                  >
                    알림 +{remainingNormalAlerts.length}
                  </button>
                )}
              </div>
            </div>

            {holdTargetPatient && (
              <div className="pt-1.5 border-t border-amber-200 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-700">
                  보류 사유 (15분 뒤 재알림):
                </span>
                {HOLD_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      onHoldReposition(holdTargetPatient, chip, customHoldReason);
                      setHoldTargetPatientId(null);
                      setCustomHoldReason('');
                    }}
                    className="px-2 py-0.5 text-[11px] font-semibold bg-white hover:bg-blue-50 text-slate-800 border border-slate-300 rounded cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
                <input
                  type="text"
                  value={customHoldReason}
                  onChange={(e) => setCustomHoldReason(e.target.value)}
                  placeholder="기타 사유 입력(선택)"
                  aria-label="기타 보류 사유"
                  className="px-2 py-0.5 text-[11px] bg-white border border-slate-300 rounded text-slate-800 min-w-[130px]"
                />
              </div>
            )}

            {normalStackOpen && remainingNormalAlerts.length > 0 && (
              <div className="pt-1.5 border-t border-amber-200 space-y-1">
                {remainingNormalAlerts.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 bg-white/90 border border-amber-200 rounded px-2.5 py-1 text-[11px]"
                  >
                    <span className="font-medium text-slate-800 truncate">
                      {item.title} — <span className="text-slate-500">{item.summary}</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.category === 'reposition' && item.targetTilt && !item.isCriticalDelayedNotice && (
                        <button
                          type="button"
                          onClick={() =>
                            onApplyRepositionFromAlert(
                              item.patient,
                              item.targetTilt!,
                              Boolean(item.isCriticalRepositionOverride)
                            )
                          }
                          className="font-semibold text-blue-700 hover:underline cursor-pointer"
                        >
                          {formatTiltKo(item.targetTilt)} 적용
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPatientAndGoWorkspace(item.patient.id);
                          setNormalStackOpen(false);
                        }}
                        className="font-semibold text-slate-700 hover:underline cursor-pointer"
                      >
                        이동
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
