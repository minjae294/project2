import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Compass,
  FlaskConical,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  Target,
  X,
} from 'lucide-react';
import {
  CriticalAlertState,
  evaluateBedAngleProtocol,
  evaluatePatientVitalStatus,
  getPptAngleZoneSummary,
  MISSION_CASES,
  MissionCaseItem,
  PRACTICE_SCENARIO_PRESETS,
  PracticeScenarioPreset,
  simulateVitalsAtAngle,
  WardPatient,
} from '../data/protocolData';

interface PracticeToolsDrawerProps {
  activePatient: WardPatient;
  effectiveCriticalAlert: CriticalAlertState;
  criticalDoctorNotified: boolean;
  onRequestReset: () => void;
  onApplyPreset: (preset: PracticeScenarioPreset) => void;
  onNotifyDoctorCritical: (patient: WardPatient, isPractice?: boolean) => void;
  orderNoteInput: string;
  onChangeOrderNote: (val: string) => void;
  orderHobInput: number | null;
  onChangeOrderHob: (val: number | null) => void;
  onSubmitDoctorOrder: (isPractice?: boolean) => void;
  recheckInputs: { rr: number; hr: number; spo2: number };
  onChangeRecheckInputs: (next: { rr: number; hr: number; spo2: number }) => void;
  onSubmitRecheck: (mode: 'manual' | 'unchanged', isPractice?: boolean) => void;
  onApplyAngleFromPractice: (
    targetHob: number,
    confirmedCritical: boolean
  ) => void;
  bottomOffsetPx?: number;
  isSafetyConfirmed?: boolean;
  onToggleSafetyConfirmed?: (confirmed: boolean) => void;
}

type DrawerTab = 'scenario_response' | 'try_angle' | 'mission';

const DURATION_OPTIONS = [
  { minutes: 30, label: '30분' },
  { minutes: 60, label: '1시간' },
  { minutes: 120, label: '2시간' },
  { minutes: 240, label: '4시간' },
];

export const PracticeToolsDrawer: React.FC<PracticeToolsDrawerProps> = ({
  activePatient,
  effectiveCriticalAlert,
  criticalDoctorNotified,
  onRequestReset,
  onApplyPreset,
  onNotifyDoctorCritical,
  orderNoteInput,
  onChangeOrderNote,
  orderHobInput,
  onChangeOrderHob,
  onSubmitDoctorOrder,
  recheckInputs,
  onChangeRecheckInputs,
  onSubmitRecheck,
  onApplyAngleFromPractice,
  bottomOffsetPx,
  isSafetyConfirmed,
  onToggleSafetyConfirmed,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<DrawerTab>('scenario_response');

  // 각도 직접 해보기 상태
  const [tryAngle, setTryAngle] = useState<number>(activePatient.inputs.currentHob);
  const [tryDurationMin, setTryDurationMin] = useState<number>(60);
  const [localCritChecked, setLocalCritChecked] = useState<boolean>(false);
  const effectiveCritChecked = isSafetyConfirmed ?? localCritChecked;
  const setEffectiveCritChecked = (val: boolean) => {
    setLocalCritChecked(val);
    onToggleSafetyConfirmed?.(val);
  };

  // 미션 모드 상태
  const [missionIndex, setMissionIndex] = useState<number>(() =>
    Math.floor(Math.random() * MISSION_CASES.length)
  );
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState<number | null>(null);
  const [missionScore, setMissionScore] = useState<{ correct: number; total: number }>({
    correct: 0,
    total: 0,
  });

  const currentMission: MissionCaseItem = MISSION_CASES[missionIndex];
  const missionDecision = useMemo(
    () => evaluateBedAngleProtocol(currentMission.inputs),
    [currentMission]
  );

  const isChoiceCorrect = (choice: { hob: number; revTilt?: number }) => {
    if (missionDecision.reverseTrendelenburgDeg > 0) {
      return choice.hob === 0 && Boolean(choice.revTilt);
    }
    return choice.hob === missionDecision.recommendedHob && !choice.revTilt;
  };

  const handleSelectMissionChoice = (idx: number) => {
    if (selectedChoiceIdx !== null) return;
    setSelectedChoiceIdx(idx);
    const chosen = currentMission.choices[idx];
    const correct = isChoiceCorrect(chosen);
    setMissionScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNextMission = () => {
    let nextIdx = Math.floor(Math.random() * MISSION_CASES.length);
    if (MISSION_CASES.length > 1 && nextIdx === missionIndex) {
      nextIdx = (missionIndex + 1) % MISSION_CASES.length;
    }
    setMissionIndex(nextIdx);
    setSelectedChoiceIdx(null);
  };

  // 각도 직접 해보기 가상 예측
  const tryPreview = useMemo(() => {
    const baseSim = simulateVitalsAtAngle(activePatient.inputs, tryAngle);
    let rr = baseSim.rr;
    let hr = baseSim.hr;
    let spo2 = baseSim.spo2;
    let sbp = baseSim.sbp;
    let dbp = baseSim.dbp;

    if (tryDurationMin >= 120) {
      if (tryAngle < 15) {
        rr = Math.min(34, rr + (tryDurationMin >= 240 ? 3 : 2));
        spo2 = Math.max(85, spo2 - (tryDurationMin >= 240 ? 2 : 1));
      } else if (tryAngle >= 60) {
        hr = Math.min(142, hr + (tryDurationMin >= 240 ? 8 : 4));
        if (activePatient.inputs.orthostaticHistory || tryDurationMin >= 240) {
          sbp = Math.max(78, sbp - 8);
          dbp = Math.max(48, dbp - 4);
        }
      }
    }

    const simulatedInputs = {
      ...activePatient.inputs,
      rr,
      hr,
      spo2,
      sbp,
      dbp,
      currentHob: tryAngle,
    };
    const vitalStatus = evaluatePatientVitalStatus(simulatedInputs);
    const zoneSummary = getPptAngleZoneSummary(tryAngle, tryDurationMin);

    return { rr, hr, spo2, sbp, dbp, vitalStatus, zoneSummary };
  }, [activePatient.inputs, tryAngle, tryDurationMin]);

  const activeVitalStatus = evaluatePatientVitalStatus(activePatient.inputs);
  const isCriticalActive =
    activeVitalStatus.level === 'critical' ||
    (effectiveCriticalAlert.stage !== 'idle' && effectiveCriticalAlert.stage !== 'resolved');

  return (
    <>
      {/* 오른쪽 아래 플로팅 '체험 도구' 버튼 (하단 체위변경 바와 겹치지 않도록 동적 오프셋 적용) */}
      {!isOpen && (
        <button
          type="button"
          style={{ bottom: `${bottomOffsetPx ?? 88}px` }}
          onClick={() => {
            setTryAngle(activePatient.inputs.currentHob);
            setIsOpen(true);
          }}
          className="fixed right-4 sm:right-5 z-30 inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-full shadow-lg border border-slate-700 transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <FlaskConical className="w-4 h-4 text-blue-400" />
          <span>체험 도구</span>
        </button>
      )}

      {/* 열렸을 때 사이드 패널 (기본 닫힘 · 닫으면 메인 화면 유지) */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/20"
            aria-hidden="true"
            onClick={() => setIsOpen(false)}
          />

          <aside
            role="dialog"
            aria-label="체험 도구"
            className="relative z-50 w-full max-w-[460px] h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col"
          >
            {/* 패널 상단 헤더 */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50">
              <div>
                <div className="text-[11px] font-semibold text-blue-700">교육용 가상 체험</div>
                <h2 className="text-base font-bold text-slate-900">
                  체험 도구 ({activePatient.bedNumber} {activePatient.patientName})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="체험 도구 닫기"
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 패널 내부 3개 탭 */}
            <div className="px-4 py-2.5 border-b border-slate-200 bg-white">
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('scenario_response')}
                  className={`py-1.5 px-2 rounded-md font-semibold flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === 'scenario_response'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>상황 · 재측정</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('try_angle')}
                  className={`py-1.5 px-2 rounded-md font-semibold flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === 'try_angle'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>각도 해보기</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('mission')}
                  className={`py-1.5 px-2 rounded-md font-semibold flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === 'mission'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>미션 모드</span>
                </button>
              </div>
            </div>

            {/* 스크롤 본문 */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {activeTab === 'scenario_response' && (
                <>
                  {/* (3) 상황 만들기 (프리셋) */}
                  <section className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900">상황 만들기 (프리셋)</h3>
                      <span className="text-[11px] text-slate-500">
                        선택 환자에 즉시 반영
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {PRACTICE_SCENARIO_PRESETS.map((preset) => {
                        const isDanger =
                          preset.id === 'hf_worsen' ||
                          preset.id === 'tachycardia' ||
                          preset.id === 'hypoxia' ||
                          preset.id === 'hypotension';
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              onApplyPreset(preset);
                              setLocalCritChecked(false);
                            }}
                            className={`text-left p-2.5 rounded-md border transition-colors cursor-pointer ${
                              preset.id === 'normal'
                                ? 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50'
                                : isDanger
                                  ? 'bg-red-50/50 border-red-200 hover:bg-red-50'
                                  : 'bg-amber-50/60 border-amber-200 hover:bg-amber-50'
                            }`}
                          >
                            <div className="font-bold text-slate-900">{preset.label}</div>
                            <div className="text-[11px] text-slate-600 mt-0.5 truncate">
                              {preset.shortDesc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  {/* 재측정 · 처치 입력 */}
                  <section className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        재측정 · 처치 입력
                      </h3>
                      <span
                        className={`text-[11px] font-bold ${
                          isCriticalActive ? 'text-red-700' : 'text-emerald-700'
                        }`}
                      >
                        현재: {activeVitalStatus.label}
                      </span>
                    </div>

                    {effectiveCriticalAlert.stage === 'alert_required' && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md space-y-2">
                        <div className="font-bold text-red-900 flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 shrink-0" />
                          <span>위험 수치 감지 — 먼저 의료진에게 알려주세요</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onNotifyDoctorCritical(activePatient, true)}
                          className="w-full py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md cursor-pointer"
                        >
                          의료진에게 알리기
                        </button>
                      </div>
                    )}

                    {(effectiveCriticalAlert.stage === 'awaiting_order' ||
                      effectiveCriticalAlert.stage === 'observing' ||
                      effectiveCriticalAlert.stage === 'continuous_observation') && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-md space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold text-amber-950">의료진 지시·처치 입력</div>
                          <button
                            type="button"
                            onClick={() => onChangeOrderNote('산소 투여, 15분 후 재측정')}
                            className="px-2 py-0.5 text-[11px] font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded cursor-pointer"
                          >
                            시연용 입력
                          </button>
                        </div>
                        <input
                          type="text"
                          value={orderNoteInput}
                          onChange={(e) => onChangeOrderNote(e.target.value)}
                          placeholder="처치 내용 메모 입력"
                          aria-label="체험 패널 처치 내용"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
                        />
                        <div className="flex flex-wrap items-center gap-1">
                          {[null, 15, 30, 45, 60].map((deg) => (
                            <button
                              key={deg === null ? 'keep' : deg}
                              type="button"
                              onClick={() => onChangeOrderHob(deg)}
                              className={`px-2 py-1 font-mono rounded border cursor-pointer ${
                                orderHobInput === deg
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-white text-slate-700 border-slate-300'
                              }`}
                            >
                              {deg === null ? '각도 유지' : `${deg}°`}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => onSubmitDoctorOrder(true)}
                            className="ml-auto px-3 py-1 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded cursor-pointer"
                          >
                            의료진 지시 입력
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2.5">
                      <div className="text-[11px] font-semibold text-slate-700">
                        재측정 수치 직접 입력 (호전/유지/악화 판정)
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-600 mb-1">
                            호흡수(회)
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
                            className="w-full px-2 py-1 font-mono tabular-nums bg-white border border-slate-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-600 mb-1">
                            맥박수(회)
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
                            className="w-full px-2 py-1 font-mono tabular-nums bg-white border border-slate-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-600 mb-1">
                            산소(%)
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
                            className="w-full px-2 py-1 font-mono tabular-nums bg-white border border-slate-300 rounded"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSubmitRecheck('manual', true)}
                          className="flex-1 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer"
                        >
                          재측정 입력
                        </button>
                        <button
                          type="button"
                          disabled={
                            effectiveCriticalAlert.stage !== 'observing' &&
                            effectiveCriticalAlert.stage !== 'continuous_observation'
                          }
                          onClick={() => onSubmitRecheck('unchanged', true)}
                          className="px-3 py-2 font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-md cursor-pointer"
                        >
                          변화 없음
                        </button>
                      </div>
                    </div>
                  </section>

                  {/* 초기화 */}
                  <section className="pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        onRequestReset();
                        setLocalCritChecked(false);
                      }}
                      className="w-full py-2 px-3 inline-flex items-center justify-center gap-1.5 font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>초기화 (처음 상태로)</span>
                    </button>
                  </section>
                </>
              )}

              {activeTab === 'try_angle' && (
                <section className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">각도 직접 해보기</h3>
                    <p className="text-[11px] text-slate-500">
                      가상 시뮬레이션이며 실제와 다를 수 있음 (각도별 효과표 기준)
                    </p>
                  </div>

                  {/* 등받이 각도 슬라이더 */}
                  <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">등받이 각도 선택</span>
                      <span className="font-mono tabular-nums text-base font-bold text-blue-700">
                        {tryAngle}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={90}
                      step={5}
                      value={tryAngle}
                      aria-label="체험 각도 슬라이더"
                      onChange={(e) => setTryAngle(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex flex-wrap gap-1">
                      {[0, 15, 30, 45, 60, 75, 90].map((deg) => (
                        <button
                          key={deg}
                          type="button"
                          onClick={() => setTryAngle(deg)}
                          className={`px-2 py-1 font-mono rounded border cursor-pointer ${
                            tryAngle === deg
                              ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {deg}°
                        </button>
                      ))}
                    </div>

                    {/* 유지 시간 선택 */}
                    <div className="pt-2 border-t border-slate-200 space-y-1.5">
                      <span className="block font-semibold text-slate-800">유지 시간</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {DURATION_OPTIONS.map((opt) => (
                          <button
                            key={opt.minutes}
                            type="button"
                            onClick={() => setTryDurationMin(opt.minutes)}
                            className={`py-1.5 font-semibold rounded border cursor-pointer ${
                              tryDurationMin === opt.minutes
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 예상 가상 수치 */}
                  <div className="p-3.5 bg-white border border-slate-200 rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">예상 가상 결과</span>
                      <span
                        className={`font-bold ${
                          tryPreview.vitalStatus.level === 'critical'
                            ? 'text-red-700'
                            : tryPreview.vitalStatus.level === 'caution'
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                        }`}
                      >
                        {tryPreview.vitalStatus.glyph} {tryPreview.vitalStatus.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-mono tabular-nums text-slate-800 bg-slate-50 rounded p-2.5">
                      <div>호흡: {tryPreview.rr}회/분</div>
                      <div>맥박: {tryPreview.hr}회/분</div>
                      <div>산소: {tryPreview.spo2}%</div>
                      <div>
                        혈압: {tryPreview.sbp}/{tryPreview.dbp}
                      </div>
                    </div>
                  </div>

                  {/* PPT 각도별 효과표 기준 설명 */}
                  <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-md space-y-2">
                    <div className="font-bold text-slate-900">
                      {tryPreview.zoneSummary.zoneLabel} · {tryPreview.zoneSummary.zoneTitle}
                    </div>
                    <div className="space-y-1.5 text-slate-700 leading-relaxed">
                      <p>
                        <strong className="text-slate-900">호흡:</strong>{' '}
                        {tryPreview.zoneSummary.respirationLine}
                      </p>
                      <p>
                        <strong className="text-slate-900">맥박·혈압:</strong>{' '}
                        {tryPreview.zoneSummary.pulseLine}
                      </p>
                      <p>
                        <strong className="text-slate-900">욕창 위험:</strong>{' '}
                        {tryPreview.zoneSummary.pressureLine}
                      </p>
                    </div>
                  </div>

                  {tryPreview.zoneSummary.longDurationWarning && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-md text-amber-950 font-medium leading-relaxed">
                      {tryPreview.zoneSummary.longDurationWarning}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    {activeVitalStatus.level === 'critical' && (
                      <label className="flex items-center gap-2 text-red-900 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={effectiveCritChecked}
                          onChange={(e) => setEffectiveCritChecked(e.target.checked)}
                          className="w-4 h-4 accent-red-600 cursor-pointer"
                        />
                        <span>의료진에게 체위·각도 변경 가능 여부를 확인했습니다</span>
                      </label>
                    )}
                    <button
                      type="button"
                      disabled={
                        activeVitalStatus.level === 'critical' &&
                        (!criticalDoctorNotified || !effectiveCritChecked)
                      }
                      onClick={() => onApplyAngleFromPractice(tryAngle, effectiveCritChecked)}
                      className="w-full py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed rounded-md cursor-pointer"
                    >
                      간호사 확인 후 {tryAngle}° 환자에게 적용
                    </button>
                    {activeVitalStatus.level === 'critical' &&
                      (!criticalDoctorNotified || !effectiveCritChecked) && (
                        <p className="text-[11px] font-semibold text-red-700">
                          ※{' '}
                          {!criticalDoctorNotified
                            ? '먼저 의료진에게 알린 뒤 위 확인을 체크해야 적용됩니다.'
                            : '위 확인 체크 전까지 적용 버튼이 비활성화됩니다.'}
                        </p>
                      )}
                  </div>
                </section>
              )}

              {activeTab === 'mission' && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">미션 모드</h3>
                    <span className="font-mono tabular-nums font-bold text-blue-700">
                      점수 {missionScore.correct} / {missionScore.total}점
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                    <div className="text-[11px] font-semibold text-blue-700">
                      가상 환자 상태
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {currentMission.patientLabel}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {currentMission.summary}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-slate-900">
                      이 환자에게 맞는 각도를 골라보세요
                    </div>
                    <div className="space-y-2">
                      {currentMission.choices.map((choice, idx) => {
                        const isPicked = selectedChoiceIdx === idx;
                        const isRight = isChoiceCorrect(choice);
                        let btnStyle =
                          'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-slate-800';
                        if (selectedChoiceIdx !== null) {
                          if (isRight) {
                            btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold';
                          } else if (isPicked) {
                            btnStyle = 'bg-red-50 border-red-400 text-red-900 font-semibold';
                          } else {
                            btnStyle = 'bg-slate-50 border-slate-200 text-slate-400';
                          }
                        }

                        return (
                          <button
                            key={choice.label}
                            type="button"
                            disabled={selectedChoiceIdx !== null}
                            onClick={() => handleSelectMissionChoice(idx)}
                            className={`w-full text-left px-3.5 py-2.5 rounded-md border transition-colors cursor-pointer disabled:cursor-default ${btnStyle}`}
                          >
                            {choice.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedChoiceIdx !== null && (
                    <div
                      className={`p-3.5 rounded-md border space-y-2 ${
                        isChoiceCorrect(currentMission.choices[selectedChoiceIdx])
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                          : 'bg-amber-50 border-amber-300 text-amber-950'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          {isChoiceCorrect(currentMission.choices[selectedChoiceIdx])
                            ? '정답입니다!'
                            : '아쉽습니다 — 앱 각도 규칙 기준 정답을 확인하세요.'}
                        </span>
                      </div>
                      <div className="text-xs leading-relaxed space-y-1">
                        <p>
                          <strong>정답:</strong>{' '}
                          {missionDecision.reverseTrendelenburgDeg > 0
                            ? `등받이 0° + 침대 전체 +${missionDecision.reverseTrendelenburgDeg}° 기울기`
                            : `${missionDecision.recommendedHob}°`}{' '}
                          ({missionDecision.statusTitle})
                        </p>
                        <p>{missionDecision.shortReason}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleNextMission}
                        className="w-full py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer"
                      >
                        다음 문제 풀기
                      </button>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* 안전 규칙 안내 하단 고정 */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-600 leading-relaxed">
              교육용 가상 체험 · 가상 데이터 · 위험 시 의료진 알림 우선 · 모든 변경은 간호사 확인 후
              적용 · 실제 기준은 병원 프로토콜을 따릅니다.
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
