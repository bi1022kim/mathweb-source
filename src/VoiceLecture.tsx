import { useEffect, useRef, useState } from "react";
import katex from "katex";
import { voiceLessons, writeFrames } from "./voiceLessons";

function MathBlock({ tex }: { tex: string }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: true });
  return <div className="voice-math" dangerouslySetInnerHTML={{ __html: html }} />;
}

function MathLine({ text }: { text: string }) {
  const html = text
    .split(/(\$[^$]+\$)/)
    .map((part) => {
      if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
        return katex.renderToString(part.slice(1, -1), { throwOnError: false });
      }
      return part.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    })
    .join("");
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function VoiceLecture({ onBack }: { onBack: () => void }) {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [shown, setShown] = useState(-1);
  const [ink, setInk] = useState(1);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playingRef = useRef(false);
  const indexRef = useRef(0);
  const lessonRef = useRef(voiceLessons[0]);

  const lesson = voiceLessons[lessonIndex];
  lessonRef.current = lesson;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      if (!playingRef.current) return;
      const next = indexRef.current + 1;
      const steps = lessonRef.current.steps;
      if (next >= steps.length) {
        playingRef.current = false;
        setPlaying(false);
        return;
      }
      indexRef.current = next;
      setShown(next);
      setInk(1);
      audio.src = steps[next].audio;
      void audio.play();
    };
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, []);

  useEffect(() => {
    if (!playing) return;
    let handle = 0;
    const tick = () => {
      const audio = audioRef.current;
      if (audio?.duration && playingRef.current) {
        const frames = writeFrames(lessonRef.current.steps[indexRef.current]?.latex ?? "");
        const progress = Math.min(1, audio.currentTime / audio.duration);
        const next = Math.max(1, Math.ceil(progress * frames.length));
        setInk((prev) => (prev === next ? prev : next));
      }
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [playing]);

  const stop = () => {
    playingRef.current = false;
    setPlaying(false);
    audioRef.current?.pause();
  };

  const playFrom = (index: number) => {
    const step = lesson.steps[index];
    const audio = audioRef.current;
    if (!step || !audio) return;
    indexRef.current = index;
    playingRef.current = true;
    setPlaying(true);
    setShown(index);
    setInk(1);
    audio.src = step.audio;
    void audio.play();
  };

  const chooseLesson = (index: number) => {
    stop();
    setLessonIndex(index);
    setShown(-1);
    setInk(1);
  };

  return (
    <main className="voice-lecture">
      <header className="voice-top">
        <button className="session-back" onClick={onBack} type="button">← 처음으로</button>
        <span className="session-unit">고3 입시 수학 · 음성 풀이</span>
        <span className="session-count">{lessonIndex + 1}/{voiceLessons.length}</span>
      </header>

      <div className="voice-body">
        <div className="voice-switch">
          {voiceLessons.map((item, index) => (
            <button
              className={index === lessonIndex ? "active" : ""}
              key={item.id}
              onClick={() => chooseLesson(index)}
              type="button"
            >
              {item.subject}
            </button>
          ))}
        </div>

        <p className="voice-kicker">{lesson.subject}</p>
        <h1>{lesson.title}</h1>
        <div className="voice-problem">
          <MathLine text={lesson.prompt} />
        </div>

        <div className="voice-board" aria-live="polite">
          {shown < 0 && <p className="voice-wait">풀이를 들으면 이 자리에 과정이 나타납니다.</p>}
          {lesson.steps.slice(0, shown + 1).map((step, index) => {
            const frames = writeFrames(step.latex);
            const writing = index === shown && playing;
            const tex = writing ? frames[Math.min(ink, frames.length) - 1] : step.latex;
            return (
              <div className={writing ? "voice-step current writing" : "voice-step"} key={step.audio}>
                <div className="voice-ink">
                  <MathBlock tex={tex} />
                  {writing && <span className="voice-pen" aria-hidden="true" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="voice-controls">
          {!playing ? (
            <button className="primary-button" onClick={() => playFrom(shown < 0 || shown >= lesson.steps.length - 1 ? 0 : shown)} type="button">
              {shown < 0 ? "풀이 듣기" : shown >= lesson.steps.length - 1 ? "처음부터 다시 듣기" : "이어서 듣기"}
            </button>
          ) : (
            <button className="session-back" onClick={stop} type="button">잠시 멈추기</button>
          )}
          <p>말하는 동안 수식이 왼쪽부터 순서대로 써집니다.</p>
        </div>
      </div>
      <audio ref={audioRef} preload="auto" />
    </main>
  );
}
