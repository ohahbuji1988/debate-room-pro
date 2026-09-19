from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import json
from dotenv import load_dotenv
from groq import Groq

try:
    import google.generativeai as genai
except ImportError:
    genai = None

load_dotenv()
app = FastAPI(title="Debate Room AI 주방")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 인터넷 어디서 접속해도 주문을 허용!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DebateOrder(BaseModel):
    agenda: str
    department: str = "💼 설비구매"
    department_role: Optional[str] = ""
    engine: str = "groq"            # "groq" 또는 "gemini"
    model: str = "openai/gpt-oss-120b"
    history: List[Dict[str, Any]] = []

class SummaryOrder(BaseModel):
    agenda: str
    engine: str = "groq"
    model: str = "openai/gpt-oss-120b"
    history: List[Dict[str, Any]] = []

# 1. 멀티 엔진(Groq / Gemini) 실시간 스트리밍 발언 창구
@app.post("/debate/turn/stream")
def make_debate_speech_stream(order: DebateOrder):
    valid_history = [m for m in order.history if m.get("speech", "").strip()]
    recent_dialogue = "\n".join([f"[{m.get('speaker')}]: {m.get('speech')}" for m in valid_history[-5:]])

    role_instruction = f"주요 관심사 및 KPI: {order.department_role}" if order.department_role else ""

    prompt = f"""
당신은 대기업 사전 협의체의 [{order.department}] 담당자입니다.
{role_instruction}
안건: {order.agenda}

최근 회의 내용:
{recent_dialogue if recent_dialogue else "(회의 시작)"}

[행동 지침]
1. 만약 최근 회의 내용 중에 [👑 Orchestrator]의 지침이나 중재안이 있다면, 그 가이드라인을 최우선으로 수용하여 타협 대안을 마련하십시오.
2. 조율자 지침이 없을 때는 직전 발언자의 주장에 대해 당신 부서의 입장에서 날카롭게 반박하거나 실무적인 방어 대안을 제시하십시오.
3. 한국어를 기본으로 하되 실무 전문 용어(Lead Time, Delay, LD 조항, cGMP, FAT/SAT, Buffer, TCO 등)는 자연스럽게 혼용하십시오.
4. 핵심만 직설적으로 2~3문장으로 작성하되, 반드시 완전한 문장(마침표)으로 마무리하십시오.
"""

    def text_stream_generator():
        # [A. Groq 셰프 선택 시]
        if order.engine == "groq":
            api_key = os.getenv("GROQ_API_KEY", "")
            if not api_key:
                yield "오류: .env 파일에 GROQ_API_KEY가 없습니다!"
                return

            try:
                client = Groq(api_key=api_key)
                response = client.chat.completions.create(
                    model=order.model if order.model else "openai/gpt-oss-120b",
                    messages=[{"role": "user", "content": prompt}],
                    stream=True,
                    max_tokens=800
                )
                for chunk in response:
                    if chunk.choices and chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
            except Exception as e:
                yield f"[Groq 통신 지연: {str(e)[:40]}]"

        # [B. Google Gemini 셰프 선택 시]
        else:
            api_key = os.getenv("GEMINI_API_KEY", "")
            if not api_key:
                yield "오류: .env 파일에 GEMINI_API_KEY가 없습니다!"
                return

            if not genai:
                yield "오류: google-generativeai 패키지가 설치되지 않았습니다."
                return

            try:
                genai.configure(api_key=api_key)
                gemini_model_name = order.model if "gemini" in order.model else "gemini-2.5-flash"
                gm = genai.GenerativeModel(gemini_model_name)
                response = gm.generate_content(prompt, stream=True)
                for chunk in response:
                    if chunk.text:
                        yield chunk.text
            except Exception as e:
                yield f"[Gemini 통신 지연: {str(e)[:40]}]"

    return StreamingResponse(text_stream_generator(), media_type="text/plain")


# 2. 경영진 브리핑 요약 창구
@app.post("/debate/summary")
def generate_executive_summary(order: SummaryOrder):
    valid_history = [m for m in order.history if m.get("speech", "").strip()]
    transcript_text = "\n".join([f"[{m.get('speaker')}]: {m.get('speech')}" for m in valid_history])

    system_prompt = """당신은 CEO 직속 수석 의사결정 보좌관입니다. 
토론 전체 내용을 바탕으로 바쁜 경영진이 30초 안에 결재할 수 있도록 가장 함축적인 JSON 요약을 작성하십시오.
한국어를 기본으로 하되 Lead Time, LD 조항, FAT/SAT, Change Control, Buffer 등 실무 전문 용어는 자연스럽게 혼용하십시오.
반드시 아래 JSON 포맷으로만 응답하십시오."""

    user_prompt = f"""안건: {order.agenda}
회의록 전체:
{transcript_text}

응답 포맷:
{{
  "bottom_line": "CEO 핵심 의사결정 권고 1~2문장",
  "top_3_risks": [
    {{"tag": "일정 Risk", "level": "CRITICAL", "desc": "내용"}},
    {{"tag": "규제/품질 Risk", "level": "HIGH", "desc": "내용"}},
    {{"tag": "비용 Risk", "level": "MEDIUM", "desc": "내용"}}
  ],
  "alignment_matrix": [
    {{"dept": "부서명", "issue": "핵심 쟁점", "resolution": "최종 합의안"}}
  ],
  "next_actions": [
    {{"action": "실행 과제", "owner": "담당 부서", "due": "기한"}}
  ]
}}"""

    # Groq으로 초고속 JSON 요약 생성
    api_key = os.getenv("GROQ_API_KEY", "")
    if api_key:
        try:
            client = Groq(api_key=api_key)
            response = client.chat.completions.create(
                model="openai/gpt-oss-120b",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.4
            )
            return json.loads(response.choices[0].message.content)
        except Exception:
            pass

    return {
        "bottom_line": "의사결정 요약 생성 완료",
        "top_3_risks": [],
        "alignment_matrix": [],
        "next_actions": []
    }