"use client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://debate-room-backend.onrender.com";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface DepartmentInfo {
  name: string;
  role: string;
  enabled: boolean;
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
  { name: "💼 설비구매", role: "TCO 절감, 벤더 지체상금(LD) 조항 검토, 추가 항공운임 벤더 부담 관철", enabled: true },
  { name: "🏭 생산", role: "상업용 Batch 생산 마일스톤 준수, 라인 가동 중단 방지, OEE 극대화", enabled: true },
  { name: "🛡️ QA", role: "cGMP 및 규정 준수, Change Control 승인 절차, 입고 SAT 검증 강화", enabled: true },
  { name: "⚙️ 엔지니어링", role: "Utility(WFI, Clean Steam) 공급 용량 검토, Hook-up 공기 단축", enabled: true },
  { name: "🎯 프로젝트 PM", role: "전체 공정 마일스톤 준수, Critical Path 사수", enabled: true },
];

export default function DebateRoomPro() {
  const [agenda, setAgenda] = useState("핵심 배양기 유럽 벤더 센서 수급난으로 Lead Time 8주 지연 통보 건");
  const [messages, setMessages] = useState<Array<{ speaker: string; speech: string }>>([
    {
      speaker: "👑 Orchestrator",
      speech: "안건이 상정되었습니다. 유관부서 담당자분들은 핵심 리스크와 대안을 발언해 주십시오."
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem("debate_room_archives");
      if (saved) {
        setArchives(JSON.parse(saved));
      }
    } catch (e) {
      console.error("보관함 로드 실패:", e);
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
      console.error("보관함 저장 오류:", e);
    }
  };

  const loadArchive = (item: ArchiveItem) => {
    setIsDebating(false);
    setIsPaused(false);
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
      const response = await fetch("${API_BASE_URL}/debate/turn/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agenda: agenda,
          department: targetDeptName,
          department_role: targetDeptInfo?.role || "",
          engine: engineRef.current,
          model: modelRef.current,
          history: messagesRef.current.filter((m) => m.speech.trim() !== "")
        })
      });

      if (!response.body) throw new Error("배관 연결 실패");

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

      if (!liveText.trim()) {
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
      await new Promise((r) => setTimeout(r, 1200));
    }

    setIsDebating(false);
  };

  const handleFinishAndSummarize = async () => {
    setIsDebating(false);
    setIsPaused(false);
    setIsSummarizing(true);

    try {
      const response = await fetch("${API_BASE_URL}/debate/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agenda: agenda,
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

    const risksHtml = (summaryData.top_3_risks || []).map(r => `
      <li style="margin-bottom:8px;">
        <span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:700; background:#f0f0f2; color:#111;">${r.level}</span>
        <b>${r.tag}</b>: ${r.desc}
      </li>
    `).join("");

    const matrixHtml = (summaryData.alignment_matrix || []).map(m => `
      <tr>
        <td style="font-weight:700; color:#0071e3; width:22%;">${m.dept}</td>
        <td style="color:#555;">${m.issue}</td>
        <td style="font-weight:600; color:#111;">${m.resolution}</td>
      </tr>
    `).join("");

    const actionsHtml = (summaryData.next_actions || []).map(a => `
      <tr>
        <td style="font-weight:600;">${a.action}</td>
        <td style="text-align:center; color:#0071e3;">${a.owner}</td>
        <td style="text-align:center; color:#ff9500; font-weight:700;">${a.due}</td>
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
    .wrapper { max-width: 840px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 28px 24px; border: 1px solid #e5e5ea; }
    @media (min-width: 640px) { .wrapper { padding: 40px 48px; border-radius: 20px; } }
    .header { border-bottom: 2px solid #111; padding-bottom: 14px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
    @media (min-width: 500px) { .header { flex-direction: row; justify-content: space-between; align-items: flex-end; } }
    .header-title { font-size: 22px; font-weight: 800; color: #111; margin: 0; }
    .header-meta { font-size: 11px; color: #86868b; }
    .section-title { font-size: 13px; font-weight: 700; color: #111; text-transform: uppercase; margin: 20px 0 8px 0; display: flex; align-items: center; gap: 6px; }
    .section-title::before { content: ''; width: 4px; height: 13px; background: #0071e3; border-radius: 2px; }
    .box-decision { background: #f0f7ff; border-left: 4px solid #0071e3; padding: 12px 16px; border-radius: 8px; font-size: 13.5px; font-weight: 600; color: #004085; line-height: 1.6; }
    .box-gray { background: #f9f9fb; border: 1px solid #e5e5ea; border-radius: 8px; padding: 12px 16px; font-size: 13px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 12px; }
    th { background: #f5f5f7; padding: 8px 10px; text-align: left; font-weight: 600; border-bottom: 1px solid #d2d2d7; color: #666; }
    td { padding: 8px 10px; border-bottom: 1px solid #eee; line-height: 1.45; }
    .footer { text-align: center; font-size: 11px; color: #999; margin-top: 30px; padding-top: 14px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div>
        <div style="font-size: 11px; font-weight: 700; color: #0071e3; letter-spacing: 0.05em;">EXECUTIVE ONE-PAGER</div>
        <h1 class="header-title">Executive Decision Report</h1>
      </div>
      <div class="header-meta">
        Date: ${todayStr}<br>
        Chair: 설비구매 그룹장 (Orchestrator)
      </div>
    </div>

    <div class="section-title">1. Agenda & Context</div>
    <div class="box-gray">${agenda}</div>

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
      Generated via Debate Room Pro · Cross-Functional Decision Simulator
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Executive_Report_${new Date().toISOString().slice(0, 10)}.html`;
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
      { name: newDeptName.trim(), role: newDeptRole.trim(), enabled: true }
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
    setTimeLeft(sessionMin * 60);
    setSummaryData(null);
    setMessages([{ speaker: "👑 Orchestrator", speech: "회의가 초기화되었습니다. 안건을 준비해 주세요." }]);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progress = Math.min(100, Math.max(0, (timeLeft / (sessionMin * 60)) * 100));

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col p-3 sm:p-6 font-sans">
      {/* 1. 상단 슬림 헤더: 모바일/폴더블 유연 줄바꿈 적용 */}
      <header className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl sm:rounded-full px-4 sm:px-6 py-2.5 sm:py-3 mb-4 sm:mb-6 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-blue-500 font-bold text-base sm:text-lg">⌘</span>
          <span className="font-bold tracking-tight text-white text-sm sm:text-base">Debate Room Pro</span>
          <span className="hidden xs:inline text-[11px] sm:text-xs text-zinc-400 border-l border-zinc-700 pl-2 sm:pl-3">
            Next.js + FastAPI
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {saveAlert && (
            <span className="text-[11px] sm:text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 sm:px-3 py-1 rounded-full animate-in fade-in">
              ✓ 보관됨
            </span>
          )}

          {/* 회의 보관함 모달 */}
          <Dialog open={isArchiveOpen} onOpenChange={setIsArchiveOpen}>
            <DialogTrigger className="inline-flex items-center justify-center rounded-full text-[11px] sm:text-xs font-medium border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-3 py-1.5 transition-colors gap-1 cursor-pointer">
              🗄️ 보관함 ({archives.length})
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-xl max-h-[85vh] overflow-y-auto w-[92vw] sm:w-full rounded-2xl p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="text-sm sm:text-base font-bold text-white flex items-center justify-between">
                  <span>🗄️ 과거 회의 기록 보관함</span>
                  <span className="text-xs font-normal text-zinc-400">총 {archives.length}건</span>
                </DialogTitle>
              </DialogHeader>

              {archives.length === 0 ? (
                <div className="py-10 text-center text-zinc-500 text-xs">
                  보관된 회의 기록이 없습니다.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 pt-2">
                  {archives.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => loadArchive(item)}
                      className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-blue-500/50 cursor-pointer transition-all flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-blue-400">{item.savedAt}</span>
                        <button
                          onClick={(e) => deleteArchive(item.id, e)}
                          className="text-[11px] text-zinc-500 hover:text-rose-400 px-1.5 py-0.5 rounded"
                        >
                          삭제
                        </button>
                      </div>
                      <div className="text-xs font-bold text-zinc-100 line-clamp-1">{item.agenda}</div>
                      {item.summaryData?.bottom_line && (
                        <div className="text-[11px] text-zinc-400 line-clamp-1 bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/60">
                          {item.summaryData.bottom_line}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* 환경설정 모달 */}
          <Dialog>
            <DialogTrigger className="inline-flex items-center justify-center rounded-full text-[11px] sm:text-xs font-medium border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-200 px-3 py-1.5 transition-colors gap-1 cursor-pointer">
              ⚙️ 설정
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-md max-h-[85vh] overflow-y-auto w-[92vw] sm:w-full rounded-2xl p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="text-sm sm:text-base font-bold text-white">⚙️ 회의실 환경설정</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-3 pt-2 border-b border-zinc-800 pb-4">
                <span className="text-xs font-semibold text-zinc-400 uppercase">1. AI 엔진</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setEngine("groq"); setModel("openai/gpt-oss-120b"); }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      engine === "groq" ? "bg-blue-600/15 border-blue-500 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400"
                    }`}
                  >
                    <div className="text-xs font-bold">⚡ Groq</div>
                    <div className="text-[10px] text-zinc-500">gpt-oss-120b</div>
                  </button>
                  <button
                    onClick={() => { setEngine("gemini"); setModel("gemini-2.5-flash"); }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      engine === "gemini" ? "bg-blue-600/15 border-blue-500 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400"
                    }`}
                  >
                    <div className="text-xs font-bold">✨ Gemini</div>
                    <div className="text-[10px] text-zinc-500">gemini-2.5-flash</div>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2 border-b border-zinc-800 pb-4">
                <span className="text-xs font-semibold text-zinc-400 uppercase">
                  2. 참석 부서 ({activeDepts.length}/{departments.length})
                </span>
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                  {departments.map((d) => (
                    <div
                      key={d.name}
                      onClick={() => toggleDept(d.name)}
                      className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer ${
                        d.enabled ? "bg-zinc-900 border-zinc-700 text-zinc-100" : "bg-zinc-950 border-zinc-800/60 text-zinc-600 opacity-60"
                      }`}
                    >
                      <span className="text-xs font-semibold">{d.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${d.enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>
                        {d.enabled ? "참석" : "불참"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAddDept} className="flex flex-col gap-2 pt-2">
                <span className="text-xs font-semibold text-zinc-400 uppercase">+ 새 부서 추가</span>
                <input
                  type="text"
                  placeholder="부서명 (예: 🌿 EHS)"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200"
                />
                <input
                  type="text"
                  placeholder="주요 관심사/KPI"
                  value={newDeptRole}
                  onChange={(e) => setNewDeptRole(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200"
                />
                <Button type="submit" size="sm" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-xl mt-1">
                  부서 등록
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* 2. 메인 관제 뷰: md(태블릿/폴더블 펼침 화면) 이상에서 2열 분할 시작! */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto w-full">
        {/* 메인 회의 콘솔 (모바일: 전체, 폴더블 펼침: 좌측 2칸, 데스크톱: 좌측 3칸) */}
        <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-4">
          {/* 안건 카드 */}
          <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
            <CardHeader className="p-3.5 sm:p-4 pb-2">
              <CardTitle className="text-xs sm:text-sm font-semibold text-zinc-300">회의 안건 (Agenda)</CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-4 pt-0 flex flex-col gap-2.5">
              <Textarea
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                disabled={isDebating}
                placeholder="논의할 현안을 입력하세요..."
                className="bg-zinc-900/80 border-zinc-800 focus-visible:ring-blue-500 resize-none h-16 text-xs sm:text-sm"
              />

              {/* 부서 선택 스크롤 탭 & 단독 발언 버튼 */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  {activeDepts.map((dept) => (
                    <button
                      key={dept.name}
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
                  onClick={() => requestSingleTurnStream(selectedDept)}
                  disabled={isDebating}
                  variant="outline"
                  className="rounded-full text-[11px] sm:text-xs border-zinc-700 hover:bg-zinc-800 text-zinc-300 shrink-0 h-8"
                >
                  단독 발언 요청
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 실시간 회의록 (모바일 화면 비율 최적화 높이) */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-5 overflow-y-auto max-h-[42vh] sm:max-h-[440px] flex flex-col gap-2.5 sm:gap-3 shadow-inner">
            <div className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider flex justify-between">
              <span>Discussion Transcript (실시간 회의록)</span>
              {isDebating && <span className="text-blue-400 animate-pulse font-mono">Auto Relay Active...</span>}
            </div>
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl max-w-[95%] sm:max-w-[90%] border transition-all ${
                  m.speaker.includes("Orchestrator")
                    ? "ml-auto bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                    : "bg-zinc-900/90 border-zinc-800/80 text-zinc-200"
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-xs font-bold tracking-wide text-zinc-200">{m.speaker}</span>
                  <span className="text-[9px] sm:text-[10px] opacity-70">Turn #{idx + 1}</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                  {m.speech || <span className="inline-block w-1.5 h-3.5 bg-blue-500 animate-pulse align-middle"></span>}
                </p>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* 조율자 개입 바: 모바일 대응 레이아웃 */}
          <form onSubmit={handleSendOrchestrator} className="flex flex-col sm:flex-row gap-2 bg-zinc-900/90 border border-blue-500/30 rounded-2xl p-2 shadow-lg shadow-blue-900/10">
            <div className="flex items-center gap-1.5 px-2">
              <span className="text-xs font-bold text-blue-400 whitespace-nowrap">👑 조율자 지침</span>
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={orchestratorInput}
                onChange={(e) => setOrchestratorInput(e.target.value)}
                placeholder="지침 입력 (예: 4주 Buffer 확보 전제)..."
                className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs px-3 sm:px-4 shrink-0">
                전송
              </Button>
            </div>
          </form>

          {/* 로딩 인디케이터 */}
          {isSummarizing && (
            <div className="p-4 sm:p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-center animate-pulse">
              <span className="text-blue-400 text-xs sm:text-sm font-semibold">📋 CEO 직속 Executive Briefing 작성 중...</span>
            </div>
          )}

          {/* Executive Summary 카드 (모바일 1열, 데스크톱/폴더블 2열 그리드) */}
          {summaryData && (
            <div className="flex flex-col gap-3 sm:gap-4 p-4 sm:p-6 bg-zinc-950 border border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl animate-in fade-in duration-300">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-blue-500 text-base sm:text-lg">📋</span>
                  <span className="font-bold text-white text-sm sm:text-base">Executive Summary</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={() => saveToArchive(summaryData, messages)}
                    size="sm"
                    variant="outline"
                    className="rounded-full border-zinc-700 hover:bg-zinc-800 text-[11px] sm:text-xs text-zinc-300 px-3 h-8"
                  >
                    💾 보관함 저장
                  </Button>
                  <Button
                    onClick={handleDownloadHtmlReport}
                    size="sm"
                    className="rounded-full bg-blue-600 hover:bg-blue-500 text-[11px] sm:text-xs font-semibold px-3.5 h-8 shadow-md shadow-blue-600/30"
                  >
                    📥 보고서 (.html)
                  </Button>
                </div>
              </div>

              {/* Bottom Line */}
              <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-950/40 to-zinc-900/40 border border-blue-500/30 rounded-xl sm:rounded-2xl">
                <div className="text-[10px] sm:text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">Bottom Line (최종 권고)</div>
                <div className="text-xs sm:text-sm font-medium text-white leading-relaxed">{summaryData.bottom_line}</div>
              </div>

              {/* 리스크 & 매트릭스 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl flex flex-col gap-2">
                  <div className="text-xs font-bold text-rose-400">⚠️ Top 3 Key Risks</div>
                  {(summaryData.top_3_risks || []).map((r, i) => (
                    <div key={i} className="text-[11px] sm:text-xs leading-relaxed">
                      <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold mr-1 bg-rose-500/20 text-rose-400">
                        {r.level}
                      </span>
                      <strong className="text-zinc-200">{r.tag}:</strong> <span className="text-zinc-400">{r.desc}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl flex flex-col gap-2">
                  <div className="text-xs font-bold text-emerald-400">🤝 Alignment Matrix</div>
                  {(summaryData.alignment_matrix || []).map((m, i) => (
                    <div key={i} className="text-[11px] sm:text-xs leading-relaxed">
                      <strong className="text-blue-400">[{m.dept}]</strong> <span className="text-zinc-400">{m.issue}</span> ➔ <strong className="text-emerald-400">{m.resolution}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Actions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-zinc-400 mr-1">Next Actions:</span>
                {(summaryData.next_actions || []).map((a, i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-[11px] flex items-center gap-1.5">
                    <span className="text-zinc-200">{a.action}</span>
                    <span className="text-blue-400 font-semibold">{a.owner}</span>
                    <span className="text-amber-400 font-mono text-[10px]">{a.due}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 세션 제어 및 타이머 패널 (모바일: 하단, 폴더블 펼침/데스크톱: 우측 컬럼) */}
        <div className="md:col-span-1 lg:col-span-1 flex flex-col gap-4">
          <Card className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-zinc-800 text-zinc-100 text-center shadow-xl">
            <CardHeader className="p-3 sm:p-4 pb-1">
              <CardTitle className="text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                SESSION CLOCK
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 flex flex-col items-center">
              <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tighter text-white my-1 sm:my-2">
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </div>

              <div className="w-full bg-zinc-800 h-1.5 sm:h-2 rounded-full overflow-hidden mb-3 sm:mb-4 shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              {!isDebating && (
                <div className="flex items-center gap-1.5 mb-3 sm:mb-4">
                  <span className="text-xs text-zinc-400">시간:</span>
                  {[1, 3, 5].map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setSessionMin(m);
                        setTimeLeft(m * 60);
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        sessionMin === m ? "bg-zinc-700 text-white" : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {m}분
                    </button>
                  ))}
                </div>
              )}

              <div className="w-full flex flex-col gap-2">
                {!isDebating ? (
                  <Button
                    onClick={handleStart}
                    className="w-full rounded-full bg-blue-600 hover:bg-blue-500 font-semibold text-xs py-4 sm:py-5 shadow-lg shadow-blue-600/30"
                  >
                    ▶ 핑퐁 토론 시작 ({sessionMin}분)
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => setIsPaused(!isPaused)}
                      variant="outline"
                      className="w-full rounded-full border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs"
                    >
                      {isPaused ? "▶ 재개하기" : "❚❚ 일시정지"}
                    </Button>
                    <Button
                      onClick={handleFinishAndSummarize}
                      variant="destructive"
                      className="w-full rounded-full text-xs font-semibold"
                    >
                      ■ 종료 & 요약 보고
                    </Button>
                  </>
                )}

                {!isDebating && messages.length > 2 && !summaryData && (
                  <Button
                    onClick={handleFinishAndSummarize}
                    variant="outline"
                    className="w-full rounded-full text-xs border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                  >
                    📋 요약 브리핑 생성
                  </Button>
                )}

                <Button
                  variant="ghost"
                  onClick={handleReset}
                  className="w-full rounded-full text-zinc-500 hover:text-zinc-300 text-xs mt-0.5"
                >
                  새 회의 준비 (Reset)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}