"use client";

import React from "react";
import { Button } from "@/components/ui/button";

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
      {/* 1. 합의 지수 & 긴장도 매트릭스 (전시장 센서 패널) */}
      <div className="bg-zinc-950 border border-zinc-800/80 p-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-900 mb-2.5">
          <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 uppercase">
            INDEX // CONSENSUS
          </span>
          <span className="text-xs font-mono font-bold text-lime-400">
            {String(consensusRate).padStart(2, "0")}%
          </span>
        </div>

        {/* 얇은 극세사 인디케이터 바 */}
        <div className="w-full bg-zinc-900 h-1 mb-3 overflow-hidden">
          <div
            className="bg-lime-400 h-full transition-all duration-700 ease-out"
            style={{ width: `${consensusRate}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-zinc-500 uppercase">DISCOURSE STAGE</span>
          <span className="text-zinc-300 uppercase tracking-wide">
            [ {tensionStatus.label} ]
          </span>
        </div>
      </div>

      {/* 2. 크로노미터 시계 & 볼드 액션 버튼 */}
      <div className="bg-zinc-950 border border-zinc-800/80 p-4 flex flex-col items-center text-center">
        <div className="w-full flex items-center justify-between pb-2 border-b border-zinc-900 mb-3">
          <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 uppercase">
            CHRONO // REMAINING
          </span>
          {isDebating && (
            <span className="inline-flex items-center gap-1 text-[9px] font-mono text-lime-400 uppercase">
              <span className="w-1.5 h-1.5 bg-lime-400 animate-ping"></span>
              ACTIVE
            </span>
          )}
        </div>

        {/* 거대한 타이포그래피 시계 */}
        <div className="text-5xl font-mono font-light tracking-tighter text-zinc-100 my-1">
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </div>

        {/* 미니멀 타임라인 */}
        <div className="w-full bg-zinc-900 h-0.5 my-3">
          <div
            className="bg-zinc-400 h-full transition-all duration-300"
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
                    ? "bg-zinc-200 text-black border-zinc-200 font-bold"
                    : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600"
                }`}
              >
                0{m}M
              </button>
            ))}
          </div>
        )}

        {/* 조작 버튼 묶음 (아방가르드 스타일) */}
        <div className="w-full flex flex-col gap-1.5">
          {!isDebating ? (
            <button
              type="button"
              onClick={onStart}
              className="w-full py-3 bg-zinc-100 hover:bg-white text-black font-mono font-bold text-xs uppercase tracking-widest transition-all"
            >
              [ INITIATE DISCOURSE ]
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onTogglePause}
                className="w-full py-2 border border-zinc-700 hover:border-zinc-400 text-zinc-300 font-mono text-xs uppercase tracking-wider transition-colors"
              >
                {isPaused ? "[ RESUME ]" : "[ SUSPEND ]"}
              </button>
              <button
                type="button"
                onClick={onFinishAndSummarize}
                className="w-full py-2 bg-rose-950/40 border border-rose-800/80 hover:bg-rose-900/60 text-rose-300 font-mono text-xs uppercase tracking-wider transition-colors"
              >
                [ TERMINATE & COMPILE ]
              </button>
            </>
          )}

          {!isDebating && messagesCount > 2 && !hasSummary && (
            <button
              type="button"
              onClick={onFinishAndSummarize}
              className="w-full py-2 border border-zinc-700 hover:border-zinc-400 text-zinc-300 font-mono text-xs uppercase tracking-wider transition-colors"
            >
              [ COMPILE SUMMARY ]
            </button>
          )}

          <button
            type="button"
            onClick={onReset}
            className="w-full py-1.5 text-zinc-600 hover:text-zinc-400 font-mono text-[10px] uppercase tracking-widest mt-1 transition-colors"
          >
            RESET ALL
          </button>
        </div>
      </div>
    </div>
  );
}