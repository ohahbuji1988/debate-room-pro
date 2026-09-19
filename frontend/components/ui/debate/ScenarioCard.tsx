"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// 🎛️ 자유롭게 추가/삭제/토글이 가능한 정량 조건 규격
export interface ScenarioParamItem {
  id: string;
  label: string;    // 조건 이름 (예: 납기 지연, 예산 한도)
  value: number;    // 숫자 값
  unit: string;     // 단위 (주, %, 억원, 일 등)
  step: number;     // 한 번 누를 때 증감 크기
  enabled: boolean; // ON / OFF 스위치
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
  params: ScenarioParamItem[];
  setParams: React.Dispatch<React.SetStateAction<ScenarioParamItem[]>>;
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState<number>(10);
  const [newUnit, setNewUnit] = useState("주");

  // ON / OFF 토글
  const toggleParam = (id: string) => {
    if (isDebating) return;
    setParams((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  // 숫자 증가/감소
  const changeValue = (id: string, delta: number) => {
    if (isDebating) return;
    setParams((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const nextVal = p.value + delta;
        return { ...p, value: nextVal };
      })
    );
  };

  // 조건 삭제
  const removeParam = (id: string) => {
    if (isDebating) return;
    setParams((prev) => prev.filter((p) => p.id !== id));
  };

  // 새 조건 등록
  const handleAddParam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const newItem: ScenarioParamItem = {
      id: `param-${Date.now()}`,
      label: newLabel.trim(),
      value: Number(newValue) || 0,
      unit: newUnit.trim() || "건",
      step: 1,
      enabled: true,
    };
    setParams((prev) => [...prev, newItem]);
    setNewLabel("");
    setShowAddForm(false);
  };

  const activeCount = params.filter((p) => p.enabled).length;

  return (
    <Card className="bg-zinc-950 border-zinc-800 text-zinc-100 shadow-lg">
      <CardHeader className="p-3.5 sm:p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xs sm:text-sm font-semibold text-zinc-300 flex items-center gap-1.5">
          <span>📋</span> 회의 안건 및 정량 리스크 조건
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">
            {activeCount > 0 ? `${activeCount}개 조건 활성` : "정량 조건 미사용"}
          </span>
          <button
            type="button"
            disabled={isDebating}
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-[10px] text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full transition-colors"
          >
            {showAddForm ? "닫기" : "+ 조건 추가"}
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-3.5 sm:p-4 pt-0 flex flex-col gap-3">
        {/* 안건 텍스트 입력창 */}
        <Textarea
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
          disabled={isDebating}
          placeholder="논의할 현안을 입력하세요..."
          className="bg-zinc-900/80 border-zinc-800 focus-visible:ring-blue-500 resize-none h-16 text-xs sm:text-sm"
        />

        {/* 새 조건 인라인 추가 폼 */}
        {showAddForm && (
          <form
            onSubmit={handleAddParam}
            className="flex flex-wrap items-center gap-2 p-2.5 bg-blue-950/20 border border-blue-500/30 rounded-xl animate-in fade-in"
          >
            <input
              type="text"
              placeholder="조건명 (예: 예산 한도)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-100 placeholder-zinc-500 flex-1 min-w-[120px]"
            />
            <input
              type="number"
              value={newValue}
              onChange={(e) => setNewValue(Number(e.target.value))}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-100 w-16 font-mono"
            />
            <input
              type="text"
              placeholder="단위 (주, %, 억원)"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-100 w-16"
            />
            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-7 px-3 rounded-lg">
              등록
            </Button>
          </form>
        )}

        {/* 🎛️ 동적 정량 조건 그리드 (ON/OFF 스위치 + 조절기 + 삭제) */}
        {params.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
            {params.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col gap-1 p-2 rounded-lg border transition-all ${
                  item.enabled
                    ? "bg-zinc-950/90 border-zinc-700"
                    : "bg-zinc-950/40 border-zinc-800/40 opacity-40"
                }`}
              >
                {/* 상단: 이름 + ON/OFF 스위치 + 삭제 버튼 */}
                <div className="flex items-center justify-between">
                  <span
                    onClick={() => toggleParam(item.id)}
                    className="text-[10px] font-medium text-zinc-300 cursor-pointer truncate max-w-[70%]"
                    title="클릭하여 켜기/끄기"
                  >
                    {item.label}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={isDebating}
                      onClick={() => toggleParam(item.id)}
                      className={`text-[9px] px-1 py-0.2 rounded font-bold transition-colors ${
                        item.enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {item.enabled ? "ON" : "OFF"}
                    </button>
                    <button
                      type="button"
                      disabled={isDebating}
                      onClick={() => removeParam(item.id)}
                      className="text-zinc-500 hover:text-rose-400 text-[10px] px-0.5"
                      title="조건 삭제"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* 하단: 수치 & 증감 버튼 */}
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-xs font-bold text-blue-400 font-mono">
                    {item.value}
                    <span className="text-[10px] text-zinc-400 ml-0.5">{item.unit}</span>
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={isDebating || !item.enabled}
                      onClick={() => changeValue(item.id, -item.step)}
                      className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] disabled:opacity-20"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      disabled={isDebating || !item.enabled}
                      onClick={() => changeValue(item.id, item.step)}
                      className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] disabled:opacity-20"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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