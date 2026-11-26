import React, { useState } from 'react';
import { Check, Copy, Download, Search } from 'lucide-react';
import { FULL_PRD_MARKDOWN, PRD_SECTIONS } from '../data/prdContent';

interface PrdViewerProps {
  stickyTopOffsetPx?: number;
}

export const PrdViewer: React.FC<PrdViewerProps> = ({ stickyTopOffsetPx }) => {
  const [activeId, setActiveId] = useState<string>(PRD_SECTIONS[0].id);
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const filteredSections = PRD_SECTIONS.filter((sec) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const blockText = JSON.stringify(sec.blocks).toLowerCase();
    return (
      sec.title.toLowerCase().includes(q) ||
      sec.summary.toLowerCase().includes(q) ||
      blockText.includes(q)
    );
  });

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(FULL_PRD_MARKDOWN);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored cleanly
    }
  };

  const handleDownloadPrd = () => {
    const blob = new Blob([FULL_PRD_MARKDOWN], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PRD_Smart_Bed_Angle_Protocol.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const scrollToSection = (id: string) => {
    setActiveId(id);
    const el = document.getElementById(`prd-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 items-start">
      {/* Left Table of Contents */}
      <aside
        style={stickyTopOffsetPx ? { top: `${stickyTopOffsetPx}px` } : undefined}
        className="bg-white border border-slate-200 rounded-lg p-4 lg:sticky lg:top-6 space-y-4"
      >
        <div>
          <div className="text-xs font-medium text-slate-500">문서 탐색</div>
          <h2 className="text-base font-bold text-slate-900 mt-0.5">PRD 목차</h2>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="요구사항·각도 검색"
            aria-label="PRD 내용 검색"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <nav className="space-y-1" aria-label="PRD 섹션 목차">
          {PRD_SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => scrollToSection(sec.id)}
              className={`w-full text-left px-2.5 py-2 rounded-md text-xs transition-colors flex items-center gap-2 cursor-pointer ${
                activeId === sec.id
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="font-mono tabular-nums text-slate-400">{sec.number}.</span>
              <span className="truncate">{sec.title}</span>
            </button>
          ))}
        </nav>

        <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Markdown 복사됨' : 'PRD 전문 복사'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPrd}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PRD.md 파일 저장</span>
          </button>
        </div>
      </aside>

      {/* Main PRD Document Body */}
      <article className="bg-white border border-slate-200 rounded-lg p-6 md:p-8 space-y-10">
        <header className="border-b border-slate-200 pb-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Product Requirements Document</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">v1.0</span>
            <span aria-hidden="true">·</span>
            <span>기반: 1616 이민재 간호학 탐구안 확장</span>
            <span aria-hidden="true">·</span>
            <span>저장 경로: /PRD.md</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mt-2 text-balance">
            호흡·맥박 기반 스마트 병원 침대 각도 조절 프로토콜 (SBPP)
          </h1>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed mt-3 max-w-3xl">
            본 PRD는 예시 PPT의 4개 각도 구간(0°, 15~30°, 30~45°, 60~90°)과 폐루프 워크플로우를 바탕으로,
            임상 현장에서 필수적인 추가 각도(역트렌델렌부르크, 45~60° 브리지, 90° 삼각대 자세, PLR) 및
            혈압·SpO₂·금기사항·욕창 예방 가드레일을 통합 설계한 제품 요구사항 정의서입니다.
          </p>
        </header>

        {filteredSections.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            검색어 &ldquo;{query}&rdquo;와 일치하는 PRD 섹션이 없습니다.
          </div>
        ) : (
          filteredSections.map((sec) => (
            <section
              key={sec.id}
              id={`prd-${sec.id}`}
              className="scroll-mt-6 space-y-4 pb-8 border-b border-slate-100 last:border-b-0 last:pb-0"
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {sec.number}. {sec.title}
                </h2>
                <p className="text-sm text-slate-500 mt-1">{sec.summary}</p>
              </div>

              <div className="space-y-4">
                {sec.blocks.map((block, idx) => {
                  if (block.type === 'paragraph') {
                    return (
                      <p key={idx} className="text-sm md:text-[15px] text-slate-700 leading-relaxed max-w-3xl">
                        {block.text}
                      </p>
                    );
                  }
                  if (block.type === 'list') {
                    return (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        {block.title && (
                          <div className="text-xs font-semibold text-slate-700 mb-2">
                            {block.title}
                          </div>
                        )}
                        <ul className="space-y-2 text-sm text-slate-700">
                          {block.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                              <span className="font-mono text-xs text-blue-600 mt-1 shrink-0">
                                {String(i + 1).padStart(2, '0')}
                              </span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                  if (block.type === 'table') {
                    return (
                      <div key={idx} className="border border-slate-200 rounded-lg overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                              {block.headers.map((h, hIdx) => (
                                <th key={hIdx} className="py-2.5 px-3.5 whitespace-nowrap">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {block.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="align-top">
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className={`py-2.5 px-3.5 text-slate-700 ${
                                      cIdx === 0 ? 'font-medium text-slate-900 whitespace-nowrap' : ''
                                    }`}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }
                  if (block.type === 'code') {
                    return (
                      <div key={idx} className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto">
                        <div className="text-xs text-slate-400 mb-2">{block.label}</div>
                        <pre className="text-xs font-mono leading-relaxed">{block.content}</pre>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </section>
          ))
        )}
      </article>
    </div>
  );
};
