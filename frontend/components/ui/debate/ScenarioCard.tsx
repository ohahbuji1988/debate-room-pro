"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface ScenarioParamItem {
  id: string;
  label: string;
  value: number;
  unit: string;
  step: number;
  enabled: boolean;
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

  const toggleParam = (id: string) => {
    if (isDebating) return;
    setParams((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const changeValue = (id: string, delta: number) => {
    if (isDebating) return;
    setParams((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return { ...p, value: p.value + delta };
      })
    );
  };

  const removeParam = (id: string) => {
    if (isDebating) return;
    setParams((prev) => prev.filter((p) => p.id !== id));
  };

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
    <div className="bg-zinc-950 border border-zinc-800/80 p-4 sm:p-5 relative">
      {/* 갤러리 전시 표식 */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-lime-400"></span>
          <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-400 uppercase">
            SPECIMEN // 01 · AGENDA & CONSTRAINTS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono uppercase px-2 py-0.5 border border-zinc-800 text-zinc-400">
            {activeCount > 0 ? `ACTIVE: [0${activeCount}]` : "CONSTRAINTS: NULL"}
          </span>
          <button
            type="button"
            disabled={isDebating}
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-[9px] font-mono uppercase tracking-wider text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-500 px-2 py-0.5 transition-colors"
          >
            {showAddForm ? "[CLOSE]" : "[+ NEW VARIABLE]"}
          </button>
        </div>
      </div>

      {/* 안건 텍스트 입력창 */}
      <div className="mb-3">
        <Textarea
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
          disabled={isDebating}
          placeholder="ENTER AGENDA SPECIFICATION..."
          className="bg-zinc-900/40 border border-zinc-800/80 focus-visible:ring-0 focus-visible:border-zinc-500 rounded-none resize-none h-16 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 font-sans leading-relaxed"
        />
      </div>

      {/* 새 조건 인라인 추가 폼 */}
      {showAddForm && (
        <form
          onSubmit={handleAddParam}
          className="flex flex-wrap items-center gap-2 p-2.5 bg-zinc-900/80 border border-zinc-700 mb-3 animate-in fade-in"
        >
          <input
            type="text"
            placeholder="VARIABLE (예: 운임 추가분)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="bg-black border border-zinc-700 rounded-none px-2 py-1 text-xs text-zinc-100 placeholder-zinc-600 flex-1 min-w-[120px] font-mono"
          />
          <input
            type="number"
            value={newValue}
            onChange={(e) => setNewValue(Number(e.target.value))}
            className="bg-black border border-zinc-700 rounded-none px-2 py-1 text-xs text-zinc-100 w-16 font-mono"
          />
          <input
            type="text"
            placeholder="UNIT"
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            className="bg-black border border-zinc-700 rounded-none px-2 py-1 text-xs text-zinc-100 w-14 font-mono"
          />
          <button
            type="submit"
            className="bg-zinc-100 hover:bg-white text-black text-[10px] font-mono tracking-wider font-bold h-7 px-3 uppercase"
          >
            INSERT
          </button>
        </form>
      )}

      {/* 🎛️ 아방가르드 미니멀 그리드 */}
      {params.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {params.map((item) => (
            <div
              key={item.id}
              className={`p-2.5 border transition-all relative ${
                item.enabled
                  ? "bg-zinc-900/60 border-zinc-700"
                  : "bg-zinc-950 border-zinc-900 opacity-30"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  onClick={() => toggleParam(item.id)}
                  className="text-[10px] font-mono tracking-wide text-zinc-300 cursor-pointer truncate max-w-[70%]"
                >
                  {item.label}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={isDebating}
                    onClick={() => toggleParam(item.id)}
                    className={`text-[8px] font-mono px-1 py-0.2 uppercase border ${
                      item.enabled
                        ? "border-lime-400/60 text-lime-400 bg-lime-950/20"
                        : "border-zinc-800 text-zinc-600"
                    }`}
                  >
                    {item.enabled ? "ON" : "OFF"}
                  </button>
                  <button
                    type="button"
                    disabled={isDebating}
                    onClick={() => removeParam(item.id)}
                    className="text-zinc-600 hover:text-zinc-300 text-[9px] px-0.5 font-mono"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-zinc-100">
                  {item.value}
                  <span className="text-[10px] text-zinc-500 font-normal ml-0.5">{item.unit}</span>
                </span>
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    disabled={isDebating || !item.enabled}
                    onClick={() => changeValue(item.id, -item.step)}
                    className="w-4 h-4 border border-zinc-800 hover:border-zinc-600 bg-black text-[9px] font-mono text-zinc-300 flex items-center justify-center disabled:opacity-20"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    disabled={isDebating || !item.enabled}
                    onClick={() => changeValue(item.id, item.step)}
                    className="w-4 h-4 border border-zinc-800 hover:border-zinc-600 bg-black text-[9px] font-mono text-zinc-300 flex items-center justify-center disabled:opacity-20"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 부서 선택 탭 (건축 도면 탭 스타일) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-zinc-900">
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {activeDepts.map((dept) => (
            <button
              key={dept.name}
              type="button"
              onClick={() => setSelectedDept(dept.name)}
              className={`shrink-0 px-2.5 py-1 text-[10px] font-mono transition-all border ${
                selectedDept === dept.name
                  ? "bg-zinc-100 text-black border-zinc-100 font-semibold"
                  : "bg-black text-zinc-400 border-zinc-800 hover:border-zinc-600"
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onRequestSingleTurn(selectedDept)}
          disabled={isDebating}
          className="text-[10px] font-mono tracking-widest uppercase border border-zinc-700 hover:border-zinc-400 text-zinc-300 hover:text-white px-3 py-1 shrink-0 transition-colors disabled:opacity-30"
        >
          DIRECT INTERVIEW →
        </button>
      </div>
    </div>
  );
}