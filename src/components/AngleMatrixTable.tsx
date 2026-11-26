import React, { useState } from 'react';
import { EXPANDED_ANGLE_ZONES, AngleZone } from '../data/protocolData';

export const AngleMatrixTable: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'original' | 'added'>('all');

  const filteredZones = EXPANDED_ANGLE_ZONES.filter((zone) => {
    if (filter === 'original') return zone.source === 'PPT 원안';
    if (filter === 'added') return zone.source !== 'PPT 원안';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-medium text-slate-500">
            PPT 기본 4개 각도 + 추가로 보완한 4개 각도 한눈에 보기
          </p>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            침대 각도별 호흡·맥박 변화 및 주의사항
          </h2>
        </div>

        <div
          className="inline-flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg self-start"
          role="tablist"
          aria-label="각도 분류 필터"
        >
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            전체 8개 각도
          </button>
          <button
            type="button"
            onClick={() => setFilter('original')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'original'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PPT 기본 각도
          </button>
          <button
            type="button"
            onClick={() => setFilter('added')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'added'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            새로 추가된 각도
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-4 whitespace-nowrap">각도 · 자세 이름</th>
                <th className="py-3.5 px-4 min-w-[220px]">호흡(숨쉬기)에 미치는 영향</th>
                <th className="py-3.5 px-4 min-w-[220px]">맥박·혈압에 미치는 영향</th>
                <th className="py-3.5 px-4 min-w-[200px]">언제 사용하면 좋을까?</th>
                <th className="py-3.5 px-4 min-w-[220px]">주의할 점 · 욕창 예방</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredZones.map((zone: AngleZone) => (
                <tr key={zone.id} className="hover:bg-slate-50/70 transition-colors align-top">
                  <td className="py-4 px-4">
                    <div className="font-mono tabular-nums text-base font-bold text-blue-700">
                      {zone.angleRange}
                    </div>
                    <div className="font-semibold text-slate-900 mt-1">{zone.nameKo}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {zone.nameEn} · {zone.source}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-700 leading-relaxed">
                    {zone.respirationEffect}
                  </td>
                  <td className="py-4 px-4 text-slate-700 leading-relaxed">
                    {zone.pulseHemodynamicEffect}
                  </td>
                  <td className="py-4 px-4 text-slate-700 leading-relaxed">
                    <div>{zone.indications}</div>
                    <div className="text-xs font-mono tabular-nums text-slate-500 mt-2">
                      권장 유지 시간: {zone.maxContinuousMinutes}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-700 leading-relaxed">
                    <div>{zone.contraindicationsAndCare}</div>
                    <div className="text-xs font-mono tabular-nums text-slate-600 mt-2">
                      무릎 받침 권장: {zone.kneeGatchRecommended}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">주의사항 01</div>
          <h3 className="text-base font-semibold text-slate-900 mt-1">0° 평평하게 오래 두면</h3>
          <p className="text-sm text-slate-600 leading-relaxed mt-2">
            배 속 장기가 폐를 눌러 숨쉬기가 답답해지고, 위 내용물이 거꾸로 넘어와 폐렴(흡인성 폐렴)이 생길 위험이 커집니다.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">주의사항 02</div>
          <h3 className="text-base font-semibold text-slate-900 mt-1">60° 이상 높게 오래 세우면</h3>
          <p className="text-sm text-slate-600 leading-relaxed mt-2">
            피가 다리로 쏠려 어지럽고 혈압이 떨어질 수 있으며, 체중이 엉치뼈에 몰려 욕창이 잘 생깁니다. 무릎 받침(10~15°)을 올리고 2시간마다 옆으로 돌려주세요.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">함께 보는 지표</div>
          <h3 className="text-base font-semibold text-slate-900 mt-1">호흡·맥박 외 꼭 볼 4가지</h3>
          <p className="text-sm text-slate-600 leading-relaxed mt-2">
            산소포화도(95% 이상), 혈압(최고 90 이상), 아픈 정도(통증), 엉치뼈 피부 상태(붉어짐·상처)를 함께 확인해야 더 안전합니다.
          </p>
        </div>
      </div>
    </div>
  );
};
