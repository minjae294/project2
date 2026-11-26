import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import {
  EmrNursingRecord,
  formatCriticalCategoryKo,
  formatTiltKo,
} from '../data/protocolData';

interface EmrRecordsViewProps {
  records: EmrNursingRecord[];
}

type PeriodFilter = 'all' | '1h' | 'today' | '7d';

export const EmrRecordsView: React.FC<EmrRecordsViewProps> = ({ records }) => {
  const [bedFilter, setBedFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [expandedEpisodeIds, setExpandedEpisodeIds] = useState<Record<string, boolean>>({});

  const bedOptions = Array.from(new Set(records.map((r) => r.bedNumber)));
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();

  const filtered = records.filter((r) => {
    if (bedFilter !== 'all' && r.bedNumber !== bedFilter) return false;
    if (periodFilter === 'all') return true;
    const recMs = r.createdAtMs ?? now;
    if (periodFilter === '1h') return now - recMs <= 60 * 60 * 1000;
    if (periodFilter === 'today') return recMs >= startOfTodayMs;
    if (periodFilter === '7d') return now - recMs <= 7 * 24 * 60 * 60 * 1000;
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedEpisodeIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDownloadCsv = () => {
    const header = [
      '기록시각',
      '체험여부',
      '병실',
      '환자',
      '기록유형',
      '이전각도',
      '변경된각도',
      '무릎받침',
      '침대전체기울기',
      '돌아눕기',
      '체위변경_이전자세',
      '체위변경_새자세',
      '이전자세_유지시간(분)',
      '보류여부',
      '보류횟수',
      '보류사유',
      '변경전호흡수',
      '변경전맥박',
      '변경전산소포화도',
      '변경전혈압',
      '안정후호흡수',
      '안정후맥박',
      '안정후산소포화도',
      '안정후혈압',
      '타임라인요약',
      '판정결과',
    ];
    const rows = filtered.map((r) => {
      const timelineSummary = r.criticalEpisodeMeta
        ? r.criticalEpisodeMeta.timeline
            .map((t) => `[${t.clockLabel}] ${t.title}: ${t.detail}`)
            .join(' | ')
        : '-';
      return [
        r.timestamp,
        r.isPractice ? '체험' : '일반',
        r.bedNumber,
        r.patientName,
        r.criticalEpisodeMeta
          ? `위험대응에피소드(${r.criticalEpisodeMeta.statusLabel})`
          : r.repositionMeta
            ? r.repositionMeta.isDelay
              ? '체위변경지연'
              : '체위변경'
            : '각도조절',
        `${r.prevHob}°`,
        `${r.appliedHob}°`,
        `${r.kneeGatch}°`,
        `${r.revTilt}°`,
        formatTiltKo(r.lateralTilt),
        r.repositionMeta ? formatTiltKo(r.repositionMeta.prevTilt) : '-',
        r.repositionMeta ? formatTiltKo(r.repositionMeta.newTilt) : '-',
        r.repositionMeta ? `${r.repositionMeta.maintainedMinutes}` : '-',
        r.repositionMeta
          ? r.repositionMeta.isDelay
            ? `지연 ${r.repositionMeta.delayMinutes ?? 0}분`
            : r.repositionMeta.isHold
              ? '보류'
              : '체위변경'
          : '-',
        r.repositionMeta?.holdCount ?? '-',
        r.repositionMeta?.holdReason ? `"${r.repositionMeta.holdReason.replace(/"/g, '""')}"` : '-',
        r.preVitals.rr,
        r.preVitals.hr,
        r.preVitals.spo2,
        r.preVitals.bp,
        r.postVitals?.rr ?? '-',
        r.postVitals?.hr ?? '-',
        r.postVitals?.spo2 ?? '-',
        r.postVitals?.bp ?? '-',
        `"${timelineSummary.replace(/"/g, '""')}"`,
        `"${r.verdict.replace(/"/g, '""')}"`,
      ];
    });
    const csv = '\uFEFF' + [header.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '간호기록_침대각도_체위변경_위험대응.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const stepBadgeLabel: Record<'alert' | 'order' | 'recheck' | 'outcome', string> = {
    alert: '1. 알림',
    order: '2. 지시',
    recheck: '3. 재측정',
    outcome: '4. 결과',
  };

  const stepBadgeClass: Record<'alert' | 'order' | 'recheck' | 'outcome', string> = {
    alert: 'bg-red-100 text-red-800 border-red-200',
    order: 'bg-blue-100 text-blue-800 border-blue-200',
    recheck: 'bg-amber-100 text-amber-900 border-amber-200',
    outcome: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-medium text-slate-500">
            위험 대응 에피소드(알림 → 지시 → 재측정 → 결과) · 각도 조절 · 체위변경(몸 돌리기) 기록
          </p>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            간호 기록함
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={bedFilter}
            onChange={(e) => setBedFilter(e.target.value)}
            aria-label="병실별 보기"
            className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="all">전체 병실 ({records.length})</option>
            {bedOptions.map((bed) => (
              <option key={bed} value={bed}>
                {bed}
              </option>
            ))}
          </select>

          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
            aria-label="기간별 보기"
            className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="all">전체 기간</option>
            <option value="1h">최근 1시간</option>
            <option value="today">오늘</option>
            <option value="7d">최근 7일</option>
          </select>

          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV 저장</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-2">
          <div className="text-sm font-semibold text-slate-900">조건에 맞는 간호 기록이 없습니다</div>
          <p className="text-xs text-slate-500">
            추천 각도 적용, 체위변경(몸 돌리기), 위험 재측정을 실행하면 자동으로 기록됩니다.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">기록 시간</th>
                  <th className="py-3 px-4">병실 · 환자</th>
                  <th className="py-3 px-4">구분 · 각도 / 체위</th>
                  <th className="py-3 px-4">진행 상태 · 타임라인</th>
                  <th className="py-3 px-4">발생 / 변경 전</th>
                  <th className="py-3 px-4">최근 / 변경 후</th>
                  <th className="py-3 px-4">요약 결과</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((rec) => {
                  const ep = rec.criticalEpisodeMeta;
                  const isExpanded = Boolean(expandedEpisodeIds[rec.id]);

                  return (
                    <React.Fragment key={rec.id}>
                      <tr
                        onClick={ep ? () => toggleExpand(rec.id) : undefined}
                        className={`align-top transition-colors ${
                          ep
                            ? 'bg-red-50/30 hover:bg-red-50/60 cursor-pointer'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                          <span>{rec.timestamp}</span>
                          {rec.isPractice && (
                            <span className="ml-1.5 inline-block font-sans text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5">
                              체험
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-900">{rec.bedNumber}</span>
                          <span className="text-slate-400 mx-1">·</span>
                          <span className="text-slate-700">{rec.patientName}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums text-slate-900">
                          {ep ? (
                            <div className="space-y-0.5">
                              <span className="font-sans font-bold text-red-700">
                                ✖ 위험 대응 에피소드
                              </span>
                              <div className="font-sans text-[11px] text-slate-600">
                                항목:{' '}
                                {ep.riskCategories.map(formatCriticalCategoryKo).join(', ') ||
                                  '위험 수치'}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                각도 {rec.prevHob}° → {rec.appliedHob}°
                              </div>
                            </div>
                          ) : rec.repositionMeta ? (
                            <div>
                              {rec.repositionMeta.isDelay ? (
                                <>
                                  <span className="font-sans font-semibold text-red-700">
                                    ▲ {formatTiltKo(rec.repositionMeta.prevTilt)} 유지 중
                                  </span>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    등받이 {rec.appliedHob}° · 무릎 {rec.kneeGatch}°
                                  </div>
                                </>
                              ) : (
                                <>
                                  <span className="text-slate-600">
                                    {formatTiltKo(rec.repositionMeta.prevTilt)}
                                  </span>{' '}
                                  →{' '}
                                  <strong className="text-blue-700">
                                    {formatTiltKo(rec.repositionMeta.newTilt)}
                                  </strong>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    등받이 {rec.appliedHob}° · 무릎 {rec.kneeGatch}°
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <>
                              {rec.prevHob}° →{' '}
                              <strong className="text-blue-700">
                                {rec.revTilt > 0 ? `전체 +${rec.revTilt}°` : `${rec.appliedHob}°`}
                              </strong>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                무릎 {rec.kneeGatch}° · {formatTiltKo(rec.lateralTilt)}
                              </div>
                            </>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {ep ? (
                            <div className="space-y-1">
                              <div
                                className={`font-semibold ${
                                  ep.statusLabel.includes('종료')
                                    ? 'text-emerald-700'
                                    : ep.statusLabel.includes('지속 관찰')
                                      ? 'text-amber-800'
                                      : 'text-red-700'
                                }`}
                              >
                                {ep.statusLabel}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(rec.id);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
                              >
                                <span>
                                  타임라인 {ep.timeline.length}단계{' '}
                                  {isExpanded ? '접기' : '펼치기'}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : rec.repositionMeta ? (
                            <div className="space-y-0.5">
                              <div className="font-mono tabular-nums">
                                유지 {rec.repositionMeta.maintainedMinutes}분
                              </div>
                              <div
                                className={`text-[11px] font-semibold ${
                                  rec.repositionMeta.isDelay
                                    ? 'text-red-700'
                                    : rec.repositionMeta.isHold
                                      ? 'text-amber-700'
                                      : 'text-emerald-700'
                                }`}
                              >
                                {rec.repositionMeta.isDelay
                                  ? `체위변경 지연 ${rec.repositionMeta.delayMinutes ?? 0}분`
                                  : rec.repositionMeta.isHold
                                    ? `보류 (${rec.repositionMeta.holdCount ?? 1}회)`
                                    : '체위변경 적용'}
                              </div>
                              {rec.repositionMeta.holdReason && (
                                <div className="text-[11px] text-slate-500">
                                  사유: {rec.repositionMeta.holdReason}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">각도 평가</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">
                          호흡 {rec.preVitals.rr}회 · 맥박 {rec.preVitals.hr}회
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            산소 {rec.preVitals.spo2}% · 혈압 {rec.preVitals.bp}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">
                          {rec.postVitals ? (
                            <>
                              <span className="text-emerald-700 font-semibold">
                                호흡 {rec.postVitals.rr}회 · 맥박 {rec.postVitals.hr}회
                              </span>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                산소 {rec.postVitals.spo2}% · 혈압 {rec.postVitals.bp}
                              </div>
                            </>
                          ) : (
                            <span className="font-sans text-slate-400">
                              {ep
                                ? '관찰 중'
                                : rec.repositionMeta
                                  ? '즉시 기록'
                                  : `안정화 중 (${rec.stabilizationMinutes}분)`}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-800 max-w-[260px]">{rec.verdict}</td>
                      </tr>

                      {/* 요구사항 (5): 클릭 시 '알림 → 지시 → 재측정 → 결과' 타임라인 펼침 */}
                      {ep && isExpanded && (
                        <tr className="bg-slate-50/90">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="border border-slate-200 bg-white rounded-md p-4 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                <div className="text-xs font-bold text-slate-900">
                                  위험 대응 타임라인 (알림 → 지시 → 재측정 → 결과)
                                </div>
                                <div className="text-[11px] font-mono text-slate-500">
                                  시작 {ep.startedClock} · 호전 없음 누적 {ep.noImprovementCount}회 ·
                                  안정 연속 {ep.consecutiveSafeRechecks}/2회
                                </div>
                              </div>
                              <ol className="space-y-2">
                                {ep.timeline.map((step) => (
                                  <li
                                    key={step.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-l-2 border-slate-300 pl-3 py-1"
                                  >
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span
                                        className={`px-2 py-0.5 text-[11px] font-semibold rounded border ${stepBadgeClass[step.stepType]}`}
                                      >
                                        {stepBadgeLabel[step.stepType]}
                                      </span>
                                      <span className="font-mono text-[11px] text-slate-500">
                                        {step.clockLabel}
                                      </span>
                                      <span className="font-semibold text-slate-900">
                                        {step.title}
                                      </span>
                                      <span className="text-slate-700">{step.detail}</span>
                                    </div>
                                    {step.vitalsSummary && (
                                      <span className="font-mono tabular-nums text-[11px] text-slate-600 shrink-0">
                                        {step.vitalsSummary}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

