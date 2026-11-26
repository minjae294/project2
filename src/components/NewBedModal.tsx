import React, { useState } from 'react';
import { X } from 'lucide-react';
import { DEFAULT_CRITICAL_ALERT_STATE, WardPatient } from '../data/protocolData';

interface NewBedModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (patient: WardPatient) => void;
}

export const NewBedModal: React.FC<NewBedModalProps> = ({ open, onClose, onCreate }) => {
  const [bedNumber, setBedNumber] = useState('305호');
  const [patientName, setPatientName] = useState('');
  const [ageSex, setAgeSex] = useState('65세 / 남');
  const [diagnosis, setDiagnosis] = useState('숨참 증상 관찰');
  const [rr, setRr] = useState(22);
  const [hr, setHr] = useState(92);
  const [spo2, setSpo2] = useState(94);
  const [sbp, setSbp] = useState(126);
  const [dbp, setDbp] = useState(80);
  const [currentHob, setCurrentHob] = useState(15);
  const [enteralNutrition, setEnteralNutrition] = useState(false);
  const [spinalOrHipContraindication, setSpinalOrHipContraindication] = useState(false);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nowLabel = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const newPatient: WardPatient = {
      id: `bed-${Date.now()}`,
      bedNumber: bedNumber.trim() || '새 병실',
      patientName: patientName.trim() || '새 환자',
      ageSex: ageSex.trim() || '성인',
      diagnosis: diagnosis.trim() || '입원 환자',
      elapsedMinutes: 0,
      repositionStartedAtElapsed: 0,
      minutesSinceReposition: 0,
      customRepositionIntervalMin: null,
      lastSideTilt: 'right_30',
      repositionProposedForCycle: false,
      repositionHoldCount: 0,
      repositionSnoozeMinutesLeft: 0,
      minutesAbove45: currentHob > 45 ? 10 : 0,
      highAngleProposedForCycle: false,
      criticalAlert: DEFAULT_CRITICAL_ALERT_STATE,
      lastRepositionedLabel: '방금 추가됨',
      inputs: {
        rr,
        hr,
        spo2,
        sbp,
        dbp,
        baselineSbp: sbp,
        baselineHr: hr,
        borgScore: rr > 24 ? 5 : 2,
        painNrs: 1,
        currentHob,
        sacralSkinStatus: 'intact',
        lateralTilt: 'center',
        spinalOrHipContraindication,
        iicpRisk: false,
        enteralNutrition,
        orthostaticHistory: false,
        pressureInjuryHighRisk: false,
        heartFailureOrPulmonaryEdema: false,
        copdTargetMode: false,
      },
      history: [{ timeLabel: nowLabel, rr, hr, hob: currentHob, spo2 }],
    };
    onCreate(newPatient);
    setPatientName('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-bed-title"
    >
      <div className="bg-white border border-slate-200 rounded-lg w-full max-w-lg p-6 space-y-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 id="new-bed-title" className="text-base font-bold text-slate-900">
              새 환자 추가하기
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              기본 건강 수치와 현재 침대 각도를 입력하면 바로 관리 목록에 추가됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">병실 번호</label>
              <input
                type="text"
                required
                value={bedNumber}
                onChange={(e) => setBedNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">환자 이름</label>
              <input
                type="text"
                required
                placeholder="예: 정○○"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">나이 / 성별</label>
              <input
                type="text"
                value={ageSex}
                onChange={(e) => setAgeSex(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">현재 증상 / 병명</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">1분 호흡수</label>
              <input
                type="number"
                min={6}
                max={40}
                value={rr}
                onChange={(e) => setRr(Number(e.target.value) || 16)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">1분 맥박수</label>
              <input
                type="number"
                min={35}
                max={160}
                value={hr}
                onChange={(e) => setHr(Number(e.target.value) || 80)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">산소포화도 (%)</label>
              <input
                type="number"
                min={70}
                max={100}
                value={spo2}
                onChange={(e) => setSpo2(Number(e.target.value) || 95)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">최고 혈압</label>
              <input
                type="number"
                min={60}
                max={220}
                value={sbp}
                onChange={(e) => setSbp(Number(e.target.value) || 120)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">최저 혈압</label>
              <input
                type="number"
                min={30}
                max={140}
                value={dbp}
                onChange={(e) => setDbp(Number(e.target.value) || 80)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">현재 각도 (°)</label>
              <input
                type="number"
                min={0}
                max={90}
                value={currentHob}
                onChange={(e) => setCurrentHob(Math.max(0, Math.min(90, Number(e.target.value) || 0)))}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={enteralNutrition}
                onChange={(e) => setEnteralNutrition(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600"
              />
              <span>콧줄로 식사 중</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={spinalOrHipContraindication}
                onChange={(e) => setSpinalOrHipContraindication(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600"
              />
              <span>허리·고관절 굽힘 금지</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer"
            >
              추가하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
