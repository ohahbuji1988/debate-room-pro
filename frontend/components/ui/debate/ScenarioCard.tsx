"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// 🎛️ AI 셰프들에게 전달할 4가지 핵심 정량 숫자 데이터 규격
export interface ScenarioParams {
  delayWeeks: number;     // 납기 지연 기간 (주)
  ldCapPercent: number;   // 벤더 지체상금(LD) 상한 (%)
  bufferWeeks: number;    // 공정 허용 버퍼 (주)
  altCostDiff: number;    // 대체 벤더 단가 차이 (%)
}

interface DepartmentInfo {
  name: string;
  role: string;
  enabled: boolean;
}

interface ScenarioCardProps {
  agenda: string;
  setAgenda: (agenda: string) => void;
  isDebating: boolean;
  activeDepts: DepartmentInfo[];
  selectedDept: string;
  setSelectedDept: (dept: string) => void;
  onRequestSingleTurn: (deptName: string) => void;
  params: ScenarioParams;
  setParams: React.Dispatch<React.SetStateAction<ScenarioParams>>;
}

export function ScenarioCard({
  agenda,
  setAgenda,
  isDebating,
  activeDepts,
  selectedDept,
  setSelectedDept,
  onRequestSingleTurn,
  params,
  setParams,
}: ScenarioCardProps) {
  return (
    <Card className="bg-zinc-950 border-zinc-800 text-zinc-100 shadow-lg">
      <CardHeader className="p-3.5 sm:p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xs sm:text-sm font-semibold text-zinc-300 flex items-center gap-1.5">
          <span>📋</span> 회의 안건 및 정량 조건 (Scenario Constraints)
        </CardTitle>
        <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">
          4 Parameters Active
        </span>
      </CardHeader>

      <CardContent className="p-3.5 sm:p-4 pt-0 flex flex-col gap-3">
        {/* 안건 텍스트 입력창 */}
        <Textarea
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
          disabled={isDebating}
          placeholder="논의할 안건을 입력하세요..."
          className="bg-zinc-900/80 border-zinc-800 focus-visible:ring-blue-500 resize-none h-16 text-xs sm:text-sm"
        />

        {/* 🎛️ [신규 기능] 4대 정량 시나리오 파라미터 조절 다이얼 (2x2 그리드) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
          {/* 1. 납기 지연 기간 */}
          <div className="flex flex-col gap-1 bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/50">
            <span className="text-[10px] text-zinc-400">납기 지연</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 font-mono">{params.delayWeeks}주</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={isDebating || params.delayWeeks <= 1}
                  onClick={() => setParams((p) => ({ ...p, delayWeeks: p.delayWeeks - 1 }))}
                  className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] disabled:opacity-30"
                >
                  -
                </button>
                <button
                  type="button"
                  disabled={isDebating || params.delayWeeks >= 24}
                  onClick={() => setParams((p) => ({ ...p, delayWeeks: p.delayWeeks + 1 }))}
                  className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 2. 공정 허용 버퍼 */}
          <div className="flex flex-col gap-1 bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/50">
            <span className="text-[10px] text-zinc-400">공정 버퍼</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 font-mono">{params.bufferWeeks}주</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={isDebating || params.bufferWeeks <= 0}
                  onClick={() => setParams((p) => ({ ...p, bufferWeeks: p.bufferWeeks - 1 }))}
                  className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] disabled:opacity-30"
                >
                  -
                </button>
                <button
                  type="button"
                  disabled={isDebating || params.bufferWeeks >= 12}
                  onClick={() => setParams((p) => ({ ...p, bufferWeeks: p.bufferWeeks + 1 }))}
                  className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 3. 지체상금(LD) 상한 */}
          <div className="flex flex-col gap-1 bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/50">
            <span className="text-[10px] text-zinc-400">LD 상한</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 font-mono">{params.ldCapPercent}%</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={isDebating || params.ldCapPercent <= 1}
                  onClick={() => setParams((p) => ({ ...p, ldCapPercent: p.ldCapPercent - 1 }))}
                  className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] disabled:opacity-30"
                >
                  -
                </button>
                <button
                  type="button"
                  disabled={isDebating || params.ldCapPercent >= 20}
                  onClick={() => setParams((p) => ({ ...p, ldCapPercent: p.ldCapPercent + 1 }))}
                  className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 4. 대체 벤더 단가 차이 */}
          <div className="flex flex-col gap-1 bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/50">
            <span className="text-[10px] text-zinc-400">대체벤더 단가</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 font-mono">+{params.altCostDiff}%</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={isDebating || params.altCostDiff <= 0}
                  onClick={() => setParams((p) => ({ ...p, altCostDiff: p.altCostDiff - 5 }))}
                  className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] disabled:opacity-30"
                >
                  -
                </button>
                <button
                  type="button"
                  disabled={isDebating || params.altCostDiff >= 50}
                  onClick={() => setParams((p) => ({ ...p, altCostDiff: p.altCostDiff + 5 }))}
                  className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 부서 선택 스크롤 탭 & 단독 발언 버튼 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-0.5">
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {activeDepts.map((dept) => (
              <button
                key={dept.name}
                type="button"
                onClick={() => setSelectedDept(dept.name)}
                className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition-all ${
                  selectedDept === dept.name
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                }`}
              >
                {dept.name}
              </button>
            ))}
          </div>

          <Button
            type="button"
            onClick={() => onRequestSingleTurn(selectedDept)}
            disabled={isDebating}
            variant="outline"
            className="rounded-full text-[11px] sm:text-xs border-zinc-700 hover:bg-zinc-800 text-zinc-300 shrink-0 h-8"
          >
            단독 발언 요청
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}