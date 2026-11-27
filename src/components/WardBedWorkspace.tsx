import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FastForward,
  MoreHorizontal,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Trash2,
  UserPlus,
} from 'lucide-react';
import {
  DEFAULT_CRITICAL_ALERT_STATE,
  evaluateBedAngleProtocol,
  evaluatePatientVitalStatus,
  formatRepositionAgoLabel,
  formatTiltKo,
  getDefaultRepositionInterval,
  HIGH_ANGLE_HOB_THRESHOLD,
  INITIAL_WARD_PATIENTS,
  PatientInputs,
  SacralSkinStatus,
  simulateVitalsAtAngle,
  WardPatient,
} from '../data/protocolData';
import {
  formatClockFromElapsed,
  formatElapsed,
  getEffectiveCriticalAlertFor,
  getNextUniqueElapsedFor,
  getPatientRepositionMetrics,
  isCriticalPriorityActiveFor,
  isDoctorNotifiedFor,
  TimeEventLog,
} from '../utils/wardHelpers';
import { BedAngleVisualizer } from './BedAngleVisualizer';
import { VitalTrendChart } from './VitalTrendChart';

interface WardBedWorkspaceProps {
  patients: WardPatient[];
  activePatient: WardPatient | null;
  missingDefaultPatientsCount: number;
  onSelectPatient: (id: string) => void;
  onRequestOpenAddPatient: () => void;
  onRequestDeletePatient: (patient: WardPatient) => void;
  onRestoreDefaultPatients: () => void;
  onUpdatePatient: (updated: WardPatient) => void;
  onUpdateField: <K extends keyof PatientInputs>(key: K, value: PatientInputs[K]) => void;
  onUpdateCustomRepositionInterval: (mins: number | null) => void;
  virtualMode: boolean;
  onToggleVirtualMode: () => void;
  timeFlowPlaying: boolean;
  onToggleTimeFlow: () => void;
  timeSpeed: 1 | 10 | 60;
  onChangeTimeSpeed: (speed: 1 | 10 | 60) => void;
  stoppedByAlertNotice: boolean;
  onAdvanceTime: (deltaMin: number) => void;
  timeEvents: TimeEventLog[];
  recheckPanelOpen: boolean;
  onToggleRecheckPanel: (open?: boolean) => void;
  recheckInputs: { rr: number; hr: number; spo2: number };
  onChangeRecheckInputs: (next: { rr: number; hr: number; spo2: number }) => void;
  orderNoteInput: string;
  onChangeOrderNote: (val: string) => void;
  orderHobInput: number | null;
  onChangeOrderHob: (val: number | null) => void;
  lastSimRecoveryBadge: string | null;
  onNotifyDoctorCritical: (patient: WardPatient) => void;
  onSubmitDoctorOrder: (patient: WardPatient, note: string, hob: number | null) => void;
  onSubmitCriticalRecheck: (
    patient: WardPatient,
    mode: 'manual' | 'unchanged',
    vitals: { rr: number; hr: number; spo2: number }
  ) => void;
  onApplyAngle: (patient: WardPatient, targetHob: number, revTilt?: number) => void;
  onToggleSafetyConfirmed: (patient: WardPatient, confirmed: boolean) => void;
  onTriggerCriticalDemo: () => void;
  onRequestReset: () => void;
  stickyTopOffsetPx: number;
}

const QUICK_ANGLES = [0, 15, 30, 45, 60, 75, 90];

export const WardBedWorkspace: React.FC<WardBedWorkspaceProps> = ({
  patients,
  activePatient,
  missingDefaultPatientsCount,
  onSelectPatient,
  onRequestOpenAddPatient,
  onRequestDeletePatient,
  onRestoreDefaultPatients,
  onUpdatePatient,
  onUpdateField,
  onUpdateCustomRepositionInterval,
  virtualMode,
  onToggleVirtualMode,
  timeFlowPlaying,
  onToggleTimeFlow,
  timeSpeed,
  onChangeTimeSpeed,
  stoppedByAlertNotice,
  onAdvanceTime,
  timeEvents,
  recheckPanelOpen,
  onToggleRecheckPanel,
  recheckInputs,
  onChangeRecheckInputs,
  orderNoteInput,
  onChangeOrderNote,
  orderHobInput,
  onChangeOrderHob,
  lastSimRecoveryBadge,
  onNotifyDoctorCritical,
  onSubmitDoctorOrder,
  onSubmitCriticalRecheck,
  onApplyAngle,
  onToggleSafetyConfirmed,
  onTriggerCriticalDemo,
  onRequestReset,
  stickyTopOffsetPx,
}) => {
  const inputs = activePatient?.inputs ?? INITIAL_WARD_PATIENTS[0].inputs;
  const elapsedMinutes = Math.max(0, activePatient?.elapsedMinutes ?? 0);

  const activeVitalStatus = useMemo(() => evaluatePatientVitalStatus(inputs), [inputs]);
  const recommendedForPatient = useMemo(() => evaluateBedAngleProtocol(inputs), [inputs]);
  const mapValue = Math.round((inputs.sbp + 2 * inputs.dbp) / 3);
  const hasPressureRisk =
    inputs.pressureInjuryHighRisk || inputs.sacralSkinStatus !== 'intact';

  // 선택/조절 중인 목표 각도 (기본은 추천 각도)
  const [plannedHobInput, setPlannedHobInput] = useState<number>(
    recommendedForPatient.recommendedHob
  );
  const [showVisuals, setShowVisuals] = useState<boolean>(false);
  const [showMoreDetails, setShowMoreDetails] = useState<boolean>(false);
  const [openCardMenuId, setOpenCardMenuId] = useState<string | null>(null);

  useEffect(() => {
    setPlannedHobInput(recommendedForPatient.recommendedHob);
  }, [activePatient?.id, recommendedForPatient.recommendedHob]);

  useEffect(() => {
    if (!openCardMenuId) return;
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-card-menu-root="true"]')) return;
      setOpenCardMenuId(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenCardMenuId(null);
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openCardMenuId]);

  const liveDecision = useMemo(
    () => evaluateBedAngleProtocol({ ...inputs, currentHob: plannedHobInput }),
    [inputs, plannedHobInput]
  );

  if (patients.length === 0 || !activePatient) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold text-slate-600">병실 환자 목록 (0명)</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={missingDefaultPatientsCount === 0}
              onClick={onRestoreDefaultPatients}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>
                기본 환자 복원
                {missingDefaultPatientsCount > 0 ? ` (${missingDefaultPatientsCount}명)` : ''}
              </span>
            </button>
          </div>
        </div>

        <section
          aria-label="등록된 환자 없음"
          className="bg-white border border-slate-200 rounded-lg p-10 text-center space-y-4"
        >
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-slate-900">환자를 추가해 주세요</h2>
            <p className="text-xs text-slate-500">
              현재 병실에 등록된 환자가 없습니다. 새 환자를 추가하거나 기본 환자를 복원해
              모니터링을 시작하세요.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={onRequestOpenAddPatient}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md whitespace-nowrap cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>환자 추가</span>
            </button>
            {missingDefaultPatientsCount > 0 && (
              <button
                type="button"
                onClick={onRestoreDefaultPatients}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>기본 환자 복원 ({missingDefaultPatientsCount}명)</span>
              </button>
            )}
          </div>
        </section>
      </div>
    );
  }

  // 현재 환자 위험 흐름 상태 (상단/하단 바와 100% 동기화)
  const effectiveCriticalAlert = getEffectiveCriticalAlertFor(activePatient);
  const isCriticalPriorityActive = isCriticalPriorityActiveFor(activePatient);
  const criticalDoctorNotified = isDoctorNotifiedFor(activePatient);
  const isSafetyConfirmed = Boolean(effectiveCriticalAlert.safetyChangeConfirmed);

  // 체위변경 지표
  const repMetrics = getPatientRepositionMetrics(activePatient);
  const defaultRepositionInterval = getDefaultRepositionInterval(inputs);
  const isCustomRepositionInterval = activePatient.customRepositionIntervalMin != null;
  const minutesAbove45 = activePatient.minutesAbove45 ?? 0;

  const activeRuleConflicts = recommendedForPatient.ruleConflicts;

  // 시각화용 수치 계산
  const displayKnee = plannedHobInput > 30 ? (hasPressureRisk ? 15 : 12) : 0;
  const displayRevTilt =
    inputs.spinalOrHipContraindication && inputs.currentHob === 0
      ? liveDecision.reverseTrendelenburgDeg
      : 0;
  const displayTripod = plannedHobInput >= 80 && liveDecision.tripodSupport;
  const displayLegRaise =
    plannedHobInput === 0 && liveDecision.legRaiseDeg > 0 ? liveDecision.legRaiseDeg : 0;
  const displaySeverity =
    activeVitalStatus.level === 'critical'
      ? 'critical'
      : activeRuleConflicts.length > 0 || activeVitalStatus.level === 'caution'
        ? 'caution'
        : liveDecision.severity;

  const recommendedAngleText =
    recommendedForPatient.reverseTrendelenburgDeg > 0
      ? `침대 전체 +${recommendedForPatient.reverseTrendelenburgDeg}° (등받이 0°)`
      : activeVitalStatus.level === 'critical' &&
          recommendedForPatient.recommendedHob === Math.round(inputs.currentHob / 5) * 5
        ? `현재 각도(${recommendedForPatient.recommendedHob}°) 유지`
        : `${recommendedForPatient.recommendedHob}°`;

  const applyButtonDisabled =
    isCriticalPriorityActive && (!criticalDoctorNotified || !isSafetyConfirmed);
  const applyDisabledReason = !criticalDoctorNotified
    ? '위험 상태: 먼저 위쪽 알림이나 아래 버튼으로 [의료진에게 알리기]를 완료해 주세요.'
    : '위험 상태: 아래 의료진 확인 체크 전까지 각도 적용 버튼이 비활성화됩니다.';

  const totalProgressScale = Math.max(1, repMetrics.interval, repMetrics.maintained);
  const normalProgressPct =
    (Math.min(repMetrics.maintained, repMetrics.interval) / totalProgressScale) * 100;
  const overdueProgressPct = (repMetrics.overdue / totalProgressScale) * 100;

  const isTimeBlockedByCritical =
    effectiveCriticalAlert.stage === 'alert_required' ||
    effectiveCriticalAlert.stage === 'awaiting_order';

  return (
    <div className="space-y-4">
      {/* 위험 대응 입력 & 재측정 패널 (지시 입력 / 관찰 중 재측정 / 호전 종료 시에만 컴팩트 표시) */}
      {(effectiveCriticalAlert.stage === 'awaiting_order' ||
        effectiveCriticalAlert.stage === 'observing' ||
        effectiveCriticalAlert.stage === 'continuous_observation' ||
        effectiveCriticalAlert.stage === 'resolved' ||
        recheckPanelOpen) && (
        <section
          aria-label="위험 대응 및 재측정"
          className={`rounded-lg border p-4 space-y-3 ${
            effectiveCriticalAlert.stage === 'resolved'
              ? 'bg-emerald-50 border-emerald-300'
              : effectiveCriticalAlert.stage === 'idle'
                ? 'bg-white border-slate-200'
                : 'bg-amber-50 border-amber-300'
          }`}
        >
          {effectiveCriticalAlert.stage === 'awaiting_order' && (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-950">
                  ● {effectiveCriticalAlert.alertedAtClock} 의료진 알림 완료 — 지시·처치 입력
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeOrderNote('산소 투여, 15분 후 재측정')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded cursor-pointer"
                  >
                    시연용 입력
                  </button>
                  <span className="text-[11px] text-slate-600">
                    입력 후 처치 중 관찰 상태로 전환
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={orderNoteInput}
                  onChange={(e) => onChangeOrderNote(e.target.value)}
                  placeholder="처치 내용 메모 (예: 산소 투여, 15분 후 재측정)"
                  aria-label="처치 내용 메모"
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {[null, 15, 30, 45, 60].map((deg) => (
                    <button
                      key={deg === null ? 'keep' : deg}
                      type="button"
                      onClick={() => onChangeOrderHob(deg)}
                      className={`px-2.5 py-1.5 text-[11px] font-mono rounded border cursor-pointer ${
                        orderHobInput === deg
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      {deg === null ? `유지(${inputs.currentHob}°)` : `${deg}°`}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      onSubmitDoctorOrder(activePatient, orderNoteInput, orderHobInput)
                    }
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer"
                  >
                    지시 저장
                  </button>
                </div>
              </div>
            </div>
          )}

          {effectiveCriticalAlert.seniorEscalationShown &&
            !effectiveCriticalAlert.seniorEscalationAcknowledged &&
            (effectiveCriticalAlert.stage === 'observing' ||
              effectiveCriticalAlert.stage === 'continuous_observation') && (
              <div className="bg-red-100 border border-red-300 rounded p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-red-900">
                <span>
                  <strong>▲ 호전 없음 {effectiveCriticalAlert.noImprovementCount}회(가정값)</strong>{' '}
                  — 상급 의료진·신속대응 요청을 고려하세요.
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePatient({
                      ...activePatient,
                      criticalAlert: {
                        ...effectiveCriticalAlert,
                        seniorEscalationAcknowledged: true,
                      },
                    })
                  }
                  className="px-3 py-1 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded cursor-pointer"
                >
                  확인 · 지속 관찰 유지
                </button>
              </div>
            )}

          {(effectiveCriticalAlert.stage === 'observing' ||
            effectiveCriticalAlert.stage === 'continuous_observation' ||
            (recheckPanelOpen &&
              effectiveCriticalAlert.stage !== 'awaiting_order' &&
              effectiveCriticalAlert.stage !== 'resolved')) && (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-slate-900">
                  {effectiveCriticalAlert.stage === 'continuous_observation'
                    ? `● 지시 대기·지속 관찰 (호전 없음 ${effectiveCriticalAlert.noImprovementCount}회)`
                    : effectiveCriticalAlert.stage === 'observing'
                      ? `● 처치 중 관찰 (${effectiveCriticalAlert.doctorOrderNote || '관찰 중'}) · 안정 ${effectiveCriticalAlert.consecutiveSafeRechecks}/2회`
                      : '재측정 수치 입력'}
                </div>
                {recheckPanelOpen && effectiveCriticalAlert.stage === 'idle' && (
                  <button
                    type="button"
                    onClick={() => onToggleRecheckPanel(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    닫기
                  </button>
                )}
              </div>

              {virtualMode && lastSimRecoveryBadge && (
                <div className="text-xs text-blue-900 bg-blue-50 border border-blue-200 rounded px-3 py-1.5">
                  {lastSimRecoveryBadge}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2.5 items-end">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    호흡수 (회/분)
                  </label>
                  <input
                    type="number"
                    min={4}
                    max={50}
                    value={recheckInputs.rr}
                    onChange={(e) =>
                      onChangeRecheckInputs({
                        ...recheckInputs,
                        rr: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    맥박수 (회/분)
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={200}
                    value={recheckInputs.hr}
                    onChange={(e) =>
                      onChangeRecheckInputs({
                        ...recheckInputs,
                        hr: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    산소포화도 (SpO2 %)
                  </label>
                  <input
                    type="number"
                    min={60}
                    max={100}
                    value={recheckInputs.spo2}
                    onChange={(e) =>
                      onChangeRecheckInputs({
                        ...recheckInputs,
                        spo2: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {(effectiveCriticalAlert.stage === 'observing' ||
                    effectiveCriticalAlert.stage === 'continuous_observation') && (
                    <button
                      type="button"
                      onClick={() =>
                        onSubmitCriticalRecheck(activePatient, 'unchanged', recheckInputs)
                      }
                      className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md whitespace-nowrap cursor-pointer"
                    >
                      변화 없음
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      onSubmitCriticalRecheck(activePatient, 'manual', recheckInputs)
                    }
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md whitespace-nowrap cursor-pointer"
                  >
                    재측정 기록
                  </button>
                </div>
              </div>
            </div>
          )}

          {effectiveCriticalAlert.stage === 'resolved' && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-emerald-800">
                ● 호전 시 종료 ({effectiveCriticalAlert.lastRecheckAtClock}) — 2회 연속 안정 확인
                (체위변경 숨김 자동 해제됨)
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdatePatient({
                    ...activePatient,
                    criticalAlert: DEFAULT_CRITICAL_ALERT_STATE,
                  })
                }
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded cursor-pointer"
              >
                종료 확인
              </button>
            </div>
          )}
        </section>
      )}

      {/* ② 환자 선택 카드 (목록 헤더 + 기본 환자 복원 + 카드별 '⋯' 삭제 메뉴) */}
      <section aria-label="환자 선택 카드" className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold text-slate-600">
            병실 환자 목록 ({patients.length}명)
          </div>
          <button
            type="button"
            disabled={missingDefaultPatientsCount === 0}
            onClick={onRestoreDefaultPatients}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>
              기본 환자 복원
              {missingDefaultPatientsCount > 0 ? ` (${missingDefaultPatientsCount}명)` : ''}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {patients.map((pt) => {
            const ptVs = evaluatePatientVitalStatus(pt.inputs);
            const ptCritActive = isCriticalPriorityActiveFor(pt);
            const isSelected = pt.id === activePatient.id;
            const ptM = getPatientRepositionMetrics(pt);
            const isMenuOpen = openCardMenuId === pt.id;

            const statusColor =
              ptVs.level === 'critical'
                ? 'text-red-700'
                : ptVs.level === 'caution'
                  ? 'text-amber-700'
                  : 'text-emerald-700';

            const repositionBadgeText =
              ptM.overdue > 0
                ? `지연 ${ptM.overdue}분`
                : ptM.maintained >= ptM.interval
                  ? '자세 변경 필요'
                  : ptM.snoozeLeft > 0
                    ? `보류 ${ptM.snoozeLeft}분`
                    : ptM.isImminent
                      ? `임박 ${ptM.remaining}분`
                      : `체위 ${ptM.remaining}분 남음`;

            const repositionBadgeClass =
              ptM.overdue > 0
                ? 'bg-red-100 text-red-800 border-red-300 font-bold'
                : ptM.isImminent || ptM.maintained >= ptM.interval || ptM.snoozeLeft > 0
                  ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
                  : 'bg-slate-50 text-slate-600 border-slate-200';

            const cardBorderClass = ptCritActive
              ? isSelected
                ? 'bg-red-50/40 border-red-600 ring-2 ring-red-500/40'
                : 'bg-red-50/20 border-red-500 hover:border-red-600'
              : isSelected
                ? 'bg-white border-blue-600 ring-2 ring-blue-500/40'
                : 'bg-white border-slate-200 hover:border-slate-300';

            return (
              <div
                key={pt.id}
                className={`relative rounded-lg border transition-colors ${cardBorderClass}`}
              >
                {/* 항목 1 & 2: 병실·이름 + 상태 배지 + '⋯' 메뉴 */}
                <div className="flex items-center justify-between gap-1.5 px-3.5 pt-3.5">
                  <button
                    type="button"
                    onClick={() => onSelectPatient(pt.id)}
                    className="flex-1 min-w-0 flex items-center justify-between gap-2 text-left cursor-pointer"
                  >
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {pt.bedNumber} · {pt.patientName}
                    </span>
                    {ptCritActive ? (
                      <span className="px-2 py-0.5 text-[11px] font-bold bg-red-600 text-white rounded shrink-0">
                        위험
                      </span>
                    ) : (
                      <span className={`text-xs font-bold shrink-0 ${statusColor}`}>
                        {ptVs.glyph} {ptVs.label}
                      </span>
                    )}
                  </button>

                  <div className="relative shrink-0" data-card-menu-root="true">
                    <button
                      type="button"
                      aria-label={`${pt.bedNumber} ${pt.patientName} 환자 메뉴`}
                      aria-haspopup="menu"
                      aria-expanded={isMenuOpen}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenCardMenuId((prev) => (prev === pt.id ? null : pt.id));
                      }}
                      className="p-1 rounded hover:bg-slate-200/70 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-30"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenCardMenuId(null);
                            onRequestDeletePatient(pt);
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs font-semibold text-red-700 hover:bg-red-50 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          <span>삭제(퇴원 처리)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 항목 3 & 4: 한 줄 수치 요약 + 체위변경 상태 배지 */}
                <button
                  type="button"
                  onClick={() => onSelectPatient(pt.id)}
                  className="w-full text-left px-3.5 pb-3.5 pt-1.5 space-y-1.5 cursor-pointer"
                >
                  <div className="text-xs font-mono tabular-nums text-slate-600 truncate">
                    {pt.inputs.currentHob}° · 호흡 {pt.inputs.rr} · 맥박 {pt.inputs.hr} · 산소{' '}
                    {pt.inputs.spo2}%
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-mono tabular-nums px-2 py-0.5 rounded border ${repositionBadgeClass}`}
                    >
                      {ptM.isImminent && ptM.overdue === 0 && (
                        <span
                          className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <span>{repositionBadgeText}</span>
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 얇은 시뮬레이션 바 (항상 표시 · 스크롤 시 상단 알림 영역 바로 아래에 가볍게 고정) */}
      <section
        aria-label="시뮬레이션 바"
        style={{ top: `${stickyTopOffsetPx}px` }}
        className="md:sticky z-10 bg-white border border-slate-200 rounded-lg px-3.5 py-2 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs"
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleVirtualMode}
            className={`px-2.5 py-1 font-semibold rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              virtualMode
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            가상 모드: {virtualMode ? '켜짐' : '꺼짐'}
          </button>

          {virtualMode && (
            <span className="font-semibold text-blue-700 whitespace-nowrap shrink-0">
              가상 시뮬레이션
            </span>
          )}

          <button
            type="button"
            disabled={!timeFlowPlaying && isTimeBlockedByCritical}
            onClick={onToggleTimeFlow}
            className={`px-2.5 py-1 font-semibold rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              timeFlowPlaying
                ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed'
            }`}
          >
            <span className="inline-flex items-center gap-1">
              {timeFlowPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{timeFlowPlaying ? '⏸ 멈춤' : '▷ 시간 흐르기'}</span>
            </span>
          </button>

          <div
            role="group"
            aria-label="시간 흐름 속도"
            className="inline-flex items-center rounded border border-slate-200 bg-slate-50 p-0.5 shrink-0"
          >
            {(
              [
                [1, '×1', '1초에 1분'],
                [10, '×10', '1초에 10분'],
                [60, '×60', '1초에 1시간'],
              ] as const
            ).map(([spd, label, desc]) => (
              <button
                key={spd}
                type="button"
                title={desc}
                onClick={() => onChangeTimeSpeed(spd)}
                className={`px-2 py-0.5 font-mono font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
                  timeSpeed === spd
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {(
              [
                [15, '+15분'],
                [30, '+30분'],
                [60, '+1시간'],
              ] as const
            ).map(([mins, label]) => (
              <button
                key={mins}
                type="button"
                disabled={isTimeBlockedByCritical}
                onClick={() => onAdvanceTime(mins)}
                className="px-2 py-1 font-mono font-semibold bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-800 border border-slate-200 hover:border-blue-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed rounded whitespace-nowrap cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onRequestReset}
            className="inline-flex items-center gap-1 px-2.5 py-1 font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>처음으로</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stoppedByAlertNotice && (
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 whitespace-nowrap">
              알림이 떠서 멈췄어요
            </span>
          )}
          {isTimeBlockedByCritical && (
            <span className="text-[11px] font-semibold text-red-700 whitespace-nowrap">
              알림 확인 후 시간이 흐릅니다
            </span>
          )}
          <span className="font-mono tabular-nums text-slate-700 whitespace-nowrap">
            누적 <strong className="text-slate-900">{formatElapsed(elapsedMinutes)}</strong> (
            {formatClockFromElapsed(elapsedMinutes)})
          </span>
        </div>
      </section>

      {/* ③ 수치 입력 영역 (슬라이더 + 입력칸 한 화면에 컴팩트하게) */}
      <section
        aria-label="수치 입력 영역"
        className="bg-white border border-slate-200 rounded-lg p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {activePatient.bedNumber} {activePatient.patientName} — 수치 입력 (활력징후)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activePatient.diagnosis} · 평균동맥압 (MAP) {mapValue} mmHg ·{' '}
              <span
                className={
                  activeVitalStatus.level === 'critical'
                    ? 'text-red-700 font-semibold'
                    : activeVitalStatus.level === 'caution'
                      ? 'text-amber-700 font-semibold'
                      : 'text-emerald-700 font-semibold'
                }
              >
                {activeVitalStatus.label}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onToggleRecheckPanel()}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md whitespace-nowrap cursor-pointer"
            >
              재측정 기록
            </button>
            <button
              type="button"
              onClick={() => onRequestDeletePatient(activePatient)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md whitespace-nowrap cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>삭제(퇴원 처리)</span>
            </button>
          </div>
        </div>

        {activeRuleConflicts.length > 0 && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 rounded-md px-3.5 py-2 text-xs text-red-900 font-medium"
          >
            ▲ 규칙 충돌: {activeRuleConflicts[0]}
          </div>
        )}

        {/* 슬라이더 + 숫자 입력칸 3열 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <label htmlFor="rr-slider" className="font-semibold text-slate-800">
                1분 호흡수 (RR)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={6}
                  max={38}
                  value={inputs.rr}
                  aria-label="1분 호흡수 숫자"
                  onChange={(e) => onUpdateField('rr', Number(e.target.value) || 0)}
                  className="w-14 px-1.5 py-0.5 text-right text-xs font-mono tabular-nums font-bold bg-slate-50 border border-slate-200 rounded"
                />
                <span className="text-[11px] text-slate-400">회</span>
              </div>
            </div>
            <input
              id="rr-slider"
              type="range"
              min={6}
              max={38}
              value={inputs.rr}
              onChange={(e) => onUpdateField('rr', Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <label htmlFor="hr-slider" className="font-semibold text-slate-800">
                1분 맥박수 (HR)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={38}
                  max={150}
                  value={inputs.hr}
                  aria-label="1분 맥박수 숫자"
                  onChange={(e) => onUpdateField('hr', Number(e.target.value) || 0)}
                  className="w-14 px-1.5 py-0.5 text-right text-xs font-mono tabular-nums font-bold bg-slate-50 border border-slate-200 rounded"
                />
                <span className="text-[11px] text-slate-400">회</span>
              </div>
            </div>
            <input
              id="hr-slider"
              type="range"
              min={38}
              max={150}
              value={inputs.hr}
              onChange={(e) => onUpdateField('hr', Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <label htmlFor="spo2-slider" className="font-semibold text-slate-800">
                산소포화도 (SpO2)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={80}
                  max={100}
                  value={inputs.spo2}
                  aria-label="산소포화도 숫자"
                  onChange={(e) => onUpdateField('spo2', Number(e.target.value) || 0)}
                  className="w-14 px-1.5 py-0.5 text-right text-xs font-mono tabular-nums font-bold bg-slate-50 border border-slate-200 rounded"
                />
                <span className="text-[11px] text-slate-400">%</span>
              </div>
            </div>
            <input
              id="spo2-slider"
              type="range"
              min={80}
              max={100}
              value={inputs.spo2}
              onChange={(e) => onUpdateField('spo2', Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        </div>

        {/* 혈압 · 숨참 · 통증 · 피부 상태 5열 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div>
            <label htmlFor="sbp-input" className="block text-[11px] font-semibold text-slate-700 mb-1">
              최고 혈압 (SBP)
            </label>
            <input
              id="sbp-input"
              type="number"
              min={60}
              max={220}
              value={inputs.sbp}
              onChange={(e) => onUpdateField('sbp', Number(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums font-semibold bg-slate-50 border border-slate-200 rounded-md"
            />
          </div>
          <div>
            <label htmlFor="dbp-input" className="block text-[11px] font-semibold text-slate-700 mb-1">
              최저 혈압 (DBP)
            </label>
            <input
              id="dbp-input"
              type="number"
              min={30}
              max={140}
              value={inputs.dbp}
              onChange={(e) => onUpdateField('dbp', Number(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums font-semibold bg-slate-50 border border-slate-200 rounded-md"
            />
          </div>
          <div>
            <label htmlFor="borg-input" className="block text-[11px] font-semibold text-slate-700 mb-1">
              숨찬 정도 (0~10)
            </label>
            <input
              id="borg-input"
              type="number"
              min={0}
              max={10}
              value={inputs.borgScore}
              onChange={(e) =>
                onUpdateField('borgScore', Math.max(0, Math.min(10, Number(e.target.value) || 0)))
              }
              className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums font-semibold bg-slate-50 border border-slate-200 rounded-md"
            />
          </div>
          <div>
            <label htmlFor="pain-input" className="block text-[11px] font-semibold text-slate-700 mb-1">
              아픈 정도 (NRS)
            </label>
            <input
              id="pain-input"
              type="number"
              min={0}
              max={10}
              value={inputs.painNrs}
              onChange={(e) =>
                onUpdateField('painNrs', Math.max(0, Math.min(10, Number(e.target.value) || 0)))
              }
              className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums font-semibold bg-slate-50 border border-slate-200 rounded-md"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="skin-select" className="block text-[11px] font-semibold text-slate-700 mb-1">
              엉치뼈 피부 상태
            </label>
            <select
              id="skin-select"
              value={inputs.sacralSkinStatus}
              onChange={(e) =>
                onUpdateField('sacralSkinStatus', e.target.value as SacralSkinStatus)
              }
              className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800"
            >
              <option value="intact">깨끗함</option>
              <option value="blanchable_erythema">붉게 눌림 (주의)</option>
              <option value="ulcer_stage2_plus">욕창 상처 (제한)</option>
            </select>
          </div>
        </div>

        {/* 환자 특이사항 체크박스 */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-1.5">
          {(
            [
              ['enteralNutrition', '콧줄 식사 (30° 이상)'],
              ['heartFailureOrPulmonaryEdema', '심부전·폐부종 (폐에 물)'],
              ['orthostaticHistory', '기립성 저혈압 이력'],
              ['pressureInjuryHighRisk', '엉치뼈 욕창 고위험'],
              ['iicpRisk', '뇌압 (IICP) 상승 주의'],
              ['spinalOrHipContraindication', '허리·고관절 굽힘 금지'],
              ['copdTargetMode', '만성 폐질환 (COPD)'],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none py-0.5"
            >
              <input
                type="checkbox"
                checked={inputs[key]}
                onChange={(e) => onUpdateField(key, e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* ④ '추천 각도 ○° (무릎 받침 ○°)' 한 줄 + 큰 '적용' 버튼 (상단/하단 바와 공유되는 C9 확인 체크박스) */}
      <section
        aria-label="추천 각도 및 적용"
        className={`rounded-lg border p-5 space-y-4 ${
          isCriticalPriorityActive ? 'bg-red-50/50 border-red-300' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="text-lg font-bold text-slate-900">
              추천 각도{' '}
              <span className="font-mono tabular-nums text-blue-700">{recommendedAngleText}</span>
              {recommendedForPatient.recommendedKneeGatch > 0 && (
                <span className="font-mono tabular-nums text-slate-700">
                  {' '}
                  (무릎 받침 {recommendedForPatient.recommendedKneeGatch}°)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 line-clamp-2">
              {recommendedForPatient.shortReason}
            </p>
          </div>

          <button
            type="button"
            disabled={applyButtonDisabled}
            onClick={() =>
              onApplyAngle(
                activePatient,
                plannedHobInput,
                displayRevTilt > 0 ? displayRevTilt : 0
              )
            }
            className={`px-7 py-3 text-sm font-bold rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              applyButtonDisabled
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : isCriticalPriorityActive
                  ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                  : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
            }`}
          >
            {displayRevTilt > 0 ? `침대 전체 +${displayRevTilt}° 적용` : `${plannedHobInput}° 적용`}
          </button>
        </div>

        {/* C(9) 위험 상태일 때 상단·하단 바와 동기화되는 의료진 확인 체크 + 비활성화 1줄 이유 */}
        {isCriticalPriorityActive && (
          <div className="bg-white border border-red-200 rounded-md p-3 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-red-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSafetyConfirmed}
                  onChange={(e) => onToggleSafetyConfirmed(activePatient, e.target.checked)}
                  className="w-4 h-4 accent-red-600 cursor-pointer"
                />
                <span>의료진에게 체위·각도 변경 가능 여부를 확인했습니다</span>
              </label>
              {!criticalDoctorNotified ? (
                <button
                  type="button"
                  onClick={() => onNotifyDoctorCritical(activePatient)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded cursor-pointer"
                >
                  먼저 의료진에게 알리기
                </button>
              ) : (
                <span className="text-xs font-semibold text-emerald-700">● 의료진 알림 완료</span>
              )}
            </div>
            {applyButtonDisabled && (
              <p className="text-[11px] font-semibold text-red-700">※ {applyDisabledReason}</p>
            )}
          </div>
        )}

        {/* 각도 미세 조정 슬라이더 + 빠른 버튼 */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
              적용 각도 ({plannedHobInput}°):
            </span>
            <input
              type="range"
              min={0}
              max={90}
              step={1}
              value={plannedHobInput}
              aria-label="등받이 각도 조절"
              onChange={(e) => setPlannedHobInput(Number(e.target.value))}
              className="flex-1 accent-blue-600 cursor-pointer"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {QUICK_ANGLES.map((deg) => (
              <button
                key={deg}
                type="button"
                onClick={() => setPlannedHobInput(deg)}
                className={`px-2 py-1 text-xs font-mono tabular-nums rounded border cursor-pointer ${
                  plannedHobInput === deg
                    ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ⑤ 현재 상태 요약 & 통합 타이머 카드 (B5: 중복 체위변경 버튼 제거 · 설명과 상태 확인 유지) */}
      <section
        aria-label="현재 상태 요약"
        className={`rounded-lg border p-5 space-y-3 ${
          repMetrics.overdue > 0 || repMetrics.holdCount >= 3
            ? 'bg-red-50/50 border-red-300'
            : repMetrics.isImminent || repMetrics.maintained >= repMetrics.interval
              ? 'bg-amber-50/60 border-amber-300'
              : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <div>
              <span className="text-xs text-slate-500 mr-1.5">현재 각도</span>
              <strong className="font-mono tabular-nums text-slate-900">
                {inputs.currentHob}°
              </strong>
              {inputs.currentHob >= 30 && inputs.currentHob <= 45 && (
                <span className="text-xs text-slate-500 ml-1">반좌위(상체 세움)</span>
              )}
            </div>
            <div>
              <span className="text-xs text-slate-500 mr-1.5">자세</span>
              <strong className="text-slate-900">{formatTiltKo(inputs.lateralTilt)}</strong>
              <span className="text-xs text-slate-500 ml-1.5">
                · {formatRepositionAgoLabel(repMetrics.maintained, inputs.lateralTilt)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 mr-1.5">체위변경(몸 돌리기)</span>
              <strong
                className={`font-mono tabular-nums ${
                  repMetrics.overdue > 0
                    ? 'text-red-700'
                    : repMetrics.isImminent || repMetrics.maintained >= repMetrics.interval
                      ? 'text-amber-800'
                      : 'text-blue-700'
                }`}
              >
                {repMetrics.overdue > 0
                  ? `지연 ${repMetrics.overdue}분`
                  : repMetrics.snoozeLeft > 0
                    ? `보류 재알림 ${repMetrics.snoozeLeft}분`
                    : repMetrics.remaining === 0
                      ? '변경 필요 (도달)'
                      : `다음 체위변경까지 ${repMetrics.remaining}분`}
              </strong>
              <span className="text-xs text-slate-500 ml-1.5">
                (다음 권장: {formatTiltKo(repMetrics.nextCycleTilt)})
              </span>
            </div>
          </div>

          <span className="text-[11px] font-medium text-slate-500">
            자세·각도 빠른 변경은 화면 아래 조작 바에서 바로 적용할 수 있습니다
          </span>
        </div>

        {/* 가는 진행 막대 + 한 줄 상태 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-mono tabular-nums">
            <span
              className={repMetrics.overdue > 0 ? 'text-red-700 font-semibold' : 'text-slate-600'}
            >
              {repMetrics.overdue > 0
                ? `${repMetrics.maintained}분 / ${repMetrics.interval}분 · ${repMetrics.overdue}분 지연`
                : `다음 체위변경까지 ${repMetrics.remaining}분 (${repMetrics.maintained}/${repMetrics.interval}분)`}
            </span>
            {repMetrics.holdCount >= 3 && (
              <span className="text-red-700 font-semibold">
                반복 보류 {repMetrics.holdCount}회 — 확인 필요
              </span>
            )}
          </div>
          <div
            className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden flex"
            role="progressbar"
            aria-valuenow={repMetrics.maintained}
            aria-valuemin={0}
            aria-valuemax={totalProgressScale}
          >
            <div
              className={`h-full transition-all duration-300 ${
                repMetrics.overdue > 0
                  ? 'bg-amber-500 border-r border-white'
                  : repMetrics.maintained >= repMetrics.interval
                    ? 'bg-amber-500'
                    : 'bg-blue-600'
              }`}
              style={{ width: `${normalProgressPct}%` }}
            />
            {overdueProgressPct > 0 && (
              <div
                className="h-full bg-red-600 transition-all duration-300"
                style={{ width: `${overdueProgressPct}%` }}
              />
            )}
          </div>
        </div>
      </section>

      {/* 그래프 · 그림 보기 (접이식 영역) */}
      <section className="bg-white border border-slate-200 rounded-lg">
        <button
          type="button"
          onClick={() => setShowVisuals((v) => !v)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors rounded-lg cursor-pointer"
        >
          <div>
            <span className="text-sm font-bold text-slate-900">그래프 · 그림 보기</span>
            <span className="ml-2 text-xs text-slate-500">
              침대 각도·돌아눕기 그림과 호흡·맥박·산소 변화 그래프
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 shrink-0">
            <span>{showVisuals ? '접기' : '펼쳐보기'}</span>
            {showVisuals ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {showVisuals && (
          <div className="px-5 pb-5 pt-3 border-t border-slate-200 space-y-5">
            <BedAngleVisualizer
              currentHobAngle={inputs.currentHob}
              hobAngle={plannedHobInput}
              kneeGatchDeg={displayKnee}
              reverseTrendelenburgDeg={displayRevTilt}
              legRaiseDeg={displayLegRaise}
              tripodSupport={displayTripod}
              lateralTilt={inputs.lateralTilt}
              severity={displaySeverity}
            />
            <VitalTrendChart
              history={activePatient.history}
              previewPoint={
                virtualMode && plannedHobInput !== inputs.currentHob
                  ? (() => {
                      const p = simulateVitalsAtAngle(inputs, plannedHobInput);
                      const previewElapsed = getNextUniqueElapsedFor(activePatient, 5);
                      return {
                        timeLabel: formatClockFromElapsed(previewElapsed),
                        rr: p.rr,
                        hr: p.hr,
                        hob: plannedHobInput,
                        spo2: p.spo2,
                        eventType: 'preview',
                        eventLabel: `${plannedHobInput}° 예상`,
                      };
                    })()
                  : null
              }
            />
          </div>
        )}
      </section>

      {/* 자세히 보기 · 더보기 (판정 기준, 근거, 순서·안전수칙, 욕창 예방, 간격 설정, 시연 모드) */}
      <section className="bg-white border border-slate-200 rounded-lg">
        <button
          type="button"
          onClick={() => setShowMoreDetails((v) => !v)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors rounded-lg cursor-pointer"
        >
          <div>
            <span className="text-sm font-bold text-slate-900">자세히 보기 · 더보기</span>
            <span className="ml-2 text-xs text-slate-500">
              판정 기준, 추천 근거, 안전 수칙, 체위변경 간격, 시간·위험 시연 모드
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 shrink-0">
            <span>{showMoreDetails ? '접기' : '더보기'}</span>
            {showMoreDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </span>
        </button>

        {showMoreDetails && (
          <div className="px-5 pb-5 pt-4 border-t border-slate-200 space-y-5 text-xs">
            {/* 시연 모드 및 시간 시뮬레이션 */}
            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold text-slate-900">
                  시연 모드 및 시간 경과 테스트 (누적 {formatElapsed(elapsedMinutes)} ·{' '}
                  {formatClockFromElapsed(elapsedMinutes)})
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onTriggerCriticalDemo}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-300 rounded cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>위험 상황 시연 (맥박 138)</span>
                  </button>
                  <button
                    type="button"
                    onClick={onToggleVirtualMode}
                    className={`px-2.5 py-1.5 font-semibold rounded border cursor-pointer ${
                      virtualMode
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    가상 모드: {virtualMode ? '켜짐' : '꺼짐'}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={!timeFlowPlaying && isTimeBlockedByCritical}
                    onClick={onToggleTimeFlow}
                    className={`px-3 py-1.5 font-semibold rounded inline-flex items-center gap-1 cursor-pointer ${
                      timeFlowPlaying
                        ? 'bg-slate-900 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-300 disabled:cursor-not-allowed'
                    }`}
                  >
                    {timeFlowPlaying ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    <span>{timeFlowPlaying ? '⏸ 멈춤' : '▷ 시간 흐르기'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isTimeBlockedByCritical}
                    onClick={() => onAdvanceTime(15)}
                    className="px-2.5 py-1.5 font-mono bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded inline-flex items-center gap-1 cursor-pointer"
                  >
                    <FastForward className="w-3 h-3 text-slate-500" />
                    <span>+15분</span>
                  </button>
                  <button
                    type="button"
                    disabled={isTimeBlockedByCritical}
                    onClick={() => onAdvanceTime(30)}
                    className="px-2.5 py-1.5 font-mono bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded cursor-pointer"
                  >
                    +30분
                  </button>
                  <button
                    type="button"
                    disabled={isTimeBlockedByCritical}
                    onClick={() => onAdvanceTime(60)}
                    className="px-2.5 py-1.5 font-mono bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded cursor-pointer"
                  >
                    +1시간
                  </button>
                </div>

                <span className="text-[11px] text-slate-600">
                  {virtualMode
                    ? '가상 모드 켜짐: 처치·각도에 따라 수치가 서서히 변함'
                    : '가상 모드 꺼짐: 시간만 흐르고 수치는 고정'}
                </span>
              </div>

              {timeEvents.length > 0 && (
                <ul className="space-y-1 pt-2 border-t border-slate-200">
                  {timeEvents.slice(0, 4).map((ev) => (
                    <li key={ev.id} className="text-slate-700 font-mono">
                      {ev.elapsedLabel} · {ev.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 체위변경 간격 설정 */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <span className="font-semibold text-slate-800">
                체위변경 간격 설정 (일반 120분 · 욕창위험 90분 · 붉게 눌림 60분 — 프로토콜 가정값):
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[60, 90, 120].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onUpdateCustomRepositionInterval(preset)}
                    className={`px-2 py-1 font-mono rounded border cursor-pointer ${
                      repMetrics.interval === preset
                        ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {preset}분
                  </button>
                ))}
                <input
                  type="number"
                  min={15}
                  max={240}
                  step={5}
                  value={repMetrics.interval}
                  aria-label="체위변경 간격(분)"
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!Number.isNaN(v) && v > 0) onUpdateCustomRepositionInterval(v);
                  }}
                  className="w-14 px-2 py-1 font-mono tabular-nums border border-slate-200 rounded"
                />
                {isCustomRepositionInterval && (
                  <button
                    type="button"
                    onClick={() => onUpdateCustomRepositionInterval(null)}
                    className="text-blue-700 hover:underline cursor-pointer"
                  >
                    기본값({defaultRepositionInterval}분)
                  </button>
                )}
              </div>
            </div>

            {/* 판정 기준 배너 (교육용 가정값) */}
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 space-y-1">
              <div className="font-bold text-slate-900">판정 기준 (교육용 가정값)</div>
              <div className="font-mono text-[11px] text-slate-700 flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  <strong className="text-amber-700">▲ 주의:</strong> 호흡 &gt;20·&lt;12, 맥박
                  &gt;100·&lt;60, 산소 &lt;94%(COPD &lt;88%), 수축기 &lt;90, 평균동맥압(MAP) &lt;65,
                  숨참 ≥8점
                </span>
                <span>
                  <strong className="text-red-700">✖ 위험:</strong> 호흡 ≥30·≤8, 맥박 ≥130·≤45, 산소
                  ≤90%(COPD ≤85%), 수축기 &lt;85, 평균동맥압(MAP) &lt;60
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                본 판정 기준과 유지 시간 제한은 교육용 가정값이며 실제 기준은 병원 프로토콜을
                따릅니다.
              </div>
            </div>

            {/* 추천 이유·근거 + 조절 순서·안전 수칙 + 욕창 예방 안내 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="font-bold text-slate-900">추천 이유 · 판정 근거</div>
                <p className="text-slate-700 leading-relaxed">
                  {recommendedForPatient.actionSummary}
                </p>
                <ul className="space-y-1 text-slate-600">
                  {recommendedForPatient.physiologicalRationale.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
                <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-amber-900">
                  <strong>욕창 예방 안내:</strong> {recommendedForPatient.pressureCareAdvice}
                  {inputs.currentHob > HIGH_ANGLE_HOB_THRESHOLD && (
                    <div className="mt-1 font-mono">
                      45° 초과({inputs.currentHob}°) 유지: {minutesAbove45}분 / 60분 기준(가정값)
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900">각도 조절 순서 · 안전 수칙</div>
                <ol className="space-y-1 text-slate-700">
                  {recommendedForPatient.stepPlan.map((step, i) => (
                    <li key={i}>
                      <span className="font-mono text-blue-600 font-semibold mr-1.5">
                        0{i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                {recommendedForPatient.safetyWarnings.length > 0 && (
                  <ul className="space-y-1 text-red-800 bg-red-50 border border-red-200 rounded p-2.5">
                    {recommendedForPatient.safetyWarnings.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 필수 안전 규칙 및 가상 데이터·면책 안내 */}
      <div className="text-[11px] text-slate-500 text-center py-1">
        가상 시뮬레이션 데이터 · 위험 시 의료진 알림 우선 · 모든 각도/자세 변경은 간호사 확인 후
        적용 · 교육용 가정값이며 실제 기준은 병원 프로토콜을 따릅니다.
      </div>
    </div>
  );
};
