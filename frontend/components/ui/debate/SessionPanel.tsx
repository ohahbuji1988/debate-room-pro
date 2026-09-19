"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
    <div className="flex flex-col gap-4">
      {/* 1. 합의율 및 긴장도 실시간 게이지 카드 */}
      <Card className="bg-zinc-950 border-zinc-800 text-zinc-100 shadow-xl">
        <CardHeader className="p-3.5 pb-2">
          <CardTitle className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>CONSENSUS & TENSION</span>
            <span className="text-xs text-blue-400 font-mono font-bold">{consensusRate}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3.5 pt-0 flex flex-col gap-2.5">
          {/* 합의율 프로그레스 바 */}
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${consensusRate}%` }}
            ></div>
          </div>

          {/* 현재 긴장도 상태 뱃지 */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-zinc-500">회의 긴장도 국면</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tensionStatus.color}`}>
              {tensionStatus.label}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 2. 세션 시계 및 제어 버튼 카드 */}
      <Card className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-zinc-800 text-zinc-100 text-center shadow-xl">
        <CardHeader className="p-3 sm:p-4 pb-1">
          <CardTitle className="text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
            SESSION CLOCK
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 flex flex-col items-center">
          {/* 째깍째깍 전자시계 디스플레이 */}
          <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tighter text-white my-1 sm:my-2">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </div>

          {/* 남은 시간 게이지 막대 */}
          <div className="w-full bg-zinc-800 h-1.5 sm:h-2 rounded-full overflow-hidden mb-3 sm:mb-4 shadow-inner">
            <div
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* 회의 시간 선택 버튼 (1분, 3분, 5분) */}
          {!isDebating && (
            <div className="flex items-center gap-1.5 mb-3 sm:mb-4">
              <span className="text-xs text-zinc-400">시간:</span>
              {[1, 3, 5].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setSessionMin(m);
                    setTimeLeft(m * 60);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                    sessionMin === m ? "bg-zinc-700 text-white" : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {m}분
                </button>
              ))}
            </div>
          )}

          {/* 조작 버튼 묶음 */}
          <div className="w-full flex flex-col gap-2">
            {!isDebating ? (
              <Button
                type="button"
                onClick={onStart}
                className="w-full rounded-full bg-blue-600 hover:bg-blue-500 font-semibold text-xs py-4 sm:py-5 shadow-lg shadow-blue-600/30"
              >
                ▶ 핑퐁 토론 시작 ({sessionMin}분)
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={onTogglePause}
                  variant="outline"
                  className="w-full rounded-full border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs"
                >
                  {isPaused ? "▶ 재개하기" : "❚❚ 일시정지"}
                </Button>
                <Button
                  type="button"
                  onClick={onFinishAndSummarize}
                  variant="destructive"
                  className="w-full rounded-full text-xs font-semibold"
                >
                  ■ 종료 & 요약 보고
                </Button>
              </>
            )}

            {!isDebating && messagesCount > 2 && !hasSummary && (
              <Button
                type="button"
                onClick={onFinishAndSummarize}
                variant="outline"
                className="w-full rounded-full text-xs border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
              >
                📋 요약 브리핑 생성
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              onClick={onReset}
              className="w-full rounded-full text-zinc-500 hover:text-zinc-300 text-xs mt-0.5"
            >
              새 회의 준비 (Reset)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}