import { useMemo, useState } from "react";
import katex from "katex";
import { Icon } from "./icons";
import {
  gradeObjective,
  loadProgress,
  recordAnswer,
  resetUnit,
  type Question,
  type Unit,
} from "./quiz";

export type SessionMode = "resume" | "restart";

type Feedback = {
  isCorrect: boolean;
  feedback: string;
  correction: string;
  explanation: string;
};

// KaTeX로 $...$ 구간만 렌더, 나머지는 HTML escape
// large: 분수가 글자 높이로 줄어들지 않게 \displaystyle로 렌더 (문제·보기용)
function renderMathText(text: string, large = false): string {
  const parts = String(text ?? "").split(/(\$[^$]+\$)/);
  return parts
    .map((part) => {
      if (part.length > 2 && part.startsWith("$") && part.endsWith("$")) {
        const tex = (large ? "\\displaystyle " : "") + part.slice(1, -1);
        try {
          return katex.renderToString(tex, { throwOnError: false });
        } catch {
          return part;
        }
      }
      return part
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    })
    .join("");
}

function MathText({ text, large = false }: { text: string; large?: boolean }) {
  const html = useMemo(() => renderMathText(text, large), [text, large]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function initialState(unit: Unit, mode: SessionMode) {
  const slot = loadProgress()[unit.id];
  const answered = slot?.answered || {};
  const firstOpen = unit.questions.findIndex((q) => !(q.id in answered));
  if (mode === "restart" || firstOpen === -1) {
    return { current: 0, answers: {} as Record<number, string>, clearOnFirstAnswer: true };
  }
  const answers: Record<number, string> = {};
  unit.questions.forEach((q, idx) => {
    const pick = slot?.picks?.[q.id];
    if (q.id in answered && pick !== undefined) answers[idx] = pick;
  });
  return { current: firstOpen, answers, clearOnFirstAnswer: false };
}

export default function LearningSession({
  unit,
  mode,
  onBack,
}: {
  unit: Unit;
  mode: SessionMode;
  onBack: () => void;
}) {
  const [init] = useState(() => initialState(unit, mode));
  const [current, setCurrent] = useState(init.current);
  const [answers, setAnswers] = useState<Record<number, string>>(init.answers);
  const [clearOnFirstAnswer, setClearOnFirstAnswer] = useState(init.clearOnFirstAnswer);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);

  const questions = unit.questions;
  const question: Question | undefined = questions[current];

  const handleAnswer = (answer: string) => {
    if (feedback) return;
    setAnswers({ ...answers, [current]: answer });
  };

  const handleSubmit = () => {
    if (!question) return;
    const pick = answers[current] || "";
    const result = gradeObjective(question, pick);
    // 다시 풀기를 눌러도 실제로 답을 내기 전까지는 이전 점수를 지우지 않는다.
    if (clearOnFirstAnswer) {
      resetUnit(unit.id);
      setClearOnFirstAnswer(false);
    }
    recordAnswer(unit.id, question.id, result.isCorrect, pick);
    setFeedback({
      isCorrect: result.isCorrect,
      feedback: result.feedback,
      correction: result.isCorrect ? "" : result.correctText,
      explanation: result.explanation,
    });
  };

  const handleNext = () => {
    setFeedback(null);
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      const answered = loadProgress()[unit.id]?.answered || {};
      const correct = questions.filter((q) => answered[q.id] === true).length;
      setSessionScore(Math.round((correct / questions.length) * 100));
      setShowResults(true);
    }
  };

  const savedAnswers = showResults ? loadProgress()[unit.id]?.answered || {} : {};
  const wrongList = questions
    .map((q, idx) => ({ q, idx, given: answers[idx] }))
    .filter(({ q }) => savedAnswers[q.id] !== true);

  if (showResults) {
    return (
      <main className="session">
        <div className="session-card result-card">
          <div className="result-emoji">🎉</div>
          <h2>학습 완료!</h2>
          <p className="result-unit">{unit.title} 학습을 마쳤습니다!</p>
          <p className="result-score">{sessionScore}%</p>
          {wrongList.length > 0 && (
            <div className="review-list">
              <span className="mini-label">✏️ 다시 볼 문제 {wrongList.length}개</span>
              {wrongList.map(({ q, given }) => (
                <div className="review-item" key={q.id}>
                  <p className="review-question"><MathText text={q.question_text} /></p>
                  <p className="review-answer">
                    내 답: <strong><MathText text={given || "기록 없음"} /></strong>
                    {" · 정답: "}
                    <strong><MathText text={String(q.choices[q.answer])} /></strong>
                  </p>
                  {q.explanation && (
                    <p className="review-explain"><MathText text={q.explanation} /></p>
                  )}
                </div>
              ))}
            </div>
          )}
          <button className="primary-button" onClick={onBack} type="button">
            학습 대시보드로 돌아가기
          </button>
        </div>
      </main>
    );
  }

  if (!question) {
    return (
      <main className="session">
        <button className="primary-button" onClick={onBack} type="button">
          돌아가기
        </button>
      </main>
    );
  }

  return (
    <main className="session">
      <header className="session-topbar">
        <button className="session-back" onClick={onBack} type="button">
          <Icon name="back" size={16} /> 대시보드로
        </button>
        <span className="session-unit">{unit.title}</span>
        <span className="session-count">
          문제 {current + 1}/{questions.length}
        </span>
      </header>

      <div className="session-body">
        <div className="problem-card session-problem">
          <span className="problem-number">Q{current + 1}.</span>
          <p className="session-question">
            <MathText large text={question.question_text} />
          </p>
          <div className="session-choices">
            {question.choices.map((choice, i) => {
              const selected = answers[current] === choice;
              const locked = feedback !== null;
              const isAnswer = feedback !== null && i === question.answer;
              const isWrongPick = feedback !== null && selected && !isAnswer;
              return (
                <button
                  className={
                    "session-choice" +
                    (selected && !locked ? " selected" : "") +
                    (isAnswer ? " correct" : "") +
                    (isWrongPick ? " wrong" : "")
                  }
                  disabled={locked}
                  key={i}
                  onClick={() => handleAnswer(choice)}
                  type="button"
                >
                  <MathText large text={choice} />
                </button>
              );
            })}
          </div>
          {!feedback && answers[current] && (
            <button className="primary-button session-submit" onClick={handleSubmit} type="button">
              답 제출하기
            </button>
          )}
        </div>

        {feedback && (
          <div className="session-feedback">
            <div className={"feedback-banner " + (feedback.isCorrect ? "ok" : "no")}>
              <p>
                <MathText text={feedback.feedback} />
              </p>
              {feedback.correction && (
                <p className="feedback-correct">
                  정답: <strong>
                    <MathText text={feedback.correction} />
                  </strong>
                </p>
              )}
            </div>
            {feedback.explanation && (
              <div className="feedback-explain">
                <span className="mini-label">💡 해설</span>
                <p>
                  <MathText text={feedback.explanation} />
                </p>
              </div>
            )}
            <button className="primary-button" onClick={handleNext} type="button">
              {current < questions.length - 1 ? "다음 문제" : "결과 보기"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
