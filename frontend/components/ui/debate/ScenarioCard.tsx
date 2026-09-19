"use client";

import React, { useState } from "react";
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
    <div className="bg-white border border-stone-300/80 p-4 sm:p-6 shadow-sm relative">
      {/* 갤러리 상단 인덱스 표식 */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3.5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-stone-900"></span>
          <span className="text-[10px] font-mono tracking-[0.2em] text-stone-600 uppercase">
            SPECIMEN // 01 · AGENDA & CONSTRAINTS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono uppercase px-2 py-0.5 border border-stone-200 bg-stone-50 text-stone-600">
            {activeCount > 0 ? `ACTIVE: [0${activeCount}]` : "CONSTRAINTS: OFF"}
          </span>
          <button
            type="button"
            disabled={isDebating}
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-[9px] font-mono uppercase tracking-wider text-stone-700 hover:text-black border border-stone-300 hover:border-stone-900 px-2.5 py-0.5 transition-colors"
          >
            {showAddForm ? "[CLOSE]" : "[+ NEW VARIABLE]"}
          </button>
        </div>
      </div>

      {/* 안건 텍스트 입력창 (정돈된 폰트와 크기) */}
      <div className="mb-3.5">
        <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1">
          CASE SUBJECT / 안건 제목
        </div>
        <Textarea
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
          disabled={isDebating}
          placeholder="논의할 의사결정 현안을 구체적으로 입력하십시오..."
          className="bg-stone-50/60 border border-stone-200 focus-visible:ring-0 focus-visible:border-stone-900 rounded-none resize-none h-18 text-xs sm:text-[13px] text-stone-900 placeholder-stone-400 font-sans leading-relaxed tracking-normal"
        />
      </div>

      {/* 새 조건 추가 폼 */}
      {showAddForm && (
        <form
          onSubmit={handleAddParam}
          className="flex flex-wrap items-center gap-2 p-3 bg-stone-100 border border-stone-300 mb-3.5 animate-in fade-in"
        >
          <input
            type="text"
            placeholder="조건명 (예: 추가 항공운임)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="bg-white border border-stone-300 rounded-none px-2.5 py-1 text-xs text-stone-900 placeholder-stone-400 flex-1 min-w-[120px]"
          />
          <input
            type="number"
            value={newValue}
            onChange={(e) => setNewValue(Number(e.target.value))}
            className="bg-white border border-stone-300 rounded-none px-2 py-1 text-xs text-stone-900 w-16 font-mono"
          />
          <input
            type="text"
            placeholder="단위 (주, %, 억원)"
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            className="bg-white border border-stone-300 rounded-none px-2 py-1 text-xs text-stone-900 w-16"
          />
          <button
            type="submit"
            className="bg-stone-900 hover:bg-black text-white text-[10px] font-mono tracking-wider font-bold h-7 px-3.5 uppercase"
          >
            REGISTER
          </button>
        </form>
      )}

      {/* 정량 리스크 조건 그리드 */}
      {params.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3.5">
          {params.map((item) => (
            <div
              key={item.id}
              className={`p-2.5 border transition-all ${
                item.enabled
                  ? "bg-stone-50 border-stone-400"
                  : "bg-stone-100/60 border-stone-200 opacity-40"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  onClick={() => toggleParam(item.id)}
                  className="text-[10px] font-mono tracking-wide text-stone-700 cursor-pointer truncate max-w-[70%]"
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
                        ? "border-stone-900 text-stone-900 bg-white font-bold"
                        : "border-stone-300 text-stone-400"
                    }`}
                  >
                    {item.enabled ? "ON" : "OFF"}
                  </button>
                  <button
                    type="button"
                    disabled={isDebating}
                    onClick={() => removeParam(item.id)}
                    className="text-stone-400 hover:text-stone-700 text-[9px] px-0.5 font-mono"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-stone-900">
                  {item.value}
                  <span className="text-[10px] text-stone-500 font-normal ml-0.5">{item.unit}</span>
                </span>
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    disabled={isDebating || !item.enabled}
                    onClick={() => changeValue(item.id, -item.step)}
                    className="w-4 h-4 border border-stone-300 hover:border-stone-700 bg-white text-[9px] font-mono text-stone-800 flex items-center justify-center disabled:opacity-30"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    disabled={isDebating || !item.enabled}
                    onClick={() => changeValue(item.id, item.step)}
                    className="w-4 h-4 border border-stone-300 hover:border-stone-700 bg-white text-[9px] font-mono text-stone-800 flex items-center justify-center disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 부서 선택 탭 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2.5 border-t border-stone-200">
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {activeDepts.map((dept) => (
            <button
              key={dept.name}
              type="button"
              onClick={() => setSelectedDept(dept.name)}
              className={`shrink-0 px-2.5 py-1 text-[10px] font-mono transition-all border ${
                selectedDept === dept.name
                  ? "bg-stone-900 text-white border-stone-900 font-medium"
                  : "bg-white text-stone-600 border-stone-300 hover:border-stone-600"
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
          className="text-[10px] font-mono tracking-wider uppercase border border-stone-400 hover:border-stone-900 text-stone-800 hover:text-black px-3 py-1 shrink-0 transition-colors disabled:opacity-30"
        >
          DIRECT INTERVIEW →
        </button>
      </div>
    </div>
  );
}