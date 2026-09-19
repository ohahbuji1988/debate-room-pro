"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function GuideModal() {
  const [activeTab, setActiveTab] = useState<"poster" | "video">("poster");
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoStep, setVideoStep] = useState(0);

  // 비디오 재생 시연 시뮬레이터 (스텝별 자동 전환)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setVideoStep((prev) => (prev + 1) % 4);
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const videoScenes = [
    {
      title: "SCENE 01 · 안건 및 정량 리스크 세팅",
      desc: "지연 기간(8주), LD 상한(5%), 공정 버퍼(3주) 등 원하는 정량 조건만 [ON] 스위치로 활성화합니다.",
      badge: "STEP 1: PARAMETER SETUP",
      preview: "📋 안건 입력 ➔ [ON] 납기 지연 8주 ➔ [ON] LD 상한 5%",
    },
    {
      title: "SCENE 02 · 참여 부서 및 AI 엔진 셀렉트",
      desc: "설비구매, 생산, QA, 엔지니어링, PM 중 참석할 부서를 고르고 Groq/Gemini를 선택합니다.",
      badge: "STEP 2: AGENT SELECTION",
      preview: "👥 5개 유관부서 활성화 완료 · AI Engine: GROQ 120B",
    },
    {
      title: "SCENE 03 · 실시간 핑퐁 난상토론 개시",
      desc: "[INITIATE DISCOURSE]를 누르면 각 부서 AI가 실시간 스트리밍으로 상호 반박 논쟁을 펼칩니다.",
      badge: "STEP 3: LIVE STREAMING",
      preview: "🏭 생산: '버퍼 3주로는 불가' ➔ 💼 구매: 'LD 페널티로 상쇄'",
    },
    {
      title: "SCENE 04 · 조율자 지침 및 원페이저 보고서 다운",
      desc: "토론 종료 즉시 CEO 직속 Executive Summary가 도출되며 .html 단일 보고서로 추출됩니다.",
      badge: "STEP 4: EXECUTIVE REPORT",
      preview: "📥 Executive_Report.html 다운로드 준비 완료",
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-[10px] font-mono uppercase px-3 py-1 bg-stone-900 text-stone-100 hover:bg-black transition-colors border border-stone-900 flex items-center gap-1.5"
        >
          <span>📖</span>
          <span>GUIDE // MANUAL</span>
        </button>
      </DialogTrigger>

      <DialogContent className="bg-[#FAF9F6] border border-stone-300 text-stone-900 max-w-3xl max-h-[90vh] overflow-y-auto w-[94vw] sm:w-full rounded-none p-5 sm:p-7 shadow-2xl">
        <DialogHeader className="border-b border-stone-200 pb-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-stone-900"></span>
              <DialogTitle className="text-xs sm:text-sm font-mono tracking-[0.25em] uppercase font-bold text-stone-900">
                EXHIBIT MANUAL // OPERATING DIRECTIVE
              </DialogTitle>
            </div>
            <div className="flex gap-1 border border-stone-300 p-0.5 bg-stone-100">
              <button
                type="button"
                onClick={() => setActiveTab("poster")}
                className={`text-[9px] font-mono uppercase px-2.5 py-1 transition-all ${
                  activeTab === "poster" ? "bg-stone-900 text-white font-bold" : "text-stone-600 hover:text-black"
                }`}
              >
                1-PAGE POSTER
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("video")}
                className={`text-[9px] font-mono uppercase px-2.5 py-1 transition-all ${
                  activeTab === "video" ? "bg-stone-900 text-white font-bold" : "text-stone-600 hover:text-black"
                }`}
              >
                VIDEO DEMO (30S)
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* 1. 한 장 비주얼 인포그래픽 포스터 */}
        {activeTab === "poster" && (
          <div className="flex flex-col gap-4 font-sans text-stone-800 animate-in fade-in">
            <div className="p-3 bg-stone-100 border-l-2 border-stone-900 text-[11px] leading-relaxed">
              <b>Debate Room Pro</b>는 다부서 간 의견 충돌과 설비 투자 리스크를 AI 다자 토론을 통해 3분 만에 시뮬레이션하고, 경영진 보고용 <b>Executive One-Pager</b>로 압축 도출하는 플랫폼입니다.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Step 1 */}
              <div className="p-3.5 bg-white border border-stone-200 shadow-sm flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-stone-500 uppercase">PHASE 01</span>
                  <span className="text-[9px] font-mono bg-stone-100 px-1.5 py-0.5 border border-stone-300">SCENARIO</span>
                </div>
                <h4 className="font-bold text-stone-900 text-sm">안건 & 정량 리스크 세팅</h4>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  현안 텍스트를 입력하고, 필요한 숫자 조건(납기 지연 주수, LD 상한 %, 공정 버퍼 등)만 <b>[ON]</b>으로 켭니다. 미사용 시 텍스트로만 토론됩니다.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 bg-white border border-stone-200 shadow-sm flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-stone-500 uppercase">PHASE 02</span>
                  <span className="text-[9px] font-mono bg-stone-100 px-1.5 py-0.5 border border-stone-300">STAKEHOLDERS</span>
                </div>
                <h4 className="font-bold text-stone-900 text-sm">참여 부서 & AI 엔진 선택</h4>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  설비구매, 생산, QA, 엔지니어링, PM 중 참석 부서를 정합니다. 상단 <b>[⚙️ 설정]</b>에서 새 부서를 추가하거나 Groq/Gemini 엔진을 바꿉니다.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 bg-white border border-stone-200 shadow-sm flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-stone-500 uppercase">PHASE 03</span>
                  <span className="text-[9px] font-mono bg-stone-100 px-1.5 py-0.5 border border-stone-300">LIVE DEBATE</span>
                </div>
                <h4 className="font-bold text-stone-900 text-sm">핑퐁 토론 & 조율자 지침</h4>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  <b>[▶ 토론 시작]</b>을 누르면 부서별 실시간 발언이 흐릅니다. 토론 도중 하단 <b>👑 조율자 지침</b>을 입력해 회의 방향을 강제로 틀 수 있습니다.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-3.5 bg-white border border-stone-200 shadow-sm flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-stone-500 uppercase">PHASE 04</span>
                  <span className="text-[9px] font-mono bg-stone-100 px-1.5 py-0.5 border border-stone-300">REPORT</span>
                </div>
                <h4 className="font-bold text-stone-900 text-sm">Executive 보고서 출력</h4>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  토론이 끝나면 핵심 결론(Bottom Line), Top 3 리스크, 부서별 절충안이 자동 정리됩니다. <b>[EXPORT .HTML]</b>로 보고서 파일을 다운로드하세요.
                </p>
              </div>
            </div>

            <div className="text-[10px] font-mono text-stone-500 border-t border-stone-200 pt-2 text-right">
              SPECIMEN // 2026 DEBATE ROOM ARCHITECTURE
            </div>
          </div>
        )}

        {/* 2. 30초 인터랙티브 비디오 시뮬레이터 */}
        {activeTab === "video" && (
          <div className="flex flex-col gap-3 font-sans text-stone-800 animate-in fade-in">
            {/* 가상 비디오 모니터 */}
            <div className="bg-stone-950 text-stone-100 p-5 border border-stone-800 flex flex-col justify-between min-h-[260px] relative overflow-hidden">
              {/* 상단 타임코드 */}
              <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 border-b border-stone-800 pb-2">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isPlaying ? "bg-rose-500 animate-pulse" : "bg-stone-600"}`}></span>
                  <span>{isPlaying ? "LIVE PLAYBACK" : "PAUSED"}</span>
                </span>
                <span>SCENE [0{videoStep + 1} / 04]</span>
              </div>

              {/* 중앙 씬 디스플레이 */}
              <div className="my-4 p-4 bg-stone-900/90 border border-stone-700/80">
                <div className="text-[10px] font-mono text-lime-400 mb-1">
                  {videoScenes[videoStep].badge}
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">
                  {videoScenes[videoStep].title}
                </h3>
                <p className="text-xs text-stone-300 mb-3 leading-relaxed">
                  {videoScenes[videoStep].desc}
                </p>
                <div className="p-2.5 bg-black/80 font-mono text-xs text-stone-200 border-l-2 border-stone-400">
                  {videoScenes[videoStep].preview}
                </div>
              </div>

              {/* 하단 재생 컨트롤 바 */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3 py-1 bg-stone-100 hover:bg-white text-black text-xs font-mono font-bold uppercase transition-colors"
                >
                  {isPlaying ? "❚❚ PAUSE" : "▶ PLAY DEMO"}
                </button>
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3].map((idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => { setVideoStep(idx); setIsPlaying(false); }}
                      className={`w-6 h-6 text-[10px] font-mono border transition-all ${
                        videoStep === idx ? "bg-stone-100 text-black border-white font-bold" : "text-stone-500 border-stone-800 hover:border-stone-600"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 text-center font-mono">
              * [PLAY DEMO]를 누르면 각 씬이 3.5초마다 자동으로 전환되며 전체 워크플로우를 보여줍니다.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}