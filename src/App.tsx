import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { AngleMatrixTable } from './components/AngleMatrixTable';
import { EmrRecordsView } from './components/EmrRecordsView';
import { GlobalCriticalAlertZone } from './components/GlobalCriticalAlertZone';
import { NewBedModal } from './components/NewBedModal';
import { PracticeToolsDrawer } from './components/PracticeToolsDrawer';
import { PrdViewer } from './components/PrdViewer';
import { QuickRepositionBar } from './components/QuickRepositionBar';
import { WardBedWorkspace } from './components/WardBedWorkspace';
import {
  areVitalsRelaxedSafe,
  checkAngleAppropriateness,
  CriticalAlertState,
  CriticalEpisodeTimelineEntry,
  CriticalRiskCategory,
  DEFAULT_CRITICAL_ALERT_STATE,
  EmrNursingRecord,
  evaluatePatientVitalStatus,
  formatCriticalCategoryKo,
  formatRepositionAgoLabel,
  formatTiltKo,
  getCriticalRiskCategories,
  getDefaultRepositionInterval,
  getNextCycleTilt,
  HIGH_ANGLE_HOB_THRESHOLD,
  HIGH_ANGLE_LIMIT_MINUTES,
  INITIAL_WARD_PATIENTS,
  LateralTiltPosition,
  normalizeCriticalAlertState,
  PatientInputs,
  PracticeScenarioPreset,
  simulateVitalsAtAngle,
  WardPatient,
} from './data/protocolData';
import {
  buildCriticalPatientAlerts,
  buildNormalAlerts,
  formatClockFromElapsed,
  formatClockKorFromElapsed,
  formatElapsed,
  getEffectiveCriticalAlertFor,
  getNextUniqueElapsedFor,
  HoldChipReason,
  isCriticalPriorityActiveFor,
  isDoctorNotifiedFor,
  makeTimestamp,
  playCriticalWarningBeep,
  TimeEventLog,
  ToastState,
} from './utils/wardHelpers';

type WorkspaceTab = 'workspace' | 'matrix' | 'records' | 'prd';

const STORAGE_PATIENTS_KEY = 'sbpp_ward_patients_v3';
const STORAGE_RECORDS_KEY = 'sbpp_emr_records_v2';

export function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('workspace');
  const [isNewBedOpen, setIsNewBedOpen] = useState(false);

  const [patients, setPatients] = useState<WardPatient[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PATIENTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(
            (p): p is WardPatient =>
              Boolean(p) &&
              typeof p === 'object' &&
              typeof p.id === 'string' &&
              Boolean(p.inputs) &&
              typeof p.inputs === 'object'
          );
          if (valid.length > 0) {
            const defaultInputs = INITIAL_WARD_PATIENTS[0].inputs;
            return valid.map((p) => {
              const safeInputs: PatientInputs = {
                ...defaultInputs,
                ...p.inputs,
              };
              const tilt = safeInputs.lateralTilt ?? 'center';
              const lastSide =
                p.lastSideTilt ?? (tilt === 'left_30' ? 'left_30' : 'right_30');
              const elapsed =
                typeof p.elapsedMinutes === 'number' && p.elapsedMinutes >= 0
                  ? p.elapsedMinutes
                  : 0;
              const rawStart =
                typeof p.repositionStartedAtElapsed === 'number'
                  ? p.repositionStartedAtElapsed
                  : 0;
              const safeStart = Math.max(0, Math.min(rawStart, elapsed));
              const safeMaintained = Math.max(0, elapsed - safeStart);
              return {
                ...p,
                inputs: safeInputs,
                history: Array.isArray(p.history) ? p.history : [],
                elapsedMinutes: elapsed,
                repositionStartedAtElapsed: safeStart,
                minutesSinceReposition: safeMaintained,
                customRepositionIntervalMin: p.customRepositionIntervalMin ?? null,
                lastSideTilt: lastSide,
                repositionProposedForCycle: Boolean(p.repositionProposedForCycle),
                repositionHoldCount: p.repositionHoldCount ?? 0,
                repositionSnoozeMinutesLeft: p.repositionSnoozeMinutesLeft ?? 0,
                minutesAbove45: typeof p.minutesAbove45 === 'number' ? p.minutesAbove45 : 0,
                highAngleProposedForCycle: Boolean(p.highAngleProposedForCycle),
                criticalAlert: normalizeCriticalAlertState(p.criticalAlert),
              };
            });
          }
        }
      }
    } catch {
      // Fallback to defaults
    }
    return INITIAL_WARD_PATIENTS;
  });

  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    () => patients[0]?.id || INITIAL_WARD_PATIENTS[0].id
  );

  const [emrRecords, setEmrRecords] = useState<EmrNursingRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_RECORDS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (r): r is EmrNursingRecord =>
              Boolean(r) &&
              typeof r === 'object' &&
              typeof r.id === 'string' &&
              Boolean(r.preVitals) &&
              typeof r.preVitals === 'object' &&
              typeof r.verdict === 'string'
          );
        }
      }
    } catch {
      // Fallback to empty
    }
    return [];
  });

  // 공통 시뮬레이션 · 대응 · 알림 · 토스트 상태
  const [virtualMode, setVirtualMode] = useState<boolean>(true);
  const [timeFlowPlaying, setTimeFlowPlaying] = useState<boolean>(false);
  const [timeSpeed, setTimeSpeed] = useState<1 | 10 | 60>(10);
  const [stoppedByAlertNotice, setStoppedByAlertNotice] = useState<boolean>(false);
  const [lastSimRecoveryBadge, setLastSimRecoveryBadge] = useState<string | null>(null);
  const [timeEvents, setTimeEvents] = useState<TimeEventLog[]>([]);
  const [acknowledgedAngleKeys, setAcknowledgedAngleKeys] = useState<Record<string, string>>({});

  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState<boolean>(false);

  // 선택 환자 지시·재측정 입력 상태
  const activePatient =
    patients.find((p) => p.id === selectedPatientId) || patients[0] || INITIAL_WARD_PATIENTS[0];

  const [orderNoteInput, setOrderNoteInput] = useState<string>(
    '산소 유량 확인 및 처치 시행, 15분 간격 경과 관찰'
  );
  const [orderHobInput, setOrderHobInput] = useState<number | null>(null);
  const [recheckInputs, setRecheckInputs] = useState<{ rr: number; hr: number; spo2: number }>({
    rr: activePatient.inputs.rr,
    hr: activePatient.inputs.hr,
    spo2: activePatient.inputs.spo2,
  });
  const [recheckPanelOpen, setRecheckPanelOpen] = useState<boolean>(false);

  // 상단 알림 영역 / 하단 조작 바 높이 측정 (겹침 방지)
  const [topAlertHeight, setTopAlertHeight] = useState<number>(64);
  const [bottomBarHeight, setBottomBarHeight] = useState<number>(76);

  // 토스트 & 되돌리기(Undo)
  const [toastState, setToastState] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (message: string, undoOpts?: { label?: string; onUndo: () => void }) => {
    const id = Date.now();
    setToastState({
      id,
      message,
      undoLabel: undoOpts ? undoOpts.label ?? '되돌리기' : undefined,
      onUndo: undoOpts?.onUndo,
    });
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastState(null);
      toastTimerRef.current = null;
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PATIENTS_KEY, JSON.stringify(patients));
    } catch {
      // Storage quota ignored
    }
  }, [patients]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(emrRecords));
    } catch {
      // Storage quota ignored
    }
  }, [emrRecords]);

  // 선택 환자가 바뀔 때 재측정 입력값 및 시연 상태 동기화
  useEffect(() => {
    setOrderHobInput(null);
    setLastSimRecoveryBadge(null);
    setTimeFlowPlaying(false);
    setStoppedByAlertNotice(false);
    setRecheckInputs({
      rr: activePatient.inputs.rr,
      hr: activePatient.inputs.hr,
      spo2: activePatient.inputs.spo2,
    });
  }, [activePatient.id]);

  // 전역 상단 알림 데이터 (위험 알림 전체 vs 일반 알림 접기)
  const criticalAlerts = useMemo(
    () => buildCriticalPatientAlerts(patients, activePatient.id),
    [patients, activePatient.id]
  );

  const normalAlerts = useMemo(
    () => buildNormalAlerts(patients, activePatient.id, acknowledgedAngleKeys),
    [patients, activePatient.id, acknowledgedAngleKeys]
  );

  // A(2) 소리 토글이 켜져 있을 때 새 미처리 위험 알림 발생 시 짧은 경고음
  const prevUnhandledCritIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const currentUnhandled = new Set(
      criticalAlerts.filter((a) => a.stage === 'alert_required').map((a) => a.patient.id)
    );
    let hasBrandNew = false;
    for (const id of currentUnhandled) {
      if (!prevUnhandledCritIdsRef.current.has(id)) {
        hasBrandNew = true;
        break;
      }
    }
    prevUnhandledCritIdsRef.current = currentUnhandled;
    if (soundEnabled && hasBrandNew) {
      playCriticalWarningBeep();
    }
  }, [criticalAlerts, soundEnabled]);

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (next && criticalAlerts.some((a) => a.stage === 'alert_required')) {
        playCriticalWarningBeep();
      }
      return next;
    });
  };

  const handleUpdatePatient = (updated: WardPatient) => {
    setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleCreatePatient = (newPatient: WardPatient) => {
    setPatients((prev) => [...prev, newPatient]);
    setSelectedPatientId(newPatient.id);
    setActiveTab('workspace');
  };

  const handleAddEmrRecord = (record: EmrNursingRecord) => {
    const withMs: EmrNursingRecord = {
      ...record,
      createdAtMs: record.createdAtMs ?? Date.now(),
    };
    setEmrRecords((prev) => {
      const idx = prev.findIndex((r) => r.id === withMs.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = withMs;
        return next;
      }
      return [withMs, ...prev];
    });
  };

  // C(9) 상단 알림 · 하단 바 · 작업 공간 · 체험 패널 간 공유 의료진 확인 체크
  const handleToggleSafetyConfirmed = (targetPatient: WardPatient, confirmed: boolean) => {
    const eff = getEffectiveCriticalAlertFor(targetPatient);
    handleUpdatePatient({
      ...targetPatient,
      criticalAlert: {
        ...eff,
        safetyChangeConfirmed: confirmed,
      },
    });
  };

  const upsertCriticalEpisodeEmrFor = (
    pt: WardPatient,
    epState: CriticalAlertState,
    opts: {
      preInputs: PatientInputs;
      latestInputs: PatientInputs;
      prevHob: number;
      appliedHob: number;
      statusLabel: string;
      verdict: string;
      isPractice?: boolean;
    }
  ) => {
    const ptElapsed = Math.max(0, pt.elapsedMinutes ?? 0);
    const epId = epState.episodeId ?? `crit-${pt.id}-${Date.now()}`;
    const firstAlertEntry = epState.timeline[0];
    handleAddEmrRecord({
      id: epId,
      timestamp: makeTimestamp(),
      createdAtMs: Date.now(),
      isPractice: opts.isPractice || undefined,
      bedNumber: pt.bedNumber,
      patientName: pt.patientName,
      prevHob: opts.prevHob,
      appliedHob: opts.appliedHob,
      kneeGatch: opts.appliedHob > 30 ? 12 : 0,
      revTilt: 0,
      lateralTilt: opts.latestInputs.lateralTilt,
      preVitals: {
        rr: opts.preInputs.rr,
        hr: opts.preInputs.hr,
        spo2: opts.preInputs.spo2,
        bp: `${opts.preInputs.sbp}/${opts.preInputs.dbp}`,
      },
      postVitals:
        epState.timeline.length > 1
          ? {
              rr: opts.latestInputs.rr,
              hr: opts.latestInputs.hr,
              spo2: opts.latestInputs.spo2,
              bp: `${opts.latestInputs.sbp}/${opts.latestInputs.dbp}`,
            }
          : undefined,
      stabilizationMinutes: 0,
      criticalEpisodeMeta: {
        episodeId: epId,
        startedClock:
          epState.episodeStartedClock ??
          firstAlertEntry?.clockLabel ??
          formatClockKorFromElapsed(ptElapsed),
        statusLabel: opts.statusLabel,
        riskCategories: epState.episodeRiskCategories,
        doctorOrderNote: epState.doctorOrderNote,
        doctorOrderedHob: epState.doctorOrderedHob,
        noImprovementCount: epState.noImprovementCount,
        consecutiveSafeRechecks: epState.consecutiveSafeRechecks,
        seniorEscalationShown: epState.seniorEscalationShown,
        timeline: epState.timeline,
      },
      verdict: opts.verdict,
    });
  };

  const upsertRepositionDelayEmrFor = (
    pt: WardPatient,
    startedAt: number,
    maintainedMinutes: number,
    intervalMinutes: number,
    latestInputs: PatientInputs,
    isCriticalContext: boolean,
    isPractice?: boolean
  ) => {
    const delayMinutes = Math.max(0, maintainedMinutes - intervalMinutes);
    if (delayMinutes <= 0) return;
    const knee =
      latestInputs.currentHob > 30
        ? latestInputs.pressureInjuryHighRisk || latestInputs.sacralSkinStatus !== 'intact'
          ? 15
          : 12
        : 0;
    handleAddEmrRecord({
      id: `reposition-delay-${pt.id}-${startedAt}`,
      timestamp: makeTimestamp(),
      createdAtMs: Date.now(),
      isPractice: isPractice || undefined,
      bedNumber: pt.bedNumber,
      patientName: pt.patientName,
      prevHob: latestInputs.currentHob,
      appliedHob: latestInputs.currentHob,
      kneeGatch: knee,
      revTilt: 0,
      lateralTilt: latestInputs.lateralTilt,
      preVitals: {
        rr: latestInputs.rr,
        hr: latestInputs.hr,
        spo2: latestInputs.spo2,
        bp: `${latestInputs.sbp}/${latestInputs.dbp}`,
      },
      stabilizationMinutes: 0,
      repositionMeta: {
        prevTilt: latestInputs.lateralTilt,
        newTilt: latestInputs.lateralTilt,
        maintainedMinutes,
        isHold: false,
        isDelay: true,
        delayMinutes,
      },
      verdict: `[체위변경 지연 ${delayMinutes}분] ${formatTiltKo(
        latestInputs.lateralTilt
      )} ${maintainedMinutes}분 유지 (기준 ${intervalMinutes}분)${
        isCriticalContext ? ' · 의료진 확인 후 처리 필요' : ''
      }`,
    });
  };

  // 위험 대응 1단계: 의료진에게 알리기
  const handleNotifyDoctorCritical = (targetPatient: WardPatient, isPractice?: boolean) => {
    const targetInputs = targetPatient.inputs;
    const useElapsed = Math.max(0, targetPatient.elapsedMinutes ?? 0);
    const clockKor = formatClockKorFromElapsed(useElapsed);
    const elapsedLabel = `+${formatElapsed(useElapsed)} (${formatClockFromElapsed(useElapsed)})`;
    const curCrit = getEffectiveCriticalAlertFor(targetPatient);
    const epId = curCrit.episodeId ?? `crit-${targetPatient.id}-${Date.now()}`;
    const detectedCats = getCriticalRiskCategories(targetInputs);
    const mergedCats: CriticalRiskCategory[] = Array.from(
      new Set([...curCrit.episodeRiskCategories, ...detectedCats])
    );
    const vitalSummary = evaluatePatientVitalStatus(targetInputs).reasons.join(', ');
    const vitalSnapStr = `호흡 ${targetInputs.rr} · 맥박 ${targetInputs.hr} · 산소 ${targetInputs.spo2}% · 혈압 ${targetInputs.sbp}/${targetInputs.dbp}`;
    const isNewCategoryAlert = Boolean(curCrit.newCategoryAlertNote) && curCrit.timeline.length > 0;

    const alertStep: CriticalEpisodeTimelineEntry = {
      id: `step-alert-${Date.now()}`,
      stepType: 'alert',
      clockLabel: clockKor,
      title: isNewCategoryAlert ? '새 위험 항목 알림 완료' : '의료진 알림 완료',
      detail: isNewCategoryAlert
        ? `${curCrit.newCategoryAlertNote} (${vitalSummary})`
        : `위험 항목(${mergedCats.map(formatCriticalCategoryKo).join(', ') || '위험 수치'}) 보고`,
      vitalsSummary: vitalSnapStr,
    };

    const nextStage =
      isNewCategoryAlert && curCrit.doctorOrderNote ? 'observing' : 'awaiting_order';

    const nextCritState: CriticalAlertState = {
      ...curCrit,
      stage: nextStage,
      episodeId: epId,
      episodeStartedClock: curCrit.episodeStartedClock ?? clockKor,
      alertedAtClock: clockKor,
      episodeRiskCategories: mergedCats,
      notifiedSnapshot: curCrit.notifiedSnapshot ?? {
        rr: targetInputs.rr,
        hr: targetInputs.hr,
        spo2: targetInputs.spo2,
        sbp: targetInputs.sbp,
        dbp: targetInputs.dbp,
      },
      newCategoryAlertNote: undefined,
      timeline: [...curCrit.timeline, alertStep],
    };

    if (targetPatient.id === activePatient.id) {
      setRecheckInputs({
        rr: targetInputs.rr,
        hr: targetInputs.hr,
        spo2: targetInputs.spo2,
      });
      setOrderHobInput(null);
    }

    handleUpdatePatient({
      ...targetPatient,
      criticalAlert: nextCritState,
    });

    const alertLogKey = `${epId}-alert`;
    const alertMsg = `${targetPatient.bedNumber} ${clockKor} 의료진 알림 완료 → ${
      nextStage === 'awaiting_order' ? '지시·처치 입력 대기' : '처치 중 관찰'
    }`;
    setTimeEvents((prev) =>
      [
        {
          id: `t-crit-alert-${Date.now()}`,
          proposalKey: alertLogKey,
          elapsedLabel,
          type: 'critical' as const,
          message: alertMsg,
        },
        ...prev.filter((e) => e.proposalKey !== alertLogKey),
      ].slice(0, 8)
    );

    upsertCriticalEpisodeEmrFor(targetPatient, nextCritState, {
      preInputs: targetInputs,
      latestInputs: targetInputs,
      prevHob: targetInputs.currentHob,
      appliedHob: targetInputs.currentHob,
      statusLabel: nextStage === 'awaiting_order' ? '지시 입력 대기' : '처치 중 관찰',
      verdict: `[1. 의료진 알림 완료 · ${clockKor}] ${vitalSummary}`,
      isPractice,
    });

    showToast(`${targetPatient.bedNumber} ${targetPatient.patientName} · 의료진 알림 완료 및 기록 저장`);
  };

  // 위험 대응 2단계: 의료진 지시·처치 입력
  const handleSubmitDoctorOrder = (
    targetPatient: WardPatient,
    noteRaw: string,
    hobOrder: number | null,
    isPractice?: boolean
  ) => {
    const ptInputs = targetPatient.inputs;
    const curCrit = getEffectiveCriticalAlertFor(targetPatient);
    const note = noteRaw.trim() || '산소 투여, 15분 후 재측정';
    const nextElapsed = getNextUniqueElapsedFor(targetPatient, 1);
    const ptStart = Math.max(
      0,
      Math.min(targetPatient.repositionStartedAtElapsed ?? 0, nextElapsed)
    );
    const nextMaintained = Math.max(0, nextElapsed - ptStart);
    const clockKor = formatClockKorFromElapsed(nextElapsed);
    const elapsedLabel = `+${formatElapsed(nextElapsed)} (${formatClockFromElapsed(nextElapsed)})`;
    const epId = curCrit.episodeId ?? `crit-${targetPatient.id}-${nextElapsed}`;
    const targetHob = hobOrder !== null ? hobOrder : ptInputs.currentHob;
    const hobDesc =
      hobOrder !== null && hobOrder !== ptInputs.currentHob
        ? `각도 ${ptInputs.currentHob}° → ${hobOrder}° 조절`
        : `현재 각도 ${ptInputs.currentHob}° 유지`;

    const orderStep: CriticalEpisodeTimelineEntry = {
      id: `step-order-${Date.now()}`,
      stepType: 'order',
      clockLabel: clockKor,
      title: '의료진 지시·처치 입력',
      detail: `${note} (${hobDesc})`,
      vitalsSummary: `호흡 ${ptInputs.rr} · 맥박 ${ptInputs.hr} · 산소 ${ptInputs.spo2}%`,
    };

    const nextInputs: PatientInputs = { ...ptInputs, currentHob: targetHob };
    const nextCritState: CriticalAlertState = {
      ...curCrit,
      stage: 'observing',
      episodeId: epId,
      orderEnteredAtClock: clockKor,
      doctorOrderNote: note,
      doctorOrderedHob: hobOrder,
      timeline: [...curCrit.timeline, orderStep],
    };

    if (targetPatient.id === activePatient.id) {
      setRecheckInputs({ rr: ptInputs.rr, hr: ptInputs.hr, spo2: ptInputs.spo2 });
      setRecheckPanelOpen(true);
    }

    handleUpdatePatient({
      ...targetPatient,
      elapsedMinutes: nextElapsed,
      repositionStartedAtElapsed: ptStart,
      minutesSinceReposition: nextMaintained,
      lastRepositionedLabel: formatRepositionAgoLabel(nextMaintained, ptInputs.lateralTilt),
      criticalAlert: nextCritState,
      minutesAbove45: targetHob > HIGH_ANGLE_HOB_THRESHOLD ? targetPatient.minutesAbove45 : 0,
      highAngleProposedForCycle:
        targetHob > HIGH_ANGLE_HOB_THRESHOLD ? targetPatient.highAngleProposedForCycle : false,
      inputs: nextInputs,
      history:
        hobOrder !== null && hobOrder !== ptInputs.currentHob
          ? [
              ...targetPatient.history.slice(-7),
              {
                timeLabel: formatClockFromElapsed(nextElapsed),
                rr: ptInputs.rr,
                hr: ptInputs.hr,
                hob: targetHob,
                spo2: ptInputs.spo2,
                eventType: 'confirmed',
                eventLabel: `지시 ${targetHob}°`,
              },
            ]
          : targetPatient.history,
    });

    setTimeEvents((prev) =>
      [
        {
          id: `t-crit-order-${Date.now()}`,
          proposalKey: `${epId}-order`,
          elapsedLabel,
          type: 'confirmed' as const,
          message: `의료진 지시 입력(${hobDesc}): ${note}`,
        },
        ...prev.filter((e) => e.proposalKey !== `${epId}-order`),
      ].slice(0, 8)
    );

    const snapPre = curCrit.notifiedSnapshot ? { ...ptInputs, ...curCrit.notifiedSnapshot } : ptInputs;
    upsertCriticalEpisodeEmrFor(targetPatient, nextCritState, {
      preInputs: snapPre,
      latestInputs: nextInputs,
      prevHob: ptInputs.currentHob,
      appliedHob: targetHob,
      statusLabel: '처치 중 관찰',
      verdict: `[2. 지시 입력 → 처치 중 관찰] ${note} (${hobDesc})`,
      isPractice,
    });

    showToast(`${targetPatient.bedNumber} ${targetPatient.patientName} · 처치 지시 저장 (관찰 시작)`);
  };

  // 위험 대응 3단계: 재측정 입력 / 변화 없음
  const handleSubmitCriticalRecheck = (
    targetPatient: WardPatient,
    mode: 'manual' | 'unchanged',
    vitals: { rr: number; hr: number; spo2: number },
    isPractice?: boolean
  ) => {
    const ptInputs = targetPatient.inputs;
    const curCrit = getEffectiveCriticalAlertFor(targetPatient);
    const snap = curCrit.notifiedSnapshot ?? {
      rr: ptInputs.rr,
      hr: ptInputs.hr,
      spo2: ptInputs.spo2,
      sbp: ptInputs.sbp,
      dbp: ptInputs.dbp,
    };

    const nextElapsed = getNextUniqueElapsedFor(targetPatient, 1);
    const ptStart = Math.max(
      0,
      Math.min(targetPatient.repositionStartedAtElapsed ?? 0, nextElapsed)
    );
    const nextMaintained = Math.max(0, nextElapsed - ptStart);
    const clockKor = formatClockKorFromElapsed(nextElapsed);
    const elapsedLabel = `+${formatElapsed(nextElapsed)} (${formatClockFromElapsed(nextElapsed)})`;
    const epId = curCrit.episodeId ?? `crit-${targetPatient.id}-${nextElapsed}`;
    const preFull: PatientInputs = { ...ptInputs, ...snap };

    if (mode === 'unchanged') {
      const sameVitalsStr = `호흡 ${snap.rr}회 · 맥박 ${snap.hr}회 · 산소 ${snap.spo2}%`;
      const unchangedStep: CriticalEpisodeTimelineEntry = {
        id: `step-recheck-${Date.now()}`,
        stepType: 'recheck',
        clockLabel: clockKor,
        title: '재측정 (변화 없음)',
        detail: '이전 수치와 동일 · 새 알림 없이 관찰 유지',
        vitalsSummary: sameVitalsStr,
      };
      const nextCritState: CriticalAlertState = {
        ...curCrit,
        lastRecheckAtClock: clockKor,
        lastOutcome: 'unchanged',
        lastOutcomeDetail: `변화 없음 (${sameVitalsStr})`,
        timeline: [...curCrit.timeline, unchangedStep],
      };
      if (targetPatient.id === activePatient.id) {
        setRecheckInputs({ rr: snap.rr, hr: snap.hr, spo2: snap.spo2 });
      }
      handleUpdatePatient({
        ...targetPatient,
        elapsedMinutes: nextElapsed,
        repositionStartedAtElapsed: ptStart,
        minutesSinceReposition: nextMaintained,
        lastRepositionedLabel: formatRepositionAgoLabel(nextMaintained, ptInputs.lateralTilt),
        criticalAlert: nextCritState,
      });

      const statusLbl =
        nextCritState.stage === 'continuous_observation' ? '지시 대기·지속 관찰' : '처치 중 관찰';
      upsertCriticalEpisodeEmrFor(targetPatient, nextCritState, {
        preInputs: preFull,
        latestInputs: ptInputs,
        prevHob: ptInputs.currentHob,
        appliedHob: ptInputs.currentHob,
        statusLabel: statusLbl,
        verdict: `[${statusLbl}] 재측정 변화 없음 (${sameVitalsStr})`,
        isPractice,
      });
      showToast(`${targetPatient.bedNumber} · 재측정(변화 없음) 기록 완료`);
      return;
    }

    const recheckedInputs: PatientInputs = {
      ...ptInputs,
      rr: vitals.rr,
      hr: vitals.hr,
      spo2: vitals.spo2,
    };

    if (curCrit.stage === 'idle' || curCrit.stage === 'resolved') {
      const nextCritCats = getCriticalRiskCategories(recheckedInputs);
      const nextSt = evaluatePatientVitalStatus(recheckedInputs);
      const isCrit = nextSt.level === 'critical';
      const nextCritState: CriticalAlertState = isCrit
        ? {
            ...DEFAULT_CRITICAL_ALERT_STATE,
            stage: 'alert_required',
            episodeId: `crit-${targetPatient.id}-${nextElapsed}`,
            episodeStartedClock: clockKor,
            episodeRiskCategories: nextCritCats,
          }
        : DEFAULT_CRITICAL_ALERT_STATE;

      const hasRisk = ptInputs.pressureInjuryHighRisk || ptInputs.sacralSkinStatus !== 'intact';
      const knee = ptInputs.currentHob > 30 ? (hasRisk ? 15 : 12) : 0;

      handleUpdatePatient({
        ...targetPatient,
        elapsedMinutes: nextElapsed,
        repositionStartedAtElapsed: ptStart,
        minutesSinceReposition: nextMaintained,
        lastRepositionedLabel: formatRepositionAgoLabel(nextMaintained, ptInputs.lateralTilt),
        criticalAlert: nextCritState,
        inputs: recheckedInputs,
        history: [
          ...targetPatient.history.slice(-7),
          {
            timeLabel: formatClockFromElapsed(nextElapsed),
            rr: recheckedInputs.rr,
            hr: recheckedInputs.hr,
            hob: ptInputs.currentHob,
            spo2: recheckedInputs.spo2,
            eventType: 'confirmed',
            eventLabel: '재측정',
          },
        ],
      });

      handleAddEmrRecord({
        id: `recheck-${Date.now()}`,
        timestamp: makeTimestamp(),
        createdAtMs: Date.now(),
        isPractice: isPractice || undefined,
        bedNumber: targetPatient.bedNumber,
        patientName: targetPatient.patientName,
        prevHob: ptInputs.currentHob,
        appliedHob: ptInputs.currentHob,
        kneeGatch: knee,
        revTilt: 0,
        lateralTilt: ptInputs.lateralTilt,
        preVitals: {
          rr: ptInputs.rr,
          hr: ptInputs.hr,
          spo2: ptInputs.spo2,
          bp: `${ptInputs.sbp}/${ptInputs.dbp}`,
        },
        postVitals: {
          rr: recheckedInputs.rr,
          hr: recheckedInputs.hr,
          spo2: recheckedInputs.spo2,
          bp: `${ptInputs.sbp}/${ptInputs.dbp}`,
        },
        stabilizationMinutes: 0,
        verdict: `[재측정 기록] 상태: ${nextSt.label} · 호흡 ${recheckedInputs.rr}회, 맥박 ${recheckedInputs.hr}회, 산소 ${recheckedInputs.spo2}%`,
      });
      showToast(`${targetPatient.bedNumber} · 재측정 기록 저장 (${nextSt.label})`);
      return;
    }

    const compareText = `호흡 ${snap.rr}→${vitals.rr}회 · 맥박 ${snap.hr}→${vitals.hr}회 · 산소 ${snap.spo2}→${vitals.spo2}%`;
    const vitalsStr = `호흡 ${vitals.rr}회 · 맥박 ${vitals.hr}회 · 산소 ${vitals.spo2}%`;

    const newlyDetectedCats = getCriticalRiskCategories(recheckedInputs).filter(
      (cat) => !curCrit.episodeRiskCategories.includes(cat)
    );
    const mergedCategories = Array.from(
      new Set([...curCrit.episodeRiskCategories, ...newlyDetectedCats])
    );
    const isSafeNow = areVitalsRelaxedSafe(recheckedInputs) && newlyDetectedCats.length === 0;

    let nextCritState: CriticalAlertState;
    let statusLabel: string;
    let timelineLogMsg: string;

    if (isSafeNow) {
      const nextSafeCount = (curCrit.consecutiveSafeRechecks ?? 0) + 1;
      if (nextSafeCount >= 2) {
        nextCritState = {
          ...curCrit,
          stage: 'resolved',
          safetyChangeConfirmed: false,
          episodeRiskCategories: mergedCategories,
          notifiedSnapshot: {
            rr: vitals.rr,
            hr: vitals.hr,
            spo2: vitals.spo2,
            sbp: ptInputs.sbp,
            dbp: ptInputs.dbp,
          },
          noImprovementCount: 0,
          consecutiveSafeRechecks: 2,
          lastRecheckAtClock: clockKor,
          lastOutcome: 'improved',
          lastOutcomeDetail: `호전 종료 (2회 연속 안정 · ${compareText})`,
          timeline: [
            ...curCrit.timeline,
            {
              id: `step-recheck-${Date.now()}`,
              stepType: 'recheck',
              clockLabel: clockKor,
              title: '재측정 · 여유 기준 충족 (2/2회)',
              detail: compareText,
              vitalsSummary: vitalsStr,
            },
            {
              id: `step-outcome-${Date.now() + 1}`,
              stepType: 'outcome',
              clockLabel: clockKor,
              title: '호전 시 종료',
              detail: '여유 기준(맥박 ≤120, 호흡 10~26, 산소 ≥93/88%) 2회 연속 확인',
              vitalsSummary: vitalsStr,
            },
          ],
        };
        statusLabel = '호전 종료';
        timelineLogMsg = `재측정(${clockKor}) → 2회 연속 안정, 위험 대응 종료`;
      } else {
        nextCritState = {
          ...curCrit,
          stage: 'observing',
          episodeRiskCategories: mergedCategories,
          notifiedSnapshot: {
            rr: vitals.rr,
            hr: vitals.hr,
            spo2: vitals.spo2,
            sbp: ptInputs.sbp,
            dbp: ptInputs.dbp,
          },
          noImprovementCount: 0,
          consecutiveSafeRechecks: 1,
          lastRecheckAtClock: clockKor,
          lastOutcome: 'improved',
          lastOutcomeDetail: `안정 추세 1/2회 (${compareText})`,
          timeline: [
            ...curCrit.timeline,
            {
              id: `step-recheck-${Date.now()}`,
              stepType: 'recheck',
              clockLabel: clockKor,
              title: '재측정 · 안정 추세 (1/2회)',
              detail: `1회 더 연속 안정 확인 시 종료 (${compareText})`,
              vitalsSummary: vitalsStr,
            },
          ],
        };
        statusLabel = '처치 중 관찰 (안정 1/2)';
        timelineLogMsg = `재측정(${clockKor}) → 안정 추세 1/2회 확인`;
      }
    } else {
      const nextNoImprove = (curCrit.noImprovementCount ?? 0) + 1;
      const shouldShowEscalation = nextNoImprove >= 2 && !curCrit.seniorEscalationShown;
      const enterContinuous = nextNoImprove >= 2;

      const recheckStep: CriticalEpisodeTimelineEntry = {
        id: `step-recheck-${Date.now()}`,
        stepType: 'recheck',
        clockLabel: clockKor,
        title: `재측정 · 호전 없음 ${nextNoImprove}회`,
        detail: shouldShowEscalation
          ? `연속 2회 호전 없음 — 상급 의료진·신속대응 요청 고려 (${compareText})`
          : newlyDetectedCats.length > 0
            ? `새 위험 항목(${newlyDetectedCats.map(formatCriticalCategoryKo).join(', ')}) 추가 (${compareText})`
            : `${compareText} (관찰 유지)`,
        vitalsSummary: vitalsStr,
      };
      const extraOutcomeStep: CriticalEpisodeTimelineEntry[] = shouldShowEscalation
        ? [
            {
              id: `step-outcome-${Date.now() + 1}`,
              stepType: 'outcome',
              clockLabel: clockKor,
              title: '상급 의료진·신속대응 요청 고려 (1회 안내)',
              detail: '호전 없음 2회(가정값) 도달 · 지속 관찰 전환',
              vitalsSummary: vitalsStr,
            },
          ]
        : [];

      nextCritState = {
        ...curCrit,
        stage:
          newlyDetectedCats.length > 0
            ? 'alert_required'
            : enterContinuous
              ? 'continuous_observation'
              : 'observing',
        episodeRiskCategories: mergedCategories,
        notifiedSnapshot: {
          rr: vitals.rr,
          hr: vitals.hr,
          spo2: vitals.spo2,
          sbp: ptInputs.sbp,
          dbp: ptInputs.dbp,
        },
        noImprovementCount: nextNoImprove,
        consecutiveSafeRechecks: 0,
        seniorEscalationShown: curCrit.seniorEscalationShown || shouldShowEscalation,
        seniorEscalationAcknowledged: curCrit.seniorEscalationShown
          ? curCrit.seniorEscalationAcknowledged
          : false,
        newCategoryAlertNote:
          newlyDetectedCats.length > 0
            ? `새 위험 항목 추가: ${newlyDetectedCats.map(formatCriticalCategoryKo).join(', ')}`
            : undefined,
        lastRecheckAtClock: clockKor,
        lastOutcome: 'unchanged',
        lastOutcomeDetail: `호전 없음 ${nextNoImprove}회 (${compareText})`,
        timeline: [...curCrit.timeline, recheckStep, ...extraOutcomeStep],
      };

      statusLabel =
        newlyDetectedCats.length > 0
          ? '새 위험 항목 알림 필요'
          : enterContinuous
            ? '지시 대기·지속 관찰'
            : '처치 중 관찰';
      timelineLogMsg = shouldShowEscalation
        ? `호전 없음 2회 · 상급 의료진·신속대응 요청 고려`
        : `호전 없음 ${nextNoImprove}회 (${compareText})`;
    }

    setLastSimRecoveryBadge(null);
    handleUpdatePatient({
      ...targetPatient,
      elapsedMinutes: nextElapsed,
      repositionStartedAtElapsed: ptStart,
      minutesSinceReposition: nextMaintained,
      lastRepositionedLabel: formatRepositionAgoLabel(nextMaintained, ptInputs.lateralTilt),
      criticalAlert: nextCritState,
      inputs: recheckedInputs,
      history: [
        ...targetPatient.history.slice(-7),
        {
          timeLabel: formatClockFromElapsed(nextElapsed),
          rr: vitals.rr,
          hr: vitals.hr,
          hob: ptInputs.currentHob,
          spo2: vitals.spo2,
          eventType: 'confirmed',
          eventLabel: isSafeNow ? '재측정 안정' : '재측정',
        },
      ],
    });

    setTimeEvents((prev) =>
      [
        {
          id: `t-recheck-${Date.now()}`,
          proposalKey: `${epId}-recheck-latest`,
          elapsedLabel,
          type: 'confirmed' as const,
          message: timelineLogMsg,
        },
        ...prev.filter((e) => e.proposalKey !== `${epId}-recheck-latest`),
      ].slice(0, 8)
    );

    upsertCriticalEpisodeEmrFor(targetPatient, nextCritState, {
      preInputs: preFull,
      latestInputs: recheckedInputs,
      prevHob: ptInputs.currentHob,
      appliedHob: ptInputs.currentHob,
      statusLabel,
      verdict: timelineLogMsg,
      isPractice,
    });

    showToast(`${targetPatient.bedNumber} · ${timelineLogMsg}`);
  };

  // 각도 적용 (작업 공간, 상단 알림, 하단 빠른 바, 체험 패널 공통)
  const handleApplyAngleForPatient = (
    targetPatient: WardPatient,
    targetHobInput: number,
    revTiltOverride?: number,
    ackKey?: string,
    opts?: { isPractice?: boolean; criticalConfirmedOverride?: boolean; allowUndo?: boolean }
  ) => {
    const curInputs = targetPatient.inputs;
    const isCrit = isCriticalPriorityActiveFor(targetPatient);
    const critNotified = isDoctorNotifiedFor(targetPatient);
    const critConfirmed =
      opts?.criticalConfirmedOverride ??
      Boolean(getEffectiveCriticalAlertFor(targetPatient).safetyChangeConfirmed);

    if (isCrit && (!critNotified || !critConfirmed)) {
      return;
    }

    const prevSnapshot = targetPatient;
    const revTilt = revTiltOverride ?? 0;
    const finalHob = revTilt > 0 ? 0 : targetHobInput;
    const nextSim = virtualMode
      ? simulateVitalsAtAngle(curInputs, finalHob)
      : {
          rr: curInputs.rr,
          hr: curInputs.hr,
          spo2: curInputs.spo2,
          sbp: curInputs.sbp,
          dbp: curInputs.dbp,
        };

    const nextElapsed = getNextUniqueElapsedFor(targetPatient, 1);
    const ptStart = Math.max(
      0,
      Math.min(targetPatient.repositionStartedAtElapsed ?? 0, nextElapsed)
    );
    const nextMaintained = Math.max(0, nextElapsed - ptStart);
    const recAudit = checkAngleAppropriateness(finalHob, { ...curInputs, ...nextSim });
    const nextHobDisplay = revTilt > 0 ? `침대 전체 +${revTilt}°` : `${finalHob}°`;
    const recordId = `angle-apply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    handleUpdatePatient({
      ...targetPatient,
      elapsedMinutes: nextElapsed,
      repositionStartedAtElapsed: ptStart,
      minutesSinceReposition: nextMaintained,
      lastRepositionedLabel: formatRepositionAgoLabel(nextMaintained, curInputs.lateralTilt),
      minutesAbove45: finalHob > HIGH_ANGLE_HOB_THRESHOLD ? targetPatient.minutesAbove45 : 0,
      highAngleProposedForCycle:
        finalHob > HIGH_ANGLE_HOB_THRESHOLD ? targetPatient.highAngleProposedForCycle : false,
      inputs: {
        ...curInputs,
        ...nextSim,
        currentHob: finalHob,
      },
      history: [
        ...targetPatient.history.slice(-7),
        {
          timeLabel: formatClockFromElapsed(nextElapsed),
          rr: nextSim.rr,
          hr: nextSim.hr,
          hob: revTilt > 0 ? revTilt : finalHob,
          spo2: nextSim.spo2,
          eventType: 'confirmed',
          eventLabel: `${revTilt > 0 ? `+${revTilt}°` : `${finalHob}°`} 적용`,
        },
      ],
    });

    if (ackKey) {
      setAcknowledgedAngleKeys((prev) => ({ ...prev, [targetPatient.id]: ackKey }));
    }

    if (targetPatient.id === activePatient.id) {
      setRecheckInputs({ rr: nextSim.rr, hr: nextSim.hr, spo2: nextSim.spo2 });
      setRecheckPanelOpen(true);
    }

    handleAddEmrRecord({
      id: recordId,
      timestamp: makeTimestamp(),
      createdAtMs: Date.now(),
      isPractice: opts?.isPractice || undefined,
      bedNumber: targetPatient.bedNumber,
      patientName: targetPatient.patientName,
      prevHob: curInputs.currentHob,
      appliedHob: finalHob,
      kneeGatch: recAudit.targetKneeGatch,
      revTilt,
      lateralTilt: curInputs.lateralTilt,
      preVitals: {
        rr: curInputs.rr,
        hr: curInputs.hr,
        spo2: curInputs.spo2,
        bp: `${curInputs.sbp}/${curInputs.dbp}`,
      },
      postVitals: {
        rr: nextSim.rr,
        hr: nextSim.hr,
        spo2: nextSim.spo2,
        bp: `${nextSim.sbp}/${nextSim.dbp}`,
      },
      stabilizationMinutes: 0,
      verdict: `[간호사 확인 · 각도 적용] ${curInputs.currentHob}° → ${nextHobDisplay} (무릎 받침 ${recAudit.targetKneeGatch}°)${
        isCrit ? ' · 의료진 확인 후 적용' : ''
      }`,
    });

    const msg = `${targetPatient.bedNumber} ${targetPatient.patientName} · ${nextHobDisplay} 적용 및 간호 기록 저장 완료`;
    if (opts?.allowUndo) {
      showToast(msg, {
        label: '되돌리기',
        onUndo: () => {
          handleUpdatePatient(prevSnapshot);
          setEmrRecords((prev) => prev.filter((r) => r.id !== recordId));
          showToast(`${prevSnapshot.bedNumber} ${prevSnapshot.patientName} · 방금 각도 변경을 되돌렸습니다`);
        },
      });
    } else {
      showToast(msg);
    }
  };

  // B(6) 원클릭 체위변경 (되돌리기 포함 · 탭 전환/스크롤 없이 1줄 EMR 자동 저장)
  const applyLateralTiltForPatient = (
    targetPatient: WardPatient,
    tilt: LateralTiltPosition,
    extraNote?: string
  ) => {
    const ptInputs = targetPatient.inputs;
    if (tilt === ptInputs.lateralTilt) return;

    const isCrit = isCriticalPriorityActiveFor(targetPatient);
    const critNotified = isDoctorNotifiedFor(targetPatient);
    const critConfirmed = Boolean(
      getEffectiveCriticalAlertFor(targetPatient).safetyChangeConfirmed
    );
    if (isCrit && (!critNotified || !critConfirmed)) {
      return;
    }

    const prevSnapshot = targetPatient;
    const prevTilt = ptInputs.lateralTilt;
    const ptElapsed = Math.max(0, targetPatient.elapsedMinutes ?? 0);
    const ptStart = Math.max(0, Math.min(targetPatient.repositionStartedAtElapsed ?? 0, ptElapsed));
    const maintainedMin = Math.max(0, ptElapsed - ptStart);
    const clockKor = formatClockKorFromElapsed(ptElapsed);
    const recordId = `reposition-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const nextLastSideTilt: 'left_30' | 'right_30' =
      tilt === 'left_30' || tilt === 'right_30'
        ? tilt
        : prevTilt === 'left_30' || prevTilt === 'right_30'
          ? prevTilt
          : targetPatient.lastSideTilt ?? 'right_30';

    const knee =
      ptInputs.currentHob > 30
        ? ptInputs.pressureInjuryHighRisk || ptInputs.sacralSkinStatus !== 'intact'
          ? 15
          : 12
        : 0;
    const rev =
      ptInputs.spinalOrHipContraindication && ptInputs.currentHob === 0
        ? checkAngleAppropriateness(0, ptInputs).targetRevTilt
        : 0;

    handleUpdatePatient({
      ...targetPatient,
      elapsedMinutes: ptElapsed,
      repositionStartedAtElapsed: ptElapsed,
      minutesSinceReposition: 0,
      lastSideTilt: nextLastSideTilt,
      repositionProposedForCycle: false,
      repositionHoldCount: 0,
      repositionSnoozeMinutesLeft: 0,
      lastRepositionedLabel: formatRepositionAgoLabel(0, tilt),
      inputs: {
        ...ptInputs,
        lateralTilt: tilt,
      },
    });

    handleAddEmrRecord({
      id: recordId,
      timestamp: makeTimestamp(),
      createdAtMs: Date.now(),
      bedNumber: targetPatient.bedNumber,
      patientName: targetPatient.patientName,
      prevHob: ptInputs.currentHob,
      appliedHob: ptInputs.currentHob,
      kneeGatch: knee,
      revTilt: rev,
      lateralTilt: tilt,
      preVitals: {
        rr: ptInputs.rr,
        hr: ptInputs.hr,
        spo2: ptInputs.spo2,
        bp: `${ptInputs.sbp}/${ptInputs.dbp}`,
      },
      stabilizationMinutes: 0,
      repositionMeta: {
        prevTilt,
        newTilt: tilt,
        maintainedMinutes: maintainedMin,
        isHold: false,
      },
      verdict: `[체위변경${extraNote ? ` · ${extraNote}` : ''}] ${clockKor} · ${formatTiltKo(
        prevTilt
      )} → ${formatTiltKo(tilt)} (${maintainedMin}분 유지 후 초기화)`,
    });

    showToast(
      `${targetPatient.bedNumber} ${targetPatient.patientName} · ${formatTiltKo(tilt)} 적용 및 타이머 초기화`,
      {
        label: '되돌리기',
        onUndo: () => {
          handleUpdatePatient(prevSnapshot);
          setEmrRecords((prev) => prev.filter((r) => r.id !== recordId));
          showToast(
            `${prevSnapshot.bedNumber} ${prevSnapshot.patientName} · 체위변경을 ${formatTiltKo(prevTilt)}(으)로 되돌렸습니다`
          );
        },
      }
    );
  };

  // 보류 사유 저장 (15분 뒤 재알림)
  const handleHoldRepositionForPatient = (
    targetPatient: WardPatient,
    chipReason: HoldChipReason,
    customReason: string
  ) => {
    const customTrimmed = customReason.trim();
    const reasonText =
      chipReason === '기타' && customTrimmed ? `기타 (${customTrimmed})` : chipReason;
    const nextHoldCount = (targetPatient.repositionHoldCount ?? 0) + 1;
    const ptInputs = targetPatient.inputs;
    const prevTilt = ptInputs.lateralTilt;
    const ptElapsed = Math.max(0, targetPatient.elapsedMinutes ?? 0);
    const ptStart = Math.max(0, Math.min(targetPatient.repositionStartedAtElapsed ?? 0, ptElapsed));
    const maintainedMin = Math.max(0, ptElapsed - ptStart);

    const knee =
      ptInputs.currentHob > 30
        ? ptInputs.pressureInjuryHighRisk || ptInputs.sacralSkinStatus !== 'intact'
          ? 15
          : 12
        : 0;

    handleUpdatePatient({
      ...targetPatient,
      repositionProposedForCycle: true,
      repositionHoldCount: nextHoldCount,
      repositionSnoozeMinutesLeft: 15,
    });

    handleAddEmrRecord({
      id: `reposition-hold-${Date.now()}`,
      timestamp: makeTimestamp(),
      createdAtMs: Date.now(),
      bedNumber: targetPatient.bedNumber,
      patientName: targetPatient.patientName,
      prevHob: ptInputs.currentHob,
      appliedHob: ptInputs.currentHob,
      kneeGatch: knee,
      revTilt: 0,
      lateralTilt: prevTilt,
      preVitals: {
        rr: ptInputs.rr,
        hr: ptInputs.hr,
        spo2: ptInputs.spo2,
        bp: `${ptInputs.sbp}/${ptInputs.dbp}`,
      },
      stabilizationMinutes: 0,
      repositionMeta: {
        prevTilt,
        newTilt: prevTilt,
        maintainedMinutes: maintainedMin,
        isHold: true,
        holdCount: nextHoldCount,
        holdReason: reasonText,
      },
      verdict: `[체위변경 보류 ${nextHoldCount}회 · 15분 뒤 재알림] ${formatTiltKo(
        prevTilt
      )} (${maintainedMin}분 유지) · 사유: ${reasonText}${
        nextHoldCount >= 3 ? ' · 반복 보류 — 간호사 확인 필요' : ''
      }`,
    });

    showToast(`${targetPatient.bedNumber} · 보류 저장됨 (${reasonText}, 15분 뒤 재알림)`);
  };

  // 시간 경과 시뮬레이션
  const advanceTimeBy = (deltaMin: number, isPractice?: boolean) => {
    const markPractice = isPractice ?? virtualMode;
    const prevElapsed = Math.max(0, activePatient.elapsedMinutes ?? 0);
    const nextElapsed = getNextUniqueElapsedFor(activePatient, deltaMin);
    const elapsedLabel = `+${formatElapsed(nextElapsed)} (${formatClockFromElapsed(nextElapsed)})`;
    const curInputs = activePatient.inputs;
    const curCrit = getEffectiveCriticalAlertFor(activePatient);
    const isEpisodeActive = curCrit.stage !== 'idle' && curCrit.stage !== 'resolved';
    const prevAudit = checkAngleAppropriateness(curInputs.currentHob, curInputs);
    const prevCritStatus = evaluatePatientVitalStatus(curInputs);
    const wasCriticalBlocking = isCriticalPriorityActiveFor(activePatient);
    const prevHighAngleDue =
      !wasCriticalBlocking &&
      curInputs.currentHob > HIGH_ANGLE_HOB_THRESHOLD &&
      (activePatient.minutesAbove45 ?? 0) >= HIGH_ANGLE_LIMIT_MINUTES &&
      !activePatient.highAngleProposedForCycle;
    const prevTargetAngle =
      prevHighAngleDue && !prevAudit.isWrongAngle && curInputs.rr <= 21
        ? 35
        : prevAudit.targetHob;
    const prevHasAngleDiff =
      (prevAudit.targetRevTilt > 0 && curInputs.currentHob !== 0) ||
      (prevAudit.targetRevTilt === 0 && prevTargetAngle !== curInputs.currentHob);
    const prevAngleKey = `${curInputs.currentHob}|${prevCritStatus.level}|${
      prevAudit.targetRevTilt > 0 ? `+${prevAudit.targetRevTilt}` : prevTargetAngle
    }`;
    const prevRespAlertKey =
      !wasCriticalBlocking &&
      (prevAudit.isWrongAngle || prevHighAngleDue) &&
      prevHasAngleDiff &&
      acknowledgedAngleKeys[activePatient.id] !== prevAngleKey
        ? prevAngleKey
        : null;

    let nextRr = curInputs.rr;
    let nextHr = curInputs.hr;
    let nextSpo2 = curInputs.spo2;
    let nextSbp = curInputs.sbp;
    let nextDbp = curInputs.dbp;
    let nextBorg = curInputs.borgScore;
    let simulatedRecoveryApplied = false;

    const ptStart = Math.max(
      0,
      Math.min(activePatient.repositionStartedAtElapsed ?? 0, prevElapsed)
    );
    const nextMinutesSinceReposition = Math.max(0, nextElapsed - ptStart);
    const nextMinutesAbove45 =
      curInputs.currentHob > HIGH_ANGLE_HOB_THRESHOLD
        ? (activePatient.minutesAbove45 ?? 0) + deltaMin
        : 0;
    const prevSnooze = activePatient.repositionSnoozeMinutesLeft ?? 0;
    const nextSnooze = prevSnooze > 0 ? Math.max(0, prevSnooze - deltaMin) : 0;

    if (virtualMode) {
      const crossed15 = Math.floor(nextElapsed / 15) - Math.floor(prevElapsed / 15);
      const crossed5 = Math.floor(nextElapsed / 5) - Math.floor(prevElapsed / 5);
      const steps =
        deltaMin >= 15
          ? Math.max(1, Math.round(deltaMin / 15))
          : deltaMin >= 10
            ? crossed15
            : 0;
      const miniStep = deltaMin < 10 ? crossed5 : 0;

      if (steps > 0 || miniStep > 0) {
        const rrStep = steps > 0 ? 2 * steps : miniStep;
        const hrStep = steps > 0 ? 7 * steps : 2 * miniStep;
        const spo2Step = steps > 0 ? 2 * steps : miniStep;
        const sbpStep = steps > 0 ? 5 * steps : 2 * miniStep;
        const dbpStep = steps > 0 ? 3 * steps : miniStep;
        const borgStep = steps > 0 ? steps : crossed15;

        if (isEpisodeActive) {
          if (curCrit.stage === 'observing' || curCrit.stage === 'continuous_observation') {
            if (curInputs.rr > 18) nextRr = Math.max(18, curInputs.rr - rrStep);
            else if (curInputs.rr < 14) nextRr = Math.min(16, curInputs.rr + rrStep);

            if (curInputs.hr > 84) nextHr = Math.max(84, curInputs.hr - hrStep);
            else if (curInputs.hr < 64) {
              nextHr = Math.min(68, curInputs.hr + (steps > 0 ? 5 * steps : 2 * miniStep));
            }

            const targetSpo2 = curInputs.copdTargetMode ? 91 : 97;
            if (curInputs.spo2 < targetSpo2) {
              nextSpo2 = Math.min(targetSpo2, curInputs.spo2 + spo2Step);
            }

            if (curInputs.sbp < 110) {
              nextSbp = Math.min(118, curInputs.sbp + sbpStep);
              nextDbp = Math.min(74, curInputs.dbp + dbpStep);
            }

            if (borgStep > 0) {
              nextBorg = Math.max(2, curInputs.borgScore - borgStep);
            }
            simulatedRecoveryApplied =
              nextRr !== curInputs.rr ||
              nextHr !== curInputs.hr ||
              nextSpo2 !== curInputs.spo2 ||
              nextSbp !== curInputs.sbp;
          }
        } else {
          if (curInputs.currentHob >= 60) {
            nextRr = Math.max(17, curInputs.rr - rrStep);
            nextHr = Math.max(78, curInputs.hr - (steps > 0 ? 4 * steps : 2 * miniStep));
            const targetSpo2 = curInputs.copdTargetMode ? 91 : 98;
            nextSpo2 = Math.min(targetSpo2, curInputs.spo2 + (steps > 0 ? steps : miniStep));
            if (borgStep > 0) nextBorg = Math.max(2, curInputs.borgScore - borgStep);
            if (curInputs.orthostaticHistory) {
              nextSbp = Math.max(
                84,
                curInputs.sbp - (deltaMin >= 5 ? Math.ceil(deltaMin / 5) : miniStep)
              );
            }
          } else if (curInputs.currentHob <= 15 && !curInputs.spinalOrHipContraindication) {
            if (steps > 0) {
              nextRr = Math.min(31, curInputs.rr + Math.ceil(deltaMin / 10));
              nextHr = Math.min(132, curInputs.hr + Math.ceil(deltaMin / 12));
              nextSpo2 = Math.max(88, curInputs.spo2 - Math.max(1, Math.floor(deltaMin / 15)));
              nextBorg = Math.min(8, curInputs.borgScore + Math.max(1, Math.floor(deltaMin / 15)));
            } else if (miniStep > 0) {
              nextRr = Math.min(31, curInputs.rr + miniStep);
              nextHr = Math.min(132, curInputs.hr + miniStep);
              if (crossed15 > 0) {
                nextSpo2 = Math.max(88, curInputs.spo2 - crossed15);
                nextBorg = Math.min(8, curInputs.borgScore + crossed15);
              }
            }
          } else if (curInputs.currentHob >= 30 && curInputs.currentHob < 60) {
            if (curInputs.rr > 18) nextRr = Math.max(18, curInputs.rr - (steps > 0 ? steps : miniStep));
            if (curInputs.hr > 82) {
              nextHr = Math.max(80, curInputs.hr - (steps > 0 ? 3 * steps : miniStep));
            }
            const targetSpo2 = curInputs.copdTargetMode ? 91 : 97;
            if (curInputs.spo2 < targetSpo2) {
              nextSpo2 = Math.min(targetSpo2, curInputs.spo2 + (steps > 0 ? steps : miniStep));
            }
            if (curInputs.sbp < 110) {
              nextSbp = Math.min(118, curInputs.sbp + (steps > 0 ? 4 * steps : miniStep));
              nextDbp = Math.min(74, curInputs.dbp + (steps > 0 ? 2 * steps : miniStep));
            }
            if (borgStep > 0) nextBorg = Math.max(2, curInputs.borgScore - borgStep);
          }
          simulatedRecoveryApplied =
            nextRr !== curInputs.rr ||
            nextHr !== curInputs.hr ||
            nextSpo2 !== curInputs.spo2 ||
            nextSbp !== curInputs.sbp;
        }
      }
    }

    const simulatedInputs: PatientInputs = {
      ...curInputs,
      rr: nextRr,
      hr: nextHr,
      spo2: nextSpo2,
      sbp: nextSbp,
      dbp: nextDbp,
      borgScore: nextBorg,
    };

    const audit = checkAngleAppropriateness(curInputs.currentHob, simulatedInputs);
    const nextCats = getCriticalRiskCategories(simulatedInputs);
    let nextCritState: CriticalAlertState = curCrit;
    let newCriticalTriggered = false;

    if (simulatedRecoveryApplied) {
      setRecheckInputs({ rr: nextRr, hr: nextHr, spo2: nextSpo2 });
      setLastSimRecoveryBadge(
        `가상 변화: 호흡 ${curInputs.rr}→${nextRr} · 맥박 ${curInputs.hr}→${nextHr} · 산소 ${curInputs.spo2}→${nextSpo2}%`
      );
    }

    if (isEpisodeActive) {
      const brandNewCats = nextCats.filter((c) => !curCrit.episodeRiskCategories.includes(c));
      if (brandNewCats.length > 0) {
        newCriticalTriggered = true;
        nextCritState = {
          ...curCrit,
          stage: 'alert_required',
          episodeRiskCategories: Array.from(
            new Set([...curCrit.episodeRiskCategories, ...brandNewCats])
          ),
          newCategoryAlertNote: `새 위험 항목 추가: ${brandNewCats
            .map(formatCriticalCategoryKo)
            .join(', ')}`,
        };
      }
    } else if (audit.decision.vitalStatus.level === 'critical') {
      newCriticalTriggered = true;
      nextCritState = {
        ...DEFAULT_CRITICAL_ALERT_STATE,
        stage: 'alert_required',
        episodeId: `crit-${activePatient.id}-${nextElapsed}`,
        episodeStartedClock: formatClockKorFromElapsed(nextElapsed),
        episodeRiskCategories: nextCats,
      };
    } else if (curCrit.stage === 'resolved') {
      nextCritState = DEFAULT_CRITICAL_ALERT_STATE;
    }

    const isCriticalBlocking =
      nextCritState.stage !== 'resolved' &&
      (nextCritState.stage === 'alert_required' ||
        nextCritState.stage === 'awaiting_order' ||
        nextCritState.stage === 'observing' ||
        nextCritState.stage === 'continuous_observation' ||
        audit.decision.vitalStatus.level === 'critical');

    const curInterval =
      activePatient.customRepositionIntervalMin ?? getDefaultRepositionInterval(curInputs);
    const nextDelayMinutes = Math.max(0, nextMinutesSinceReposition - curInterval);

    if (nextDelayMinutes > 0) {
      upsertRepositionDelayEmrFor(
        activePatient,
        ptStart,
        nextMinutesSinceReposition,
        curInterval,
        simulatedInputs,
        isCriticalBlocking,
        markPractice
      );
    }

    const wasProposedReposition = Boolean(activePatient.repositionProposedForCycle);
    const severeThreshold = Math.round(curInterval * 1.5);
    const triggeredThisTick =
      nextMinutesSinceReposition >= curInterval &&
      nextSnooze === 0 &&
      (!isCriticalBlocking || nextMinutesSinceReposition >= severeThreshold);

    const highAngleDue =
      !isCriticalBlocking &&
      curInputs.currentHob > HIGH_ANGLE_HOB_THRESHOLD &&
      nextMinutesAbove45 >= HIGH_ANGLE_LIMIT_MINUTES &&
      !activePatient.highAngleProposedForCycle;

    const nextTargetAngle =
      highAngleDue && !audit.isWrongAngle && simulatedInputs.rr <= 21 ? 35 : audit.targetHob;
    const nextHasAngleDiff =
      (audit.targetRevTilt > 0 && simulatedInputs.currentHob !== 0) ||
      (audit.targetRevTilt === 0 && nextTargetAngle !== simulatedInputs.currentHob);
    const nextAngleKey = `${simulatedInputs.currentHob}|${audit.decision.vitalStatus.level}|${
      audit.targetRevTilt > 0 ? `+${audit.targetRevTilt}` : nextTargetAngle
    }`;
    const nextRespAlertKey =
      !isCriticalBlocking &&
      (audit.isWrongAngle || highAngleDue) &&
      nextHasAngleDiff &&
      acknowledgedAngleKeys[activePatient.id] !== nextAngleKey
        ? nextAngleKey
        : null;
    const newRespAlertTriggered =
      nextRespAlertKey !== null && nextRespAlertKey !== prevRespAlertKey;

    if (newCriticalTriggered || newRespAlertTriggered) {
      if (timeFlowPlaying) {
        setStoppedByAlertNotice(true);
      }
      setTimeFlowPlaying(false);
    }

    if (triggeredThisTick && !wasProposedReposition) {
      setTimeEvents((prev) =>
        [
          {
            id: `t-rep-${Date.now()}`,
            elapsedLabel,
            type: 'pressure' as const,
            message: `${activePatient.bedNumber} 체위변경(몸 돌리기) 기준 ${curInterval}분 도달 → ${formatTiltKo(
              getNextCycleTilt(curInputs.lateralTilt, activePatient.lastSideTilt ?? 'right_30')
            )}`,
          },
          ...prev,
        ].slice(0, 8)
      );
    }

    handleUpdatePatient({
      ...activePatient,
      elapsedMinutes: nextElapsed,
      repositionStartedAtElapsed: ptStart,
      minutesSinceReposition: nextMinutesSinceReposition,
      lastRepositionedLabel: formatRepositionAgoLabel(
        nextMinutesSinceReposition,
        curInputs.lateralTilt
      ),
      repositionProposedForCycle: wasProposedReposition || triggeredThisTick,
      repositionSnoozeMinutesLeft: nextSnooze,
      minutesAbove45: nextMinutesAbove45,
      highAngleProposedForCycle:
        curInputs.currentHob > HIGH_ANGLE_HOB_THRESHOLD
          ? activePatient.highAngleProposedForCycle || highAngleDue
          : false,
      criticalAlert: nextCritState,
      inputs: simulatedInputs,
      history: [
        ...activePatient.history.slice(-7),
        {
          timeLabel: formatClockFromElapsed(nextElapsed),
          rr: nextRr,
          hr: nextHr,
          hob: curInputs.currentHob,
          spo2: nextSpo2,
          isSimulatedRecovery: simulatedRecoveryApplied,
          eventType: 'time',
          eventLabel: simulatedRecoveryApplied ? '시연 변화' : undefined,
        },
      ],
    });

    if (isPractice) {
      showToast(`${activePatient.bedNumber} · 시간 +${deltaMin}분 경과 (누적 ${nextElapsed}분)`);
    }
  };

  const handleToggleTimeFlow = () => {
    if (timeFlowPlaying) {
      setTimeFlowPlaying(false);
    } else {
      setStoppedByAlertNotice(false);
      setTimeFlowPlaying(true);
    }
  };

  const advanceTimeRef = useRef(advanceTimeBy);
  advanceTimeRef.current = advanceTimeBy;

  const activeEffCrit = getEffectiveCriticalAlertFor(activePatient);
  const isCriticalTickBlocked =
    activeEffCrit.stage === 'alert_required' || activeEffCrit.stage === 'awaiting_order';

  useEffect(() => {
    if (!timeFlowPlaying || isCriticalTickBlocked) {
      return;
    }
    const interval = window.setInterval(() => {
      advanceTimeRef.current(timeSpeed);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timeFlowPlaying, timeSpeed, isCriticalTickBlocked]);

  const handleUpdateField = <K extends keyof PatientInputs>(key: K, value: PatientInputs[K]) => {
    const updatedInputs: PatientInputs = { ...activePatient.inputs, [key]: value };
    const curCrit = getEffectiveCriticalAlertFor(activePatient);
    const nextCritStatus = evaluatePatientVitalStatus(updatedInputs);
    const nextCritCats = getCriticalRiskCategories(updatedInputs);
    const isEpisodeActive = curCrit.stage !== 'idle' && curCrit.stage !== 'resolved';
    const elapsed = Math.max(0, activePatient.elapsedMinutes ?? 0);

    let nextCritState = curCrit;
    if (isEpisodeActive) {
      const brandNewCats = nextCritCats.filter((c) => !curCrit.episodeRiskCategories.includes(c));
      if (brandNewCats.length > 0) {
        nextCritState = {
          ...curCrit,
          stage: 'alert_required',
          episodeRiskCategories: Array.from(
            new Set([...curCrit.episodeRiskCategories, ...brandNewCats])
          ),
          newCategoryAlertNote: `새 위험 항목 추가: ${brandNewCats
            .map(formatCriticalCategoryKo)
            .join(', ')}`,
        };
      } else if (
        curCrit.stage === 'alert_required' &&
        curCrit.timeline.length === 0 &&
        nextCritStatus.level !== 'critical'
      ) {
        nextCritState = DEFAULT_CRITICAL_ALERT_STATE;
      }
    } else if (nextCritStatus.level === 'critical') {
      nextCritState = {
        ...DEFAULT_CRITICAL_ALERT_STATE,
        stage: 'alert_required',
        episodeId: `crit-${activePatient.id}-${Date.now()}`,
        episodeStartedClock: formatClockKorFromElapsed(elapsed),
        episodeRiskCategories: nextCritCats,
      };
    }

    handleUpdatePatient({
      ...activePatient,
      criticalAlert: nextCritState,
      inputs: updatedInputs,
    });
  };

  const handleUpdateCustomRepositionInterval = (mins: number | null) => {
    const clamped = mins === null ? null : Math.max(15, Math.min(240, Math.round(mins)));
    handleUpdatePatient({
      ...activePatient,
      customRepositionIntervalMin: clamped,
      repositionProposedForCycle: false,
    });
  };

  const handleApplyPresetFromPractice = (preset: PracticeScenarioPreset) => {
    const curInputs = activePatient.inputs;
    const nextInputs: PatientInputs = { ...curInputs, ...preset.patch };
    const nextVs = evaluatePatientVitalStatus(nextInputs);
    const nextElapsed = getNextUniqueElapsedFor(activePatient, 1);
    const ptStart = Math.max(
      0,
      Math.min(activePatient.repositionStartedAtElapsed ?? 0, nextElapsed)
    );
    const nextMaintained = Math.max(0, nextElapsed - ptStart);
    const nextCritCats = getCriticalRiskCategories(nextInputs);

    let nextCritState: CriticalAlertState = DEFAULT_CRITICAL_ALERT_STATE;
    if (!preset.resetCritical && nextVs.level === 'critical') {
      nextCritState = {
        ...DEFAULT_CRITICAL_ALERT_STATE,
        stage: 'alert_required',
        episodeId: `crit-${activePatient.id}-${nextElapsed}`,
        episodeStartedClock: formatClockKorFromElapsed(nextElapsed),
        episodeRiskCategories: nextCritCats,
      };
    }

    setTimeFlowPlaying(false);
    setRecheckInputs({ rr: nextInputs.rr, hr: nextInputs.hr, spo2: nextInputs.spo2 });
    setLastSimRecoveryBadge(null);

    handleUpdatePatient({
      ...activePatient,
      elapsedMinutes: nextElapsed,
      repositionStartedAtElapsed: ptStart,
      minutesSinceReposition: nextMaintained,
      lastRepositionedLabel: formatRepositionAgoLabel(nextMaintained, nextInputs.lateralTilt),
      criticalAlert: nextCritState,
      inputs: nextInputs,
      history: [
        ...activePatient.history.slice(-7),
        {
          timeLabel: formatClockFromElapsed(nextElapsed),
          rr: nextInputs.rr,
          hr: nextInputs.hr,
          hob: nextInputs.currentHob,
          spo2: nextInputs.spo2,
          eventType: 'input',
          eventLabel: `체험:${preset.label}`,
        },
      ],
    });

    handleAddEmrRecord({
      id: `practice-preset-${Date.now()}`,
      timestamp: makeTimestamp(),
      createdAtMs: Date.now(),
      isPractice: true,
      bedNumber: activePatient.bedNumber,
      patientName: activePatient.patientName,
      prevHob: curInputs.currentHob,
      appliedHob: nextInputs.currentHob,
      kneeGatch: nextInputs.currentHob > 30 ? 12 : 0,
      revTilt: 0,
      lateralTilt: nextInputs.lateralTilt,
      preVitals: {
        rr: curInputs.rr,
        hr: curInputs.hr,
        spo2: curInputs.spo2,
        bp: `${curInputs.sbp}/${curInputs.dbp}`,
      },
      postVitals: {
        rr: nextInputs.rr,
        hr: nextInputs.hr,
        spo2: nextInputs.spo2,
        bp: `${nextInputs.sbp}/${nextInputs.dbp}`,
      },
      stabilizationMinutes: 0,
      verdict: `[체험 · 상황 만들기: ${preset.label}] 판정 ${nextVs.label} (${preset.shortDesc})`,
    });

    showToast(`${activePatient.bedNumber} · '${preset.label}' 상황 적용됨 (${nextVs.label})`);
  };

  const triggerCriticalDemo = () => {
    const curInputs = activePatient.inputs;
    const demoVitals = { rr: 27, hr: 138, spo2: 91, sbp: 106, dbp: 68 };
    const testedAngle = curInputs.currentHob;
    const measuredInputs: PatientInputs = {
      ...curInputs,
      ...demoVitals,
      borgScore: 7,
      currentHob: testedAngle,
    };

    const nextElapsed = getNextUniqueElapsedFor(activePatient, 1);
    const ptStart = Math.max(
      0,
      Math.min(activePatient.repositionStartedAtElapsed ?? 0, nextElapsed)
    );
    const nextMaintained = Math.max(0, nextElapsed - ptStart);
    setTimeFlowPlaying(false);
    setRecheckInputs({ rr: demoVitals.rr, hr: demoVitals.hr, spo2: demoVitals.spo2 });
    setLastSimRecoveryBadge(null);

    handleUpdatePatient({
      ...activePatient,
      elapsedMinutes: nextElapsed,
      repositionStartedAtElapsed: ptStart,
      minutesSinceReposition: nextMaintained,
      lastRepositionedLabel: formatRepositionAgoLabel(nextMaintained, curInputs.lateralTilt),
      criticalAlert: {
        ...DEFAULT_CRITICAL_ALERT_STATE,
        stage: 'alert_required',
        episodeId: `crit-${activePatient.id}-${nextElapsed}`,
        episodeStartedClock: formatClockKorFromElapsed(nextElapsed),
        episodeRiskCategories: getCriticalRiskCategories(measuredInputs),
      },
      inputs: measuredInputs,
      history: [
        ...activePatient.history.slice(-7),
        {
          timeLabel: formatClockFromElapsed(nextElapsed),
          rr: demoVitals.rr,
          hr: demoVitals.hr,
          hob: testedAngle,
          spo2: demoVitals.spo2,
          eventType: 'input',
          eventLabel: '위험 시연',
        },
      ],
    });
    showToast(`${activePatient.bedNumber} · 위험 상황 시연(맥박 138) 시작 — 상단 알림을 확인하세요`);
  };

  const handleResetAllToInitial = () => {
    setTimeFlowPlaying(false);
    setStoppedByAlertNotice(false);
    setRecheckPanelOpen(false);
    setTimeEvents([]);
    setAcknowledgedAngleKeys({});
    setLastSimRecoveryBadge(null);
    setOrderHobInput(null);
    setPatients(INITIAL_WARD_PATIENTS);
    setSelectedPatientId(INITIAL_WARD_PATIENTS[0].id);
    setEmrRecords((prev) => prev.filter((r) => !r.isPractice));
    showToast('체험 기록과 모든 환자 수치를 처음 상태로 초기화했습니다');
  };

  const topStickyOffset = 64 + topAlertHeight + 6;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* 3-Zone Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('workspace')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            스마트 침대 각도 관리
          </button>

          <nav className="flex items-center gap-6 text-sm font-medium overflow-x-auto" aria-label="주 메뉴">
            <button
              type="button"
              onClick={() => setActiveTab('workspace')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'workspace'
                  ? 'border-blue-600 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              침대 각도 조절
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'matrix'
                  ? 'border-blue-600 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              각도별 효과표
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('records')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'records'
                  ? 'border-blue-600 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              간호 기록함
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('prd')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'prd'
                  ? 'border-blue-600 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              기획서 (PRD)
            </button>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setIsNewBedOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              환자 추가
            </button>
          </div>
        </div>
      </header>

      {/* A. 위쪽: 모든 탭 상단 고정 위험 알림 영역 (위험 알림 전체 표시 · 일반 알림만 +N 접기) */}
      <GlobalCriticalAlertZone
        activePatientId={activePatient.id}
        criticalAlerts={criticalAlerts}
        normalAlerts={normalAlerts}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onSelectPatientAndGoWorkspace={(id) => {
          setSelectedPatientId(id);
          setActiveTab('workspace');
        }}
        onNotifyDoctorCritical={(pt) => handleNotifyDoctorCritical(pt)}
        onSubmitDoctorOrder={(pt, note, hob) => handleSubmitDoctorOrder(pt, note, hob)}
        onSubmitRecheck={(pt, mode, vitals) => handleSubmitCriticalRecheck(pt, mode, vitals)}
        onApplyCriticalRecommendedAngle={(pt, targetHob, revTilt) =>
          handleApplyAngleForPatient(pt, targetHob, revTilt, undefined, { allowUndo: true })
        }
        onToggleSafetyConfirmed={handleToggleSafetyConfirmed}
        onAcknowledgeNormalAngle={(patientId, angleKey) =>
          setAcknowledgedAngleKeys((prev) => ({ ...prev, [patientId]: angleKey }))
        }
        onApplyNormalAngle={(pt, targetAngle, targetRevTilt, angleKey) =>
          handleApplyAngleForPatient(pt, targetAngle, targetRevTilt, angleKey, {
            allowUndo: true,
          })
        }
        onApplyRepositionFromAlert={(pt, tilt, isCritOverride) =>
          applyLateralTiltForPatient(
            pt,
            tilt,
            isCritOverride ? '1.5배 지연 의료진 확인' : '상단 알림 적용'
          )
        }
        onHoldReposition={handleHoldRepositionForPatient}
        onHeightChange={setTopAlertHeight}
      />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'workspace' && (
          <WardBedWorkspace
            patients={patients}
            activePatient={activePatient}
            onSelectPatient={setSelectedPatientId}
            onUpdatePatient={handleUpdatePatient}
            onUpdateField={handleUpdateField}
            onUpdateCustomRepositionInterval={handleUpdateCustomRepositionInterval}
            virtualMode={virtualMode}
            onToggleVirtualMode={() => {
              setVirtualMode((v) => !v);
              setLastSimRecoveryBadge(null);
            }}
            timeFlowPlaying={timeFlowPlaying}
            onToggleTimeFlow={handleToggleTimeFlow}
            timeSpeed={timeSpeed}
            onChangeTimeSpeed={setTimeSpeed}
            stoppedByAlertNotice={stoppedByAlertNotice}
            onAdvanceTime={(mins) => advanceTimeBy(mins)}
            timeEvents={timeEvents}
            recheckPanelOpen={recheckPanelOpen}
            onToggleRecheckPanel={(open) =>
              setRecheckPanelOpen((prev) => (open !== undefined ? open : !prev))
            }
            recheckInputs={recheckInputs}
            onChangeRecheckInputs={setRecheckInputs}
            orderNoteInput={orderNoteInput}
            onChangeOrderNote={setOrderNoteInput}
            orderHobInput={orderHobInput}
            onChangeOrderHob={setOrderHobInput}
            lastSimRecoveryBadge={lastSimRecoveryBadge}
            onNotifyDoctorCritical={(pt) => handleNotifyDoctorCritical(pt)}
            onSubmitDoctorOrder={(pt, note, hob) => handleSubmitDoctorOrder(pt, note, hob)}
            onSubmitCriticalRecheck={(pt, mode, vitals) =>
              handleSubmitCriticalRecheck(pt, mode, vitals)
            }
            onApplyAngle={(pt, targetHob, revTilt) =>
              handleApplyAngleForPatient(pt, targetHob, revTilt, undefined, { allowUndo: true })
            }
            onToggleSafetyConfirmed={handleToggleSafetyConfirmed}
            onTriggerCriticalDemo={triggerCriticalDemo}
            onRequestReset={() => setResetConfirmOpen(true)}
            stickyTopOffsetPx={topStickyOffset}
          />
        )}
        {activeTab === 'matrix' && <AngleMatrixTable />}
        {activeTab === 'records' && <EmrRecordsView records={emrRecords} />}
        {activeTab === 'prd' && <PrdViewer stickyTopOffsetPx={topStickyOffset + 6} />}
      </main>

      <NewBedModal
        open={isNewBedOpen}
        onClose={() => setIsNewBedOpen(false)}
        onCreate={handleCreatePatient}
      />

      {/* 체험 도구 플로팅 버튼 & 슬라이드 패널 (하단 바 위쪽에 겹치지 않게 위치) */}
      <PracticeToolsDrawer
        activePatient={activePatient}
        effectiveCriticalAlert={activeEffCrit}
        criticalDoctorNotified={isDoctorNotifiedFor(activePatient)}
        bottomOffsetPx={bottomBarHeight + 12}
        isSafetyConfirmed={Boolean(activeEffCrit.safetyChangeConfirmed)}
        onToggleSafetyConfirmed={(confirmed) =>
          handleToggleSafetyConfirmed(activePatient, confirmed)
        }
        onRequestReset={() => setResetConfirmOpen(true)}
        onApplyPreset={handleApplyPresetFromPractice}
        onNotifyDoctorCritical={(pt, isPractice) => handleNotifyDoctorCritical(pt, isPractice)}
        orderNoteInput={orderNoteInput}
        onChangeOrderNote={setOrderNoteInput}
        orderHobInput={orderHobInput}
        onChangeOrderHob={setOrderHobInput}
        onSubmitDoctorOrder={(isPractice) =>
          handleSubmitDoctorOrder(activePatient, orderNoteInput, orderHobInput, isPractice)
        }
        recheckInputs={recheckInputs}
        onChangeRecheckInputs={setRecheckInputs}
        onSubmitRecheck={(mode, isPractice) =>
          handleSubmitCriticalRecheck(activePatient, mode, recheckInputs, isPractice)
        }
        onApplyAngleFromPractice={(targetHob, confirmedCritical) =>
          handleApplyAngleForPatient(activePatient, targetHob, 0, undefined, {
            isPractice: true,
            criticalConfirmedOverride: confirmedCritical,
            allowUndo: true,
          })
        }
      />

      {/* '처음으로' 초기화 확인 모달 */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-confirm-title"
            className="w-full max-w-sm bg-white border border-slate-200 rounded-lg shadow-xl p-5 space-y-4"
          >
            <div className="space-y-1.5">
              <h3 id="reset-confirm-title" className="text-base font-bold text-slate-900">
                처음 상태로 초기화할까요?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                모든 환자의 수치, 체위변경 타이머, 그리고 간호 기록함의 체험 기록이 모두
                초기화됩니다.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  setResetConfirmOpen(false);
                  handleResetAllToInitial();
                }}
                className="px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md cursor-pointer"
              >
                초기화 확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3초 토스트 (하단 바 + 체험 도구 버튼과 겹치지 않게 위쪽 배치 · 되돌리기 지원) */}
      {toastState && (
        <div
          role="status"
          aria-live="polite"
          style={{ bottom: `${bottomBarHeight + 66}px` }}
          className="fixed right-4 sm:right-5 z-40 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg border border-slate-700 shadow-lg flex items-center gap-2.5 max-w-md"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="leading-snug">{toastState.message}</span>
          {toastState.onUndo && (
            <button
              type="button"
              onClick={() => {
                const fn = toastState.onUndo;
                setToastState(null);
                fn?.();
              }}
              className="px-2 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white rounded shrink-0 cursor-pointer"
            >
              {toastState.undoLabel ?? '되돌리기'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setToastState(null)}
            aria-label="알림 닫기"
            className="text-slate-400 hover:text-white shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* B. 아래쪽: 모든 탭 하단 고정 체위변경 빠른 조작 바 */}
      <QuickRepositionBar
        activePatient={activePatient}
        onQuickReposition={(pt, tilt) => applyLateralTiltForPatient(pt, tilt, '하단 빠른 조작')}
        onQuickAngle={(pt, targetHob) =>
          handleApplyAngleForPatient(pt, targetHob, 0, undefined, { allowUndo: true })
        }
        onToggleSafetyConfirmed={handleToggleSafetyConfirmed}
        onHeightChange={setBottomBarHeight}
      />

      <footer
        className="bg-white border-t border-slate-200 mt-10"
        style={{ paddingBottom: `${bottomBarHeight + 16}px` }}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            스마트 침대 각도 관리 · 표시된 모든 환자와 생체 수치는 교육·테스트용 가상 데이터입니다
          </div>
          <div>실제 환자에게 적용할 때는 반드시 담당 간호사 확인 및 의료진 보고가 필요합니다</div>
        </div>
      </footer>
    </div>
  );
}

export default App;
