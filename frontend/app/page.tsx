"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { ScenarioCard, ScenarioParamItem } from "@/components/ui/debate/ScenarioCard";
import { SessionPanel } from "@/components/ui/debate/SessionPanel";

const API_BASE_URL = "https://debate-room-backend.onrender.com";

interface DepartmentInfo {
  name: string;
  role: string;
  enabled: boolean;
  voicePitch: number;
  voiceRate: number;
}

interface RiskItem {
  tag: string;
  level: string;
  desc: string;
}

interface MatrixItem {
  dept: string;
  issue: string;
  resolution: string;
}

interface ActionItem {
  action: string;
  owner: string;
  due: string;
}

interface SummaryData {
  bottom_line: string;
  top_3_risks: RiskItem[];
  alignment_matrix: MatrixItem[];
  next_actions: ActionItem[];
}

interface ArchiveItem {
  id: string;
  savedAt: string;
  agenda: string;
  messages: Array<{ speaker: string; speech: string }>;
  summaryData: SummaryData | null;
}

const DEFAULT_DEPARTMENTS: DepartmentInfo[] = [
  { name: "💼 설비구매", role: "TCO 절감, 벤더 지체상금(LD) 조항 검토, 추가 항공운임 벤더 부담 관철", enabled: true, voicePitch: 0.95, voiceRate: 1.05 },
  { name: "🏭 생산", role: "상업용 Batch 생산 마일스톤 준수, 라인 가동 중단 방지, OEE 극대화", enabled: true, voicePitch: 0.85, voiceRate: 1.15 },
  { name: "🛡️ QA", role: "cGMP 및 규정 준수, Change Control 승인 절차, 입고 SAT 검증 강화", enabled: true, voicePitch: 1.15, voiceRate: 0.95 },
  { name: "⚙️ 엔지니어링", role: "Utility(WFI, Clean Steam) 공급 용량 검토, Hook-up 공기 단축", enabled: true, voicePitch: 1.0, voiceRate: 1.05 },
  { name: "🎯 프로젝트 PM", role: "전체 공정 마일스톤 준수, Critical Path 사수", enabled: true, voicePitch: 1.05, voiceRate: 1.1 },
];

const INITIAL_PARAMS: ScenarioParamItem[] = [
  { id: "p1", label: "납기 지연", value: 8, unit: "주", step: 1, enabled: false },
  { id: "p2", label: "공정 버퍼", value: 3, unit: "주", step: 1, enabled: false },
  { id: "p3", label: "LD 상한", value: 5, unit: "%", step: 1, enabled: false },
  { id: "p4", label: "대체단가 차이", value: 15, unit: "%", step: 5, enabled: false },
];

export default function DebateRoomPro() {
  const [agenda, setAgenda] = useState("핵심 배양기 유럽 벤더 센서 수급난으로 Lead Time 8주 지연 통보 건");
  const [params, setParams] = useState<ScenarioParamItem[]>(INITIAL_PARAMS);

  const [messages, setMessages] = useState<Array<{ speaker: string; speech: string }>>([
    {
      speaker: "👑 Orchestrator",
      speech: "안건이 상정되었습니다. 각 유관부서는 정량적 리스크와 상충되는 대안을 제시해 주십시오."
    }
  ]);

  const [departments, setDepartments] = useState<DepartmentInfo[]>(DEFAULT_DEPARTMENTS);
  const [selectedDept, setSelectedDept] = useState("💼 설비구매");
  const [engine, setEngine] = useState<"groq" | "gemini">("groq");
  const [model, setModel] = useState("openai/gpt-oss-120b");
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptRole, setNewDeptRole] = useState("");

  const [orchestratorInput, setOrchestratorInput] = useState("");
  const [sessionMin, setSessionMin] = useState(3);
  const [timeLeft, setTimeLeft] = useState(180);
  const [isDebating, setIsDebating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [serverState, setServerState] = useState<"checking" | "waking" | "ready">("checking");
  const [ttsEnabled, setTtsEnabled] = useState(false);

  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [saveAlert, setSaveAlert] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  const isDebatingRef = useRef(isDebating);
  const isPausedRef = useRef(isPaused);
  const timeLeftRef = useRef(timeLeft);
  const messagesRef = useRef(messages);
  const departmentsRef = useRef(departments);
  const engineRef = useRef(engine);
  const modelRef = useRef(model);
  const ttsEnabledRef = useRef(ttsEnabled);
  const paramsRef = useRef(params);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { isDebatingRef.current = isDebating; }, [isDebating]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { 
    messagesRef.current = messages; 
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => { departmentsRef.current = departments; }, [departments]);
  useEffect(() => { engineRef.current = engine; }, [engine]);
  useEffect(() => { modelRef.current = model; }, [model]);
  useEffect(() => { ttsEnabledRef.current = ttsEnabled; }, [ttsEnabled]);
  useEffect(() => { paramsRef.current = params; }, [params]);

  useEffect(() => {
    let isMounted = true;
    const checkServer = async () => {
      const wakingTimer = setTimeout(() => {
        if (isMounted) setServerState("waking");
      }, 2500);

      try {
        await fetch(`${API_BASE_URL}/docs`, { method: "GET", mode: "no-cors" });
        clearTimeout(wakingTimer);
        if (isMounted) setServerState("ready");
      } catch (e) {
        clearTimeout(wakingTimer);
        if (isMounted) setServerState("waking");
      }
    };
    checkServer();
    return () => { isMounted = false; };
  }, []);

  const speakText = (speaker: string, text: string) => {
    if (!ttsEnabledRef.current || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[*#_~`]/g, "").slice(0, 250);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ko-KR";

    const dept = departmentsRef.current.find((d) => d.name === speaker);
    utterance.pitch = dept?.voicePitch ?? (speaker.includes("Orchestrator") ? 0.85 : 1.0);
    utterance.rate = dept?.voiceRate ?? 1.05;

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("debate_room_archives");
      if (saved) setArchives(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const activeDepts = departments.filter((d) => d.enabled);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isDebating && !isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsDebating(false);
            handleFinishAndSummarize();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isDebating, isPaused, timeLeft]);

  const turnCount = Math.max(0, messages.length - 1);
  const consensusRate = Math.min(95, Math.round(15 + Math.min(turnCount * 12, 70) + (orchestratorInput ? 8 : 0)));
  
  let tensionStatus = { label: "EXPLORATION", color: "text-zinc-400" };
  if (turnCount >= 2 && turnCount <= 5) {
    tensionStatus = { label: "CRITICAL COLLISION", color: "text-rose-400" };
  } else if (turnCount > 5) {
    tensionStatus = { label: "CONVERGENCE", color: "text-lime-400" };
  }

  const getEnrichedAgenda = () => {
    const activeParams = paramsRef.current.filter((p) => p.enabled);
    if (activeParams.length === 0) return agenda;

    const conditionText = activeParams
      .map((p) => `${p.label} ${p.value}${p.unit}`)
      .join(", ");
    return `${agenda} [정량 리스크 조건: ${conditionText}]`;
  };

  const saveToArchive = (targetSummary: SummaryData | null, targetMessages: Array<{ speaker: string; speech: string }>) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newArchiveItem: ArchiveItem = {
      id: Date.now().toString(),
      savedAt: dateStr,
      agenda: agenda,
      messages: targetMessages,
      summaryData: targetSummary
    };

    const updated = [newArchiveItem, ...archives];
    setArchives(updated);
    try {
      localStorage.setItem("debate_room_archives", JSON.stringify(updated));
      setSaveAlert(true);
      setTimeout(() => setSaveAlert(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const loadArchive = (item: ArchiveItem) => {
    setIsDebating(false);
    setIsPaused(false);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setAgenda(item.agenda);
    setMessages(item.messages);
    setSummaryData(item.summaryData);
    setIsArchiveOpen(false);
  };

  const deleteArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = archives.filter((a) => a.id !== id);
    setArchives(filtered);
    localStorage.setItem("debate_room_archives", JSON.stringify(filtered));
  };

  const requestSingleTurnStream = async (targetDeptName: string) => {
    const targetDeptInfo = departmentsRef.current.find((d) => d.name === targetDeptName);
    setMessages((prev) => [...prev, { speaker: targetDeptName, speech: "" }]);

    try {
      const response = await fetch(`${API_BASE_URL}/debate/turn/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agenda: getEnrichedAgenda(),
          department: targetDeptName,
          department_role: targetDeptInfo?.role || "",
          engine: engineRef.current,
          model: modelRef.current,
          history: messagesRef.current.filter((m) => m.speech.trim() !== "")
        })
      });

      if (!response.body) throw new Error("Stream connection failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let liveText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        liveText += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            speaker: targetDeptName,
            speech: liveText
          };
          return updated;
        });
      }

      if (liveText.trim()) {
        speakText(targetDeptName, liveText);
      } else {
        setMessages((prev) => prev.slice(0, -1));
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => prev.slice(0, -1));
    }
  };

  const startAutoDebateLoop = async () => {
    let currentIdx = 0;

    while (isDebatingRef.current && timeLeftRef.current > 0) {
      if (isPausedRef.current) {
        await new Promise((r) => setTimeout(r, 300));
        continue;
      }

      const currentActive = departmentsRef.current.filter((d) => d.enabled);
      if (currentActive.length === 0) break;

      const nextDept = currentActive[currentIdx % currentActive.length].name;
      setSelectedDept(nextDept);

      await requestSingleTurnStream(nextDept);

      currentIdx++;
      await new Promise((r) => setTimeout(r, 1400));
    }

    setIsDebating(false);
  };

  const handleFinishAndSummarize = async () => {
    setIsDebating(false);
    setIsPaused(false);
    setIsSummarizing(true);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();

    try {
      const response = await fetch(`${API_BASE_URL}/debate/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agenda: getEnrichedAgenda(),
          engine: engine,
          model: model,
          history: messagesRef.current.filter((m) => m.speech.trim() !== "")
        })
      });

      const data = await response.json();
      setSummaryData(data);
      saveToArchive(data, messagesRef.current.filter((m) => m.speech.trim() !== ""));
    } catch (error) {
      alert("요약 데이터 생성 오류가 발생했습니다.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDownloadHtmlReport = () => {
    if (!summaryData) return;

    const todayStr = new Date().toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const activeParams = paramsRef.current.filter((p) => p.enabled);
    const paramSummaryText =
      activeParams.length > 0
        ? activeParams.map((p) => `${p.label}: ${p.value}${p.unit}`).join(" | ")
        : "정량 조건 미지정";

    const risksHtml = (summaryData.top_3_risks || []).map(r => `
      <li style="margin-bottom:8px;">
        <span style="display:inline-block; padding:2px 8px; border-radius:2px; font-size:11px; font-weight:700; background:#f0f0f2; color:#111;">${r.level}</span>
        <b>${r.tag}</b>: ${r.desc}
      </li>
    `).join("");

    const matrixHtml = (summaryData.alignment_matrix || []).map(m => `
      <tr>
        <td style="font-weight:700; color:#111; width:22%;">${m.dept}</td>
        <td style="color:#555;">${m.issue}</td>
        <td style="font-weight:600; color:#111;">${m.resolution}</td>
      </tr>
    `).join("");

    const actionsHtml = (summaryData.next_actions || []).map(a => `
      <tr>
        <td style="font-weight:600;">${a.action}</td>
        <td style="text-align:center; color:#111;">${a.owner}</td>
        <td style="text-align:center; color:#555; font-weight:700;">${a.due}</td>
      </tr>
    `).join("");

    const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>Executive Decision Report · Debate Room Pro</title>
  <style>
    @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css");
    * { font-family: "Pretendard", -apple-system, sans-serif !important; box-sizing: border-box; }
    body { margin: 0; padding: 30px 16px; background-color: #f5f5f7; color: #1d1d1f; }
    .wrapper { max-width: 840px; margin: 0 auto; background: #ffffff; padding: 36px; border: 1px solid #d2d2d7; }
    .header { border-bottom: 2px solid #111; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .header-title { font-size: 22px; font-weight: 800; color: #111; margin: 0; letter-spacing: -0.02em; }
    .header-meta { font-size: 11px; color: #86868b; font-family: monospace; }
    .section-title { font-size: 12px; font-weight: 700; color: #111; text-transform: uppercase; margin: 20px 0 8px 0; letter-spacing: 0.1em; }
    .box-decision { background: #fafafa; border-left: 3px solid #111; padding: 14px; font-size: 13.5px; font-weight: 600; color: #111; line-height: 1.6; }
    .box-gray { background: #fafafa; border: 1px solid #e5e5ea; padding: 12px 16px; font-size: 13px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 12px; }
    th { background: #f5f5f7; padding: 8px 10px; text-align: left; font-weight: 600; border-bottom: 1px solid #d2d2d7; color: #666; font-family: monospace; }
    td { padding: 8px 10px; border-bottom: 1px solid #eee; line-height: 1.45; }
    .footer { text-align: center; font-size: 10px; color: #999; margin-top: 30px; padding-top: 14px; border-top: 1px solid #eee; font-family: monospace; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div>
        <div style="font-size: 10px; font-weight: 700; color: #111; letter-spacing: 0.2em; font-family: monospace;">EXHIBIT // MEMORANDUM</div>
        <h1 class="header-title">Executive Decision Report</h1>
      </div>
      <div class="header-meta">
        DATE: ${todayStr}<br>
        CHAIR: ORCHESTRATOR
      </div>
    </div>

    <div class="section-title">1. Agenda & Scenario Constraints</div>
    <div class="box-gray">
      <b>안건:</b> ${agenda}<br>
      <span style="font-size: 11px; color: #555; margin-top: 4px; display: inline-block; font-family: monospace;">
        [정량 조건: ${paramSummaryText}]
      </span>
    </div>

    <div class="section-title">2. Bottom Line (최종 의사결정 권고)</div>
    <div class="box-decision">${summaryData.bottom_line}</div>

    <div class="section-title">3. Top 3 Key Risks & Mitigation</div>
    <div class="box-gray">
      <ul style="margin: 0; padding-left: 18px; line-height: 1.65;">
        ${risksHtml}
      </ul>
    </div>

    <div class="section-title">4. Department Alignment Matrix</div>
    <table>
      <thead><tr><th>Stakeholder</th><th>Key Concern</th><th>Aligned Resolution</th></tr></thead>
      <tbody>${matrixHtml}</tbody>
    </table>

    <div class="section-title">5. Next Action Items</div>
    <table>
      <thead><tr><th>Action</th><th style="text-align:center; width:22%;">Owner</th><th style="text-align:center; width:20%;">Due</th></tr></thead>
      <tbody>${actionsHtml}</tbody>
    </table>

    <div class="footer">
      COMPILED VIA DEBATE ROOM PRO · AVANT-GARDE SIMULATOR
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Report_${new Date().toISOString().slice(0, 10)}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleDept = (name: string) => {
    setDepartments((prev) =>
      prev.map((d) => (d.name === name ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setDepartments((prev) => [
      ...prev,
      { name: newDeptName.trim(), role: newDeptRole.trim(), enabled: true, voicePitch: 1.0, voiceRate: 1.0 }
    ]);
    setNewDeptName("");
    setNewDeptRole("");
  };

  const handleSendOrchestrator = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orchestratorInput.trim()) return;
    setMessages((prev) => [
      ...prev,
      { speaker: "👑 Orchestrator", speech: orchestratorInput.trim() }
    ]);
    speakText("👑 Orchestrator", orchestratorInput.trim());
    setOrchestratorInput("");
  };

  const handleStart = () => {
    if (!agenda.trim()) return alert("안건을 입력해 주세요!");
    if (activeDepts.length === 0) return alert("최소 1개 이상의 부서가 활성화되어야 합니다!");
    const totalSec = sessionMin * 60;
    setTimeLeft(totalSec);
    setIsDebating(true);
    setIsPaused(false);
    setSummaryData(null);
    setTimeout(() => {
      startAutoDebateLoop();
    }, 100);
  };

  const handleReset = () => {
    setIsDebating(false);
    setIsPaused(false);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setTimeLeft(sessionMin * 60);
    setSummaryData(null);
    setMessages([{ speaker: "👑 Orchestrator", speech: "세션이 초기화되었습니다. 안건을 준비해 주십시오." }]);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progress = Math.min(100, Math.max(0, (timeLeft / (sessionMin * 60)) * 100));

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col p-3 sm:p-6 font-sans">
      
      {/* 갤러리 경고 배너 */}
      {serverState === "waking" && (
        <div className="max-w-7xl mx-auto w-full mb-3 p-2.5 bg-zinc-900 border-l-2 border-lime-400 flex items-center justify-between gap-2 text-xs font-mono text-zinc-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-lime-400 animate-ping"></span>
            <span>[SYS NOTICE] AI SERVER COLD BOOT SEQUENCE RUNNING (EST. 20-30S)...</span>
          </div>
          <span className="text-[10px] text-zinc-500 hidden sm:inline">CONNECTING</span>
        </div>
      )}

      {/* 1. 아방가르드 헤더 마스트헤드 */}
      <header className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 border-b border-zinc-800/80 px-4 sm:px-6 py-3.5 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <span className="text-lime-400 font-mono text-sm">✦</span>
          <div className="flex flex-col">
            <span className="font-mono text-xs sm:text-sm font-bold tracking-[0.25em] text-zinc-100 uppercase">
              DEBATE ROOM // PRO
            </span>
            <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">
              SPECIMEN NO. 2026 · CROSS-FUNCTIONAL
            </span>
          </div>

          <span className="text-[9px] font-mono uppercase px-2 py-0.5 border border-zinc-800 text-zinc-400 ml-2">
            {serverState === "ready" ? "SYS: ONLINE" : serverState === "waking" ? "SYS: BOOTING" : "SYS: CHECK"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 오디오 토글 */}
          <button
            onClick={() => {
              if (ttsEnabled && typeof window !== "undefined") window.speechSynthesis?.cancel();
              setTtsEnabled(!ttsEnabled);
            }}
            className={`text-[10px] font-mono uppercase px-2.5 py-1 border transition-colors ${
              ttsEnabled
                ? "bg-zinc-100 text-black border-zinc-100 font-bold"
                : "bg-black text-zinc-400 border-zinc-800 hover:border-zinc-600"
            }`}
          >
            {ttsEnabled ? "AUDIO: ON" : "AUDIO: OFF"}
          </button>

          {saveAlert && (
            <span className="text-[10px] font-mono text-lime-400 px-2 py-0.5 border border-lime-400/40 animate-in fade-in">
              SAVED
            </span>
          )}

          {/* 보관함 모달 */}
          <Dialog open={isArchiveOpen} onOpenChange={setIsArchiveOpen}>
            <DialogTrigger className="text-[10px] font-mono uppercase px-2.5 py-1 border border-zinc-800 hover:border-zinc-500 text-zinc-300 transition-colors">
              ARCHIVE ({archives.length})
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100 max-w-xl max-h-[85vh] overflow-y-auto w-[92vw] sm:w-full rounded-none p-5">
              <DialogHeader>
                <DialogTitle className="text-xs font-mono tracking-widest uppercase text-zinc-300 pb-2 border-b border-zinc-800 flex justify-between items-center">
                  <span>DISCOURSE ARCHIVE</span>
                  <span className="text-zinc-500">[{archives.length} ITEMS]</span>
                </DialogTitle>
              </DialogHeader>

              {archives.length === 0 ? (
                <div className="py-12 text-center text-zinc-600 font-mono text-xs">
                  NO ARCHIVED DISCOURSES FOUND.
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  {archives.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => loadArchive(item)}
                      className="p-3 bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-500 cursor-pointer transition-all flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>{item.savedAt}</span>
                        <button
                          onClick={(e) => deleteArchive(item.id, e)}
                          className="hover:text-rose-400"
                        >
                          [DELETE]
                        </button>
                      </div>
                      <div className="text-xs font-mono font-medium text-zinc-200 line-clamp-1">{item.agenda}</div>
                      {item.summaryData?.bottom_line && (
                        <div className="text-[11px] text-zinc-400 line-clamp-1 bg-black p-2 border-l border-zinc-700">
                          {item.summaryData.bottom_line}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* 설정 모달 */}
          <Dialog>
            <DialogTrigger className="text-[10px] font-mono uppercase px-2.5 py-1 border border-zinc-800 hover:border-zinc-500 text-zinc-300 transition-colors">
              CONFIG
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100 max-w-md max-h-[85vh] overflow-y-auto w-[92vw] sm:w-full rounded-none p-5">
              <DialogHeader>
                <DialogTitle className="text-xs font-mono tracking-widest uppercase text-zinc-300 pb-2 border-b border-zinc-800">
                  SYSTEM PARAMETERS
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-2 pt-2 border-b border-zinc-800 pb-4">
                <span className="text-[10px] font-mono uppercase text-zinc-500">1. COGNITIVE ENGINE</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setEngine("groq"); setModel("openai/gpt-oss-120b"); }}
                    className={`p-2 border text-left font-mono transition-all ${
                      engine === "groq" ? "bg-zinc-100 text-black border-zinc-100" : "bg-black border-zinc-800 text-zinc-400"
                    }`}
                  >
                    <div className="text-xs font-bold">GROQ</div>
                    <div className="text-[9px] opacity-70">gpt-oss-120b</div>
                  </button>
                  <button
                    onClick={() => { setEngine("gemini"); setModel("gemini-2.5-flash"); }}
                    className={`p-2 border text-left font-mono transition-all ${
                      engine === "gemini" ? "bg-zinc-100 text-black border-zinc-100" : "bg-black border-zinc-800 text-zinc-400"
                    }`}
                  >
                    <div className="text-xs font-bold">GEMINI</div>
                    <div className="text-[9px] opacity-70">gemini-2.5-flash</div>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-b border-zinc-800 pb-4">
                <span className="text-[10px] font-mono uppercase text-zinc-500">
                  2. STAKEHOLDERS ({activeDepts.length}/{departments.length})
                </span>
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
                  {departments.map((d) => (
                    <div
                      key={d.name}
                      onClick={() => toggleDept(d.name)}
                      className={`flex items-center justify-between p-2 border cursor-pointer font-mono ${
                        d.enabled ? "bg-zinc-900 border-zinc-700 text-zinc-100" : "bg-black border-zinc-900 text-zinc-600"
                      }`}
                    >
                      <span className="text-xs">{d.name}</span>
                      <span className="text-[9px] uppercase">
                        {d.enabled ? "[ACTIVE]" : "[MUTED]"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAddDept} className="flex flex-col gap-2 pt-2">
                <span className="text-[10px] font-mono uppercase text-zinc-500">+ REGISTER STAKEHOLDER</span>
                <input
                  type="text"
                  placeholder="DEPT (예: 🌿 EHS)"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="bg-black border border-zinc-800 rounded-none px-2 py-1 text-xs text-zinc-200 font-mono"
                />
                <input
                  type="text"
                  placeholder="KPI / ROLE FOCUS"
                  value={newDeptRole}
                  onChange={(e) => setNewDeptRole(e.target.value)}
                  className="bg-black border border-zinc-800 rounded-none px-2 py-1 text-xs text-zinc-200 font-mono"
                />
                <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-[10px] uppercase py-1.5 mt-1">
                  ADD ENTITY
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* 2. 메인 관제 뷰 */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-7xl mx-auto w-full">
        {/* 메인 회의 콘솔 */}
        <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-3">
          
          {/* 안건 및 정량 조건 카드 */}
          <ScenarioCard
            agenda={agenda}
            setAgenda={setAgenda}
            isDebating={isDebating}
            activeDepts={activeDepts}
            selectedDept={selectedDept}
            setSelectedDept={setSelectedDept}
            onRequestSingleTurn={requestSingleTurnStream}
            params={params}
            setParams={setParams}
          />

          {/* 런웨이 대본 / 전시 도록 스타일 회의록 */}
          <div className="bg-zinc-950 border border-zinc-800/80 p-4 sm:p-5 overflow-y-auto max-h-[46vh] sm:max-h-[480px] flex flex-col gap-3">
            <div className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 uppercase flex justify-between border-b border-zinc-900 pb-2 mb-1">
              <span>TRANSCRIPT // LIVE RECORD</span>
              {isDebating && <span className="text-lime-400 font-mono">STREAMING IN PROGRESS</span>}
            </div>

            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3.5 border transition-all ${
                  m.speaker.includes("Orchestrator")
                    ? "bg-zinc-900/90 border-l-2 border-l-lime-400 border-zinc-800 text-zinc-100"
                    : "bg-zinc-950/60 border-l-2 border-l-zinc-700 border-zinc-900 text-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-mono font-bold tracking-wider text-zinc-100">{m.speaker}</span>
                  <span className="text-[9px] font-mono text-zinc-500">INDEX #{String(idx + 1).padStart(2, "0")}</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans text-zinc-200">
                  {m.speech || <span className="inline-block w-2 h-3 bg-lime-400 animate-pulse"></span>}
                </p>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* 조율자 지침 입력창 */}
          <form onSubmit={handleSendOrchestrator} className="flex flex-col sm:flex-row gap-2 bg-zinc-950 border border-zinc-800 p-2">
            <div className="flex items-center gap-1 px-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-lime-400">👑 DIRECTIVE:</span>
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={orchestratorInput}
                onChange={(e) => setOrchestratorInput(e.target.value)}
                placeholder="INSERT INTERVENTION DIRECTIVE..."
                className="flex-1 bg-black border border-zinc-800 rounded-none px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
              />
              <button type="submit" className="bg-zinc-100 hover:bg-white text-black font-mono font-bold text-xs uppercase px-4 shrink-0 transition-colors">
                SEND
              </button>
            </div>
          </form>

          {/* 컴파일 로딩 */}
          {isSummarizing && (
            <div className="p-4 bg-zinc-950 border border-zinc-800 text-center animate-pulse">
              <span className="text-lime-400 font-mono text-xs uppercase tracking-widest">
                COMPILING EXECUTIVE MEMORANDUM...
              </span>
            </div>
          )}

          {/* Executive Summary 카드 */}
          {summaryData && (
            <div className="flex flex-col gap-3 p-4 sm:p-5 bg-zinc-950 border border-zinc-700 animate-in fade-in duration-300">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lime-400 font-mono">✦</span>
                  <span className="font-mono text-xs sm:text-sm font-bold tracking-widest uppercase text-zinc-100">
                    EXECUTIVE MEMORANDUM
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => saveToArchive(summaryData, messages)}
                    className="text-[10px] font-mono uppercase border border-zinc-700 hover:border-zinc-400 px-3 py-1 text-zinc-300 transition-colors"
                  >
                    SAVE ARCHIVE
                  </button>
                  <button
                    onClick={handleDownloadHtmlReport}
                    className="text-[10px] font-mono uppercase bg-zinc-100 text-black font-bold px-3 py-1 hover:bg-white transition-colors"
                  >
                    EXPORT (.HTML)
                  </button>
                </div>
              </div>

              {/* Bottom Line */}
              <div className="p-3.5 bg-zinc-900/80 border-l-2 border-lime-400">
                <div className="text-[9px] font-mono uppercase tracking-widest text-lime-400 mb-1">01. BOTTOM LINE ADVISORY</div>
                <div className="text-xs sm:text-sm font-medium text-white leading-relaxed">{summaryData.bottom_line}</div>
              </div>

              {/* 리스크 & 매트릭스 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-black border border-zinc-800 flex flex-col gap-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-rose-400">02. TOP 3 RISKS</div>
                  {(summaryData.top_3_risks || []).map((r, i) => (
                    <div key={i} className="text-[11px] leading-relaxed">
                      <span className="font-mono text-[9px] px-1 py-0.2 mr-1 bg-rose-950/40 text-rose-300 border border-rose-900">
                        {r.level}
                      </span>
                      <strong className="text-zinc-200">{r.tag}:</strong> <span className="text-zinc-400">{r.desc}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-black border border-zinc-800 flex flex-col gap-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-300">03. ALIGNMENT MATRIX</div>
                  {(summaryData.alignment_matrix || []).map((m, i) => (
                    <div key={i} className="text-[11px] leading-relaxed">
                      <strong className="text-zinc-200 font-mono">[{m.dept}]</strong> <span className="text-zinc-400">{m.issue}</span> ➔ <strong className="text-lime-400">{m.resolution}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Actions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-mono uppercase text-zinc-500 mr-1">ACTION MANDATE:</span>
                {(summaryData.next_actions || []).map((a, i) => (
                  <div key={i} className="bg-black border border-zinc-800 px-2.5 py-1 text-[10px] font-mono flex items-center gap-1.5">
                    <span className="text-zinc-200">{a.action}</span>
                    <span className="text-zinc-400 font-semibold">{a.owner}</span>
                    <span className="text-lime-400">{a.due}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 세션 시계 / 합의 게이지 패널 */}
        <div className="md:col-span-1 lg:col-span-1">
          <SessionPanel
            consensusRate={consensusRate}
            tensionStatus={tensionStatus}
            mins={mins}
            secs={secs}
            progress={progress}
            sessionMin={sessionMin}
            setSessionMin={setSessionMin}
            setTimeLeft={setTimeLeft}
            isDebating={isDebating}
            isPaused={isPaused}
            onTogglePause={() => {
              if (!isPaused && typeof window !== "undefined") window.speechSynthesis?.cancel();
              setIsPaused(!isPaused);
            }}
            onStart={handleStart}
            onFinishAndSummarize={handleFinishAndSummarize}
            onReset={handleReset}
            messagesCount={messages.length}
            hasSummary={Boolean(summaryData)}
          />
        </div>
      </div>
    </div>
  );
}