import { useEffect, useRef, useState } from "react";
import LearningSession, { type SessionMode } from "./LearningSession";
import VoiceLecture from "./VoiceLecture";
import { Icon } from "./icons";
import {
  buildUnits,
  loadProgress,
  loadQuestionBank,
  resetAllProgress,
  unitStats,
  type Progress,
  type QuestionBank,
  type Unit,
} from "./quiz";

type Route =
  | { view: "landing" }
  | { view: "dashboard" }
  | { view: "voice" }
  | { view: "learning"; unitId: number; mode: SessionMode };

// 화면 상태를 주소 해시에 두어 휴대폰 뒤로 가기가 앱 화면을 따라가게 한다.
function parseHash(): Route {
  const match = window.location.hash.match(/^#unit-(\d+)(\/again)?$/);
  if (match) return { view: "learning", unitId: Number(match[1]), mode: match[2] ? "restart" : "resume" };
  if (window.location.hash === "#dashboard") return { view: "dashboard" };
  if (window.location.hash === "#voice") return { view: "voice" };
  return { view: "landing" };
}

// questions.json의 단원 id 묶음. 단원을 바꾸면 여기도 같이 맞춘다.
const areas = [
  { label: "분수", name: "분수", ids: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { label: "소수", name: "소수", ids: [10, 11, 12, 13, 14, 15] },
  { label: "배수", name: "약수와 배수", ids: [16, 17, 18, 19] },
  { label: "계산", name: "혼합 계산·나눗셈", ids: [20, 21] },
  { label: "비율", name: "비와 비율", ids: [22, 23, 24] },
  { label: "도형", name: "도형의 넓이·부피·평균", ids: [25, 26, 27, 28, 29, 30] },
];

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <a className="brand" href="#top" aria-label="NUMI 홈" onClick={onClick}>
      <span className="brand-mark">
        <span>∑</span>
      </span>
      <span>NUMI</span>
    </a>
  );
}

const concepts = ["분수와 소수", "약수와 배수", "비와 비율", "도형의 넓이"];

function Dashboard({
  units,
  progress,
  onExit,
  onStartUnit,
  onResetAll,
}: {
  units: Unit[];
  progress: Progress;
  onExit: () => void;
  onStartUnit: (unit: Unit, mode: SessionMode) => void;
  onResetAll: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const visibleUnits = showAll ? units : units.slice(0, 6);
  const decorated = units.map((u) => ({ unit: u, ...unitStats(u, progress) }));
  const completed = decorated.filter((d) => d.done);
  const averageScore = completed.length
    ? Math.round((completed.reduce((sum, d) => sum + d.score, 0) / completed.length) * 10) / 10
    : 0;
  const nextUnit = decorated.find((d) => !d.done)?.unit ?? units[0];

  return (
    <main className="dashboard">
      <aside className="dashboard-sidebar">
        <Logo onClick={onExit} />
        <div className="sidebar-menu">
          <span className="sidebar-caption">LEARNING</span>
          <button className="sidebar-item active" type="button"><Icon name="home" />대시보드</button>
        </div>
        <div className="sidebar-profile">
          <span className="profile-avatar">게</span>
          <div><strong>게스트</strong><span>수학 학습</span></div>
          <button aria-label="학습 기록 초기화" title="학습 기록 초기화" onClick={() => setConfirmReset(true)} type="button"><Icon name="refresh" size={18} /></button>
          <button aria-label="로그아웃" onClick={onExit} type="button"><Icon name="logout" size={18} /></button>
        </div>
      </aside>

      {/* 휴대폰에서는 사이드바가 숨겨지므로 확인 창은 사이드바 밖에 둔다. */}
      {confirmReset && (
        <div className="reset-modal-backdrop" onClick={() => setConfirmReset(false)}>
          <div className="reset-modal" onClick={(e) => e.stopPropagation()}>
            <h3>학습 기록을 초기화할까요?</h3>
            <p>푼 문제와 점수가 모두 지워지고 처음부터 다시 시작돼요.</p>
            <div className="reset-modal-actions">
              <button className="reset-cancel" onClick={() => setConfirmReset(false)} type="button">취소</button>
              <button className="reset-confirm" onClick={() => { onResetAll(); setConfirmReset(false); }} type="button">초기화</button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="mobile-logo"><Logo onClick={onExit} /></div>
          <div className="dashboard-greeting">
            <span>AI 수학 튜터</span>
            <h1>오늘도 한 걸음 성장해 볼까요?</h1>
          </div>
          <div className="topbar-actions">
            <div className="streak-pill"><Icon name="layers" size={17} /><strong>{units.length}</strong>개 단원</div>
            <button className="topbar-reset" title="학습 기록 초기화" onClick={() => setConfirmReset(true)} type="button"><Icon name="refresh" size={17} /> 초기화</button>
            <span className="top-avatar">게</span>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-hero-card">
            <div className="dashboard-hero-copy">
              <div className="today-label"><span /> TODAY'S LEARNING</div>
              <h2>{nextUnit.title}{" "}<br />도전해 볼까요?</h2>
              <p>문제를 풀고 바로 해설로{" "}<br />이해를 확인해 보세요.</p>
              <button type="button" onClick={() => onStartUnit(nextUnit, "resume")}>
                이어서 학습하기 <Icon name="arrow" size={18} />
              </button>
            </div>
            <div className="goal-visual">
              <div className="goal-ring">
                <div><strong>{completed.length}</strong><span>/{units.length}</span><small>완료한 단원</small></div>
              </div>
              <span className="formula formula-a">⅔ + ¼</span>
              <span className="formula formula-b">a ÷ b</span>
              <span className="formula formula-c">5/8</span>
            </div>
          </section>

          <section className="stat-grid" aria-label="학습 현황">
            <article className="dashboard-stat">
              <span className="stat-icon lime"><Icon name="layers" /></span>
              <div><span>남은 학습</span><strong>{units.length - completed.length}<small>개</small></strong></div>
              <span className="stat-note">전체 {units.length}개 단원</span>
            </article>
            <article className="dashboard-stat">
              <span className="stat-icon blue"><Icon name="check" /></span>
              <div><span>완료한 학습</span><strong>{completed.length}<small>개</small></strong></div>
              <span className="stat-note positive">문제 {units.reduce((s, u) => s + u.questions.length, 0)}문항 수록</span>
            </article>
            <article className="dashboard-stat">
              <span className="stat-icon violet"><Icon name="target" /></span>
              <div><span>평균 점수</span><strong>{averageScore}<small>점</small></strong></div>
              <span className="stat-note positive">완료 단원 기준</span>
            </article>
          </section>

          <div className="dashboard-grid">
            <section className="lesson-section">
              <div className="panel-heading">
                <div><span className="mini-label">MY CURRICULUM</span><h2>나의 학습</h2></div>
                <button onClick={() => setShowAll((value) => !value)} type="button">
                  {showAll ? "접기" : "전체 보기"} <Icon name="arrow" size={16} />
                </button>
              </div>
              <div className="lesson-list">
                {visibleUnits.map((unit) => {
                  const stats = unitStats(unit, progress);
                  return (
                    <article className={"lesson-row " + (stats.done ? "active" : "")} key={unit.id}>
                      <div className="lesson-step">{String(unit.id).padStart(2, "0")}</div>
                      <div className="lesson-info">
                        <h3>{unit.title}</h3>
                        <p>{unit.questions.length}문항<span /><Icon name="clock" size={13} />{stats.done ? `완료 · ${stats.score}점` : stats.started ? "푸는 중" : "미완료"}</p>
                      </div>
                      <div className="lesson-progress">
                        <div><span style={{ width: `${stats.progressPercent}%` }} /></div>
                        <small>{stats.progressPercent}%</small>
                      </div>
                      <button onClick={() => onStartUnit(unit, stats.done ? "restart" : "resume")} type="button">
                        {stats.done ? "다시 풀기" : stats.started ? "이어서 풀기" : "시작하기"} <Icon name="arrow" size={16} />
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>

            <aside className="dashboard-side">
              <section className="weekly-card">
                <div className="panel-heading compact">
                  <div><span className="mini-label">PROGRESS BY AREA</span><h2>영역별 진도</h2></div>
                  <strong>{units.length ? Math.round((completed.length / units.length) * 100) : 0}%</strong>
                </div>
                <div className="week-chart">
                  {areas.map((area) => {
                    const areaRows = decorated.filter((d) => area.ids.includes(d.unit.id));
                    const doneCount = areaRows.filter((d) => d.done).length;
                    const pct = areaRows.length ? Math.round((doneCount / areaRows.length) * 100) : 0;
                    return (
                      <div key={area.label} title={`${area.name} ${doneCount}/${areaRows.length} 완료`}>
                        <span className={pct > 0 ? "today" : ""} style={{ height: `${pct}%` }} />
                        <small>{area.label}</small>
                      </div>
                    );
                  })}
                </div>
                <p><Icon name="bolt" size={15} /> 단원을 끝낼 때마다 <strong>막대가 올라가요</strong>.</p>
              </section>
              <section className="ai-coach-card">
                <span className="coach-icon"><Icon name="spark" /></span>
                <span className="mini-label">AI COACH</span>
                <h3>틀려도 괜찮아요.<br />해설로 다시 이해해요.</h3>
                <p>문제를 풀고 맞·틀 판정과 수식 해설을 바로 확인할 수 있어요.</p>
                <button type="button" onClick={() => onStartUnit(nextUnit, "resume")}>이어서 학습하기 <Icon name="arrow" size={16} /></button>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseHash());
  // 같은 단원으로 다시 들어와도 문제 화면을 새로 그리도록 이동할 때마다 올린다.
  const [visit, setVisit] = useState(0);
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [loadError, setLoadError] = useState(false);
  const enteredFromDashboard = useRef(false);

  useEffect(() => {
    loadQuestionBank()
      .then((data) => setBank(data))
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    const syncRoute = () => {
      setProgress(loadProgress());
      setRoute(parseHash());
      setVisit((n) => n + 1);
    };
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  const units = bank ? buildUnits(bank) : [];

  const navigate = (hash: string) => {
    window.history.pushState(null, "", hash || window.location.pathname + window.location.search);
    setProgress(loadProgress());
    setRoute(parseHash());
    setVisit((n) => n + 1);
    window.scrollTo({ top: 0 });
  };

  const openDashboard = () => navigate("#dashboard");

  const closeDashboard = () => {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setRoute({ view: "landing" });
  };

  const startUnit = (unit: Unit, mode: SessionMode) => {
    enteredFromDashboard.current = true;
    navigate(`#unit-${unit.id}${mode === "restart" ? "/again" : ""}`);
  };

  const handleResetAll = () => {
    resetAllProgress();
    setProgress(loadProgress());
  };

  const finishUnit = () => {
    if (enteredFromDashboard.current) {
      enteredFromDashboard.current = false;
      window.history.back();
      return;
    }
    // 문제 주소로 바로 들어온 경우에는 뒤로 갈 대시보드 기록이 없다.
    window.history.replaceState(null, "", "#dashboard");
    setProgress(loadProgress());
    setRoute({ view: "dashboard" });
  };

  const moveToRoles = () => {
    document.querySelector("#start")?.scrollIntoView({ behavior: "smooth" });
  };

  if (route.view === "voice") {
    return <VoiceLecture onBack={closeDashboard} />;
  }

  if (route.view === "learning") {
    const unit = units.find((u) => u.id === route.unitId);
    if (unit) {
      return (
        <LearningSession
          key={`${unit.id}-${route.mode}-${visit}`}
          mode={route.mode}
          onBack={finishUnit}
          unit={unit}
        />
      );
    }
  }

  if (route.view === "dashboard" || route.view === "learning") {
    if (!bank) {
      return (
        <main className="session">
          <p className="session-loading">{loadError ? "문제를 불러오지 못했습니다." : "불러오는 중..."}</p>
        </main>
      );
    }
    return (
      <Dashboard
        onExit={closeDashboard}
        onStartUnit={startUnit}
        onResetAll={handleResetAll}
        progress={progress}
        units={units}
      />
    );
  }

  return (
    <main id="top">
      <nav className="nav shell" aria-label="주요 메뉴">
        <Logo />
        <div className="nav-links">
          <a href="#how">학습 방식</a>
          <a href="#results">학습 효과</a>
          <a href="#start">시작하기</a>
        </div>
      </nav>

      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow">
            <Icon name="spark" size={16} />
            <span>나만을 위한 AI 수학 코치</span>
          </div>
          <h1>
            막히는 순간,
            <br />
            <span>이해가 시작돼요.</span>
          </h1>
          <p className="hero-description">
            답만 알려주는 대신, 스스로 풀 수 있도록 생각의 길을 열어주는
            <strong> 가장 똑똑한 수학 학습 습관.</strong>
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={moveToRoles} type="button">
              무료로 학습 시작하기
              <Icon name="arrow" size={19} />
            </button>
            <a className="text-link" href="#how">
              <span className="play-icon">
                <Icon name="play" size={17} />
              </span>
              어떻게 학습하나요?
            </a>
          </div>
          <div className="hero-proof">
            <div className="avatars" aria-hidden="true">
              <span>초</span>
              <span>등</span>
              <span>수</span>
              <span>+</span>
            </div>
            <p>
              <strong>초등 3~6학년 수학</strong> 단원 30개 · 문제 60문항
            </p>
          </div>
        </div>

        <div className="hero-visual" aria-label="AI 수학 학습 화면 미리보기">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="math-symbol symbol-one">π</div>
          <div className="math-symbol symbol-two">x²</div>
          <div className="app-window">
            <div className="window-bar">
              <Logo />
              <div className="window-progress">
                <span>학습 진행률 예시</span>
                <strong>72%</strong>
              </div>
            </div>
            <div className="window-body">
              <div className="lesson-heading">
                <div>
                  <span className="mini-label">STEP 03 · 분수의 덧셈</span>
                  <h2>통분해서 더해 볼까요?</h2>
                </div>
                <span className="streak"><Icon name="bolt" size={16} /> 바로 해설</span>
              </div>
              <div className="problem-card">
                <span className="problem-number">Q.</span>
                <p>
                  <strong>1/2 + 1/4</strong>를 기약분수로 구하세요.
                </p>
                <div className="answer-grid">
                  <span className="selected">3/4</span>
                  <span>2/6</span>
                  <span>1/8</span>
                  <span>2/4</span>
                </div>
              </div>
              <div className="ai-tip">
                <span className="tip-icon"><Icon name="spark" size={17} /></span>
                <p><strong>좋아요!</strong> 통분하면 2/4 + 1/4 = 3/4가 돼요.</p>
              </div>
            </div>
          </div>
          <div className="floating-card score-card">
            <span className="floating-icon green"><Icon name="graph" size={20} /></span>
            <div><strong>30개</strong><span>학습 단원</span></div>
          </div>
          <div className="floating-card time-card">
            <span className="floating-icon blue"><Icon name="clock" size={20} /></span>
            <div><strong>60문항</strong><span>정답 해설 포함</span></div>
          </div>
        </div>
      </section>

      <section className="metrics" id="results">
        <div className="shell metrics-grid">
          <div><strong>30개</strong><span>학습 단원</span></div>
          <div><strong>60문항</strong><span>정답 해설 포함</span></div>
          <div><strong>즉시</strong><span>맞·틀 판정</span></div>
          <div><strong>무료</strong><span>로그인 없이 학습</span></div>
        </div>
      </section>

      <section className="how-section shell" id="how">
        <div className="section-heading">
          <span className="mini-label">NUMI LEARNING LOOP</span>
          <h2>모르는 문제를, 아는 개념으로.</h2>
          <p>매일의 작은 이해가 자신감이 되도록 학습 전 과정을 함께합니다.</p>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <span className="feature-index">01</span>
            <span className="feature-icon"><Icon name="book" size={25} /></span>
            <h3>문제를 만나고</h3>
            <p>단원을 골라 부담 없이 오늘의 학습을 시작해요.</p>
          </article>
          <article className="feature-card featured">
            <span className="feature-index">02</span>
            <span className="feature-icon"><Icon name="spark" size={25} /></span>
            <h3>답을 고르고</h3>
            <p>객관식 답을 선택하면 맞았는지 바로 판정해 줘요.</p>
          </article>
          <article className="feature-card">
            <span className="feature-index">03</span>
            <span className="feature-icon"><Icon name="graph" size={25} /></span>
            <h3>해설로 이해해요</h3>
            <p>틀려도 괜찮아요. 수식 해설로 스스로 이해해요.</p>
          </article>
        </div>
      </section>

      <section className="personal-section" id="start">
        <div className="shell personal-layout">
          <div className="personal-copy">
            <span className="mini-label">PERSONALIZED FOR YOU</span>
            <h2>누구에게나 다른<br />수학의 시작점.</h2>
            <p>오늘 단원 하나부터 부담 없이 시작해 보세요.</p>
            <div className="concept-list">
              {concepts.map((concept) => (
                <span key={concept}><Icon name="check" size={15} />{concept}</span>
              ))}
            </div>
          </div>
          <div className="role-panel">
            <div className="role-content">
              <span className="role-icon">
                <Icon name="student" size={31} />
              </span>
              <span className="mini-label">FOR STUDENTS</span>
              <h3>내 속도대로, 제대로 이해하기</h3>
              <p>틀려도 괜찮아요. 정답과 해설로 스스로 풀어내는 힘을 길러요.</p>
              <button className="role-button" onClick={openDashboard} type="button">
                학생으로 시작하기
                <Icon name="arrow" size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer shell">
        <Logo />
        <p>어려운 수학이, 기다려지는 시간이 되도록.</p>
        <button className="voice-entry" onClick={() => navigate("#voice")} type="button">고3 음성 풀이 2문제</button>
        <span>© 2026 AI 수학 튜터</span>
      </footer>
    </main>
  );
}
