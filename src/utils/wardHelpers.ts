import {
  checkAngleAppropriateness,
  CriticalAlertState,
  evaluatePatientVitalStatus,
  formatTiltKo,
  getCriticalRiskCategories,
  getDefaultRepositionInterval,
  getNextCycleTilt,
  HIGH_ANGLE_HOB_THRESHOLD,
  HIGH_ANGLE_LIMIT_MINUTES,
  LateralTiltPosition,
  normalizeCriticalAlertState,
  WardPatient,
} from '../data/protocolData';

export const BASE_CLOCK_MINUTES = 18 * 60 + 20;

export type HoldChipReason = '환자 수면' | '처치 중' | '의료진 지시' | '기타';
export const HOLD_CHIPS: HoldChipReason[] = ['환자 수면', '처치 중', '의료진 지시', '기타'];

export interface TimeEventLog {
  id: string;
  proposalKey?: string;
  elapsedLabel: string;
  type: 'proposal' | 'confirmed' | 'critical' | 'pressure';
  message: string;
}

export interface ToastState {
  id: number;
  message: string;
  undoLabel?: string;
  onUndo?: () => void;
}

export interface QueuedNormalAlert {
  id: string;
  patient: WardPatient;
  category: 'respiratory' | 'reposition';
  tierScore: number;
  title: string;
  summary: string;
  actionLabel?: string;
  canHoldReposition?: boolean;
  isCriticalRepositionOverride?: boolean;
  isCriticalDelayedNotice?: boolean;
  targetAngle?: number;
  targetRevTilt?: number;
  targetKnee?: number;
  targetTilt?: LateralTiltPosition;
  angleKey?: string;
}

export interface CriticalPatientAlertItem {
  patient: WardPatient;
  effectiveCrit: CriticalAlertState;
  stage: CriticalAlertState['stage'];
  vitalReasons: string[];
  shortReason: string;
  recommendedHob: number;
  recommendedRevTilt: number;
  isDoctorNotified: boolean;
  isSafetyConfirmed: boolean;
}

export const formatTiltActionKo = (tilt: LateralTiltPosition) =>
  tilt === 'center'
    ? '정면으로 돌리기'
    : tilt === 'left_30'
      ? '왼쪽 30° 돌리기'
      : '오른쪽 30° 돌리기';

export const formatElapsed = (mins: number) => {
  const safe = Math.max(0, Math.round(mins));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, '0')}시간 ${String(m).padStart(2, '0')}분`;
};

export const makeTimestamp = () =>
  new Date().toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

export const formatClockFromElapsed = (mins: number) => {
  const total = (BASE_CLOCK_MINUTES + Math.max(0, Math.round(mins))) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const formatClockKorFromElapsed = (mins: number) => {
  const total = (BASE_CLOCK_MINUTES + Math.max(0, Math.round(mins))) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}시 ${String(m).padStart(2, '0')}분`;
};

export const getNextUniqueElapsedFor = (pt: WardPatient, minDelta: number) => {
  const ptElapsed = Math.max(0, pt.elapsedMinutes ?? 0);
  let candidate = ptElapsed + Math.max(1, minDelta);
  const lastLabel = pt.history[pt.history.length - 1]?.timeLabel;
  if (lastLabel && formatClockFromElapsed(candidate) === lastLabel) {
    candidate += 1;
  }
  return candidate;
};

export function getEffectiveCriticalAlertFor(pt: WardPatient): CriticalAlertState {
  const stored = normalizeCriticalAlertState(pt.criticalAlert);
  const vs = evaluatePatientVitalStatus(pt.inputs);
  const elapsed = Math.max(0, pt.elapsedMinutes ?? 0);
  if (vs.level === 'critical' && stored.stage === 'idle') {
    return {
      ...stored,
      stage: 'alert_required',
      episodeId: stored.episodeId ?? `crit-${pt.id}-${elapsed}`,
      episodeRiskCategories: getCriticalRiskCategories(pt.inputs),
    };
  }
  return stored;
}

export function isCriticalPriorityActiveFor(pt: WardPatient): boolean {
  const eff = getEffectiveCriticalAlertFor(pt);
  const vs = evaluatePatientVitalStatus(pt.inputs);
  return (
    eff.stage !== 'resolved' &&
    (eff.stage === 'alert_required' ||
      eff.stage === 'awaiting_order' ||
      eff.stage === 'observing' ||
      eff.stage === 'continuous_observation' ||
      vs.level === 'critical')
  );
}

export function isDoctorNotifiedFor(pt: WardPatient): boolean {
  const eff = getEffectiveCriticalAlertFor(pt);
  return (
    eff.stage === 'awaiting_order' ||
    eff.stage === 'observing' ||
    eff.stage === 'continuous_observation' ||
    eff.stage === 'resolved'
  );
}

export function buildShortCriticalReason(pt: WardPatient): string {
  const { rr, hr, spo2, sbp, dbp, copdTargetMode } = pt.inputs;
  const map = Math.round((sbp + 2 * dbp) / 3);
  const spo2Floor = copdTargetMode ? 85 : 90;
  const parts: string[] = [];
  if (hr >= 130 || hr <= 45) parts.push(`맥박 ${hr}`);
  if (rr >= 30 || rr <= 8) parts.push(`호흡 ${rr}`);
  if (spo2 <= spo2Floor) parts.push(`산소 ${spo2}%`);
  if (sbp < 85 || map < 60) parts.push(`혈압 ${sbp}/${dbp}(MAP ${map})`);
  if (parts.length > 0) return parts.join(' · ');
  const eff = getEffectiveCriticalAlertFor(pt);
  return eff.doctorOrderNote || evaluatePatientVitalStatus(pt.inputs).reasons[0] || '위험 수치 감지';
}

export function getPatientRepositionMetrics(pt: WardPatient) {
  const elapsed = Math.max(0, pt.elapsedMinutes ?? 0);
  const start = Math.max(0, Math.min(pt.repositionStartedAtElapsed ?? 0, elapsed));
  const maintained = Math.max(0, elapsed - start);
  const interval = pt.customRepositionIntervalMin ?? getDefaultRepositionInterval(pt.inputs);
  const remaining = Math.max(0, interval - maintained);
  const overdue = Math.max(0, maintained - interval);
  const severeThreshold = Math.round(interval * 1.5);
  const isSevereOverride = maintained >= severeThreshold;
  const snoozeLeft = pt.repositionSnoozeMinutesLeft ?? 0;
  const holdCount = pt.repositionHoldCount ?? 0;
  const nextCycleTilt = getNextCycleTilt(pt.inputs.lateralTilt, pt.lastSideTilt ?? 'right_30');
  const isImminent = overdue === 0 && remaining <= 10;

  return {
    elapsed,
    start,
    maintained,
    interval,
    remaining,
    overdue,
    severeThreshold,
    isSevereOverride,
    snoozeLeft,
    holdCount,
    nextCycleTilt,
    isImminent,
  };
}

export function buildCriticalPatientAlerts(
  patients: WardPatient[],
  activePatientId: string
): CriticalPatientAlertItem[] {
  const items: CriticalPatientAlertItem[] = [];
  for (const pt of patients) {
    if (!isCriticalPriorityActiveFor(pt)) continue;
    const eff = getEffectiveCriticalAlertFor(pt);
    const vs = evaluatePatientVitalStatus(pt.inputs);
    const audit = checkAngleAppropriateness(pt.inputs.currentHob, pt.inputs);
    items.push({
      patient: pt,
      effectiveCrit: eff,
      stage: eff.stage === 'idle' ? 'alert_required' : eff.stage,
      vitalReasons: vs.reasons,
      shortReason: buildShortCriticalReason(pt),
      recommendedHob: audit.targetHob,
      recommendedRevTilt: audit.targetRevTilt,
      isDoctorNotified: isDoctorNotifiedFor(pt),
      isSafetyConfirmed: Boolean(eff.safetyChangeConfirmed),
    });
  }

  return items.sort((a, b) => {
    const rank = (s: CriticalAlertState['stage']) =>
      s === 'alert_required' ? 0 : s === 'awaiting_order' ? 1 : 2;
    const ra = rank(a.stage);
    const rb = rank(b.stage);
    if (ra !== rb) return ra - rb;
    if (a.patient.id === activePatientId && b.patient.id !== activePatientId) return -1;
    if (b.patient.id === activePatientId && a.patient.id !== activePatientId) return 1;
    return 0;
  });
}

export function buildNormalAlerts(
  patients: WardPatient[],
  activePatientId: string,
  acknowledgedAngleKeys: Record<string, string>
): QueuedNormalAlert[] {
  const list: QueuedNormalAlert[] = [];

  for (const pt of patients) {
    const isCritActive = isCriticalPriorityActiveFor(pt);
    const vs = evaluatePatientVitalStatus(pt.inputs);
    const ptMetrics = getPatientRepositionMetrics(pt);
    const ptAudit = checkAngleAppropriateness(pt.inputs.currentHob, pt.inputs);
    const ptHighAngleDue =
      !isCritActive &&
      pt.inputs.currentHob > HIGH_ANGLE_HOB_THRESHOLD &&
      (pt.minutesAbove45 ?? 0) >= HIGH_ANGLE_LIMIT_MINUTES;

    const activeTie = pt.id === activePatientId ? 0 : 1;

    if (!isCritActive && (ptAudit.isWrongAngle || ptHighAngleDue)) {
      const targetAngle =
        ptHighAngleDue && !ptAudit.isWrongAngle && pt.inputs.rr <= 21 ? 35 : ptAudit.targetHob;
      const hasAngleDiff =
        (ptAudit.targetRevTilt > 0 && pt.inputs.currentHob !== 0) ||
        (ptAudit.targetRevTilt === 0 && targetAngle !== pt.inputs.currentHob);
      const angleKey = `${pt.inputs.currentHob}|${vs.level}|${
        ptAudit.targetRevTilt > 0 ? `+${ptAudit.targetRevTilt}` : targetAngle
      }`;
      if (hasAngleDiff && acknowledgedAngleKeys[pt.id] !== angleKey) {
        list.push({
          id: `resp-${pt.id}`,
          patient: pt,
          category: 'respiratory',
          tierScore: 30 + activeTie,
          title: `${pt.bedNumber} ${pt.patientName} · 호흡·각도 조정 필요`,
          summary: ptAudit.decision.ruleConflicts[0] || ptAudit.decision.shortReason,
          actionLabel:
            ptAudit.targetRevTilt > 0
              ? `침대 전체 +${ptAudit.targetRevTilt}° 적용`
              : `${targetAngle}° 적용`,
          targetAngle,
          targetRevTilt: ptAudit.targetRevTilt,
          targetKnee: ptAudit.targetKneeGatch,
          angleKey,
        });
      }
    }

    if (ptMetrics.maintained >= ptMetrics.interval) {
      if (
        !isCritActive &&
        ptMetrics.snoozeLeft === 0 &&
        ptMetrics.nextCycleTilt !== pt.inputs.lateralTilt
      ) {
        list.push({
          id: `rep-${pt.id}`,
          patient: pt,
          category: 'reposition',
          tierScore: (ptMetrics.overdue > 0 ? 50 : 60) + activeTie,
          title: `${pt.bedNumber} ${pt.patientName} · ${
            ptMetrics.overdue > 0
              ? `체위변경 지연 ${ptMetrics.overdue}분`
              : '체위변경(몸 돌리기) 필요'
          }`,
          summary: `${formatTiltKo(pt.inputs.lateralTilt)} ${ptMetrics.maintained}분 유지 (기준 ${ptMetrics.interval}분)`,
          actionLabel: `${formatTiltActionKo(ptMetrics.nextCycleTilt)} 적용`,
          canHoldReposition: true,
          targetTilt: ptMetrics.nextCycleTilt,
        });
      } else if (
        isCritActive &&
        ptMetrics.isSevereOverride &&
        ptMetrics.snoozeLeft === 0 &&
        ptMetrics.nextCycleTilt !== pt.inputs.lateralTilt
      ) {
        list.push({
          id: `rep-severe-${pt.id}`,
          patient: pt,
          category: 'reposition',
          tierScore: 45 + activeTie,
          title: `${pt.bedNumber} ${pt.patientName} · 1.5배 초과 체위변경 필요 (${ptMetrics.overdue}분 지연)`,
          summary: `기준 ${ptMetrics.interval}분 초과 · 의료진 확인 후 ${formatTiltKo(ptMetrics.nextCycleTilt)} 적용`,
          actionLabel: `${formatTiltActionKo(ptMetrics.nextCycleTilt)} 적용`,
          canHoldReposition: true,
          isCriticalRepositionOverride: true,
          targetTilt: ptMetrics.nextCycleTilt,
        });
      } else if (isCritActive) {
        list.push({
          id: `rep-delay-notice-${pt.id}`,
          patient: pt,
          category: 'reposition',
          tierScore: 80 + activeTie,
          title: `${pt.bedNumber} ${pt.patientName} · 체위변경 지연 ${ptMetrics.overdue}분(의료진 확인 후 처리)`,
          summary: `${formatTiltKo(pt.inputs.lateralTilt)} ${ptMetrics.maintained}분 유지 중`,
          isCriticalDelayedNotice: true,
        });
      }
    }
  }

  return list.sort((a, b) => a.tierScore - b.tierScore);
}

export function playCriticalWarningBeep(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playTone = (freq: number, startOffset: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(0.001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.08, now + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.02);
    };

    playTone(880, 0, 0.14);
    playTone(660, 0.16, 0.16);

    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 500);
  } catch {
    // Ignore browser audio policy errors cleanly
  }
}
