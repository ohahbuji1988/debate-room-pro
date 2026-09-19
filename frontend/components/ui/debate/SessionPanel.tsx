"use client";

import React from "react";

interface SessionPanelProps {
  consensusRate: number;
  tensionStatus: { label: string; color: string };
  mins: number;
  secs: number;
  progress: number;
  sessionMin: number;
  setSessionMin: (m: number) => void;
  setTimeLeft: (s: number) => void;
  isDebating: boolean;
  isPaused: boolean;
  onTogglePause: () => void;
  onStart: () => void;
  onFinishAndSummarize: () => void;
  onReset: () => void;
  messagesCount: number;
  hasSummary: boolean;
}

export function SessionPanel({
  consensusRate,
  tensionStatus,
  mins,
  secs,
  progress,
  sessionMin,
  setSessionMin,
  setTimeLeft,
  isDebating,
  isPaused,
  onTogglePause,
  onStart,
  onFinishAndSummarize,
  onReset,
  messagesCount,
  hasSummary,
}: SessionPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* 1. 합의 지수 & 긴장도 매트릭스 카드 */}
      <div className="bg-white border border-stone-300/80 p-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200 mb-2.5">
          <span className="text-[9px] font-mono tracking-[0.2em] text-stone-500 uppercase">
            INDEX // CONSENSUS
          </span>
          <span className="text-xs font-mono font-bold text-stone-900">
            {String(consensusRate).padStart(2, "0")}%
          </span>
        </div>

        {/* 얇은 인디케이터 바 */}
        <div className="w-full bg-stone-100 h-1.5 mb-3 overflow-hidden border border-stone-200">
          <div
            className="bg-stone-900 h-full transition-all duration-700 ease-out"
            style={{ width: `${consensusRate}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-stone-500 uppercase">DISCOURSE STAGE</span>
          <span className="text-stone-900 font-bold uppercase tracking-wide">
            [ {tensionStatus.label} ]
          </span>
        </div>
      </div>

      {/* 2. 크로노미터 시계 카드 */}
      <div className="bg-white border border-stone-300/80 p-5 flex flex-col items-center text-center shadow-sm">
        <div className="w-full flex items-center justify-between pb-2 border-b border-stone-200 mb-3">
          <span className="text-[9px] font-mono tracking-[0.2em] text-stone-500 uppercase">
            CHRONO // REMAINING
          </span>
          {isDebating && (
            <span className="inline-flex items-center gap-1 text-[9px] font-mono text-stone-900 uppercase font-bold">
              <span className="w-1.5 h-1.5 bg-stone-900 animate-ping"></span>
              RUNNING
            </span>
          )}
        </div>

        {/* 타이포그래피 시계 */}
        <div className="text-5xl font-mono font-light tracking-tighter text-stone-900 my-1">
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </div>

        {/* 타임라인 바 */}
        <div className="w-full bg-stone-100 h-1 my-3.5 border border-stone-200">
          <div
            className="bg-stone-800 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* 회의 시간 선택기 */}
        {!isDebating && (
          <div className="flex items-center gap-1 mb-4">
            {[1, 3, 5].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setSessionMin(m);
                  setTimeLeft(m * 60);
                }}
                className={`px-3 py-0.5 text-[10px] font-mono transition-colors border ${
                  sessionMin === m
                    ? "bg-stone-900 text-white border-stone-900 font-bold"
                    : "bg-white text-stone-600 border-stone-300 hover:border-stone-600"
                }`}
              >
                0{m}M
              </button>
            ))}
          </div>
        )}

        {/* 볼드 액션 버튼 */}
        <div className="w-full flex flex-col gap-1.5">
          {!isDebating ? (
            <button
              type="button"
              onClick={onStart}
              className="w-full py-3 bg-stone-900 hover:bg-black text-white font-mono font-bold text-xs uppercase tracking-widest transition-all shadow-sm"
            >
              [ INITIATE DISCOURSE ]
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onTogglePause}
                className="w-full py-2 border border-stone-400 hover:border-stone-900 text-stone-900 font-mono text-xs uppercase tracking-wider transition-colors"
              >
                {isPaused ? "[ RESUME ]" : "[ SUSPEND ]"}
              </button>
              <button
                type="button"
                onClick={onFinishAndSummarize}
                className="w-full py-2 bg-stone-100 border border-stone-300 hover:bg-stone-200 text-stone-900 font-mono text-xs uppercase tracking-wider transition-colors"
              >
                [ TERMINATE & COMPILE ]
              </button>
            </>
          )}

          {!isDebating && messagesCount > 2 && !hasSummary && (
            <button
              type="button"
              onClick={onFinishAndSummarize}
              className="w-full py-2 border border-stone-300 hover:border-stone-900 text-stone-800 font-mono text-xs uppercase tracking-wider transition-colors"
            >
              [ COMPILE SUMMARY ]
            </button>
          )}

          <button
            type="button"
            onClick={onReset}
            className="w-full py-1.5 text-stone-400 hover:text-stone-700 font-mono text-[10px] uppercase tracking-widest mt-1 transition-colors"
          >
            RESET ALL
          </button>
        </div>
      </div>
    </div>
  );
}