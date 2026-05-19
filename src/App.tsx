import { useEffect, useMemo, useState } from "react";
import bankData from "../data/question-banks/lesbti-relationship-bank.v1.json";
import {
  calculateQuizResult,
  drawQuestions,
  type QuestionItem,
  type QuizAnswerMap,
  type QuizResult,
  type RelationshipBank,
  type StyleId,
} from "./testEngine";
import { RadarChart } from "./radar";

type AppView = "landing" | "quiz" | "result";

type PersistedQuizState = {
  answers: QuizAnswerMap;
  currentIndex: number;
  questionIds: string[];
  view: AppView;
};

const bank = bankData as RelationshipBank;
const QUIZ_STATE_STORAGE_KEY = "lesbti-test:quiz-state";

const styleThemes: Record<
  StyleId,
  {
    accentClass: string;
    badge: string;
    shortLabel: string;
  }
> = {
  direct_push: {
    accentClass: "accent-ember",
    badge: "推进",
    shortLabel: "直球推进",
  },
  soft_lead: {
    accentClass: "accent-sand",
    badge: "稳场",
    shortLabel: "温柔掌舵",
  },
  reverse_gap: {
    accentClass: "accent-olive",
    badge: "拿捏",
    shortLabel: "反差掌控",
  },
  high_sensitive: {
    accentClass: "accent-rose",
    badge: "感受",
    shortLabel: "高敏拉扯",
  },
};

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function renderStyleGlyph(styleId: StyleId) {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (styleId) {
    case "direct_push":
      return (
        <svg {...commonProps}>
          <path d="M4.5 12h12.5" />
          <path d="m12.5 6.2 5.8 5.8-5.8 5.8" />
          <path d="M4.5 6.2v11.6" />
        </svg>
      );
    case "soft_lead":
      return (
        <svg {...commonProps}>
          <path d="M12 19.5s-6-3.5-6-8.1c0-2.3 1.7-4 3.8-4 1.2 0 2.1.5 2.2 1.3.1-.8 1-1.3 2.2-1.3 2.1 0 3.8 1.7 3.8 4 0 4.6-6 8.1-6 8.1Z" />
          <path d="M8.4 13.2c1 .8 2.1 1.2 3.6 1.2 1.5 0 2.7-.4 3.6-1.2" />
        </svg>
      );
    case "reverse_gap":
      return (
        <svg {...commonProps}>
          <path d="M6 7.5h12" />
          <path d="M6 16.5h12" />
          <path d="m9.2 10.2 2.8 2.8 2.8-2.8" />
          <path d="m14.8 13.8-2.8-2.8-2.8 2.8" />
        </svg>
      );
    case "high_sensitive":
      return (
        <svg {...commonProps}>
          <path d="M12 3.8 13.8 9l5.4.2-4.3 3.3 1.6 5.3-4.5-3-4.5 3 1.6-5.3-4.3-3.3L10.2 9 12 3.8Z" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="6" />
        </svg>
      );
  }
}

function restorePersistedQuizState() {
  const defaultState = {
    answers: {},
    currentIndex: 0,
    drawnQuestions: [] as QuestionItem[],
    result: null as QuizResult | null,
    view: "landing" as AppView,
  };

  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const rawState = window.localStorage.getItem(QUIZ_STATE_STORAGE_KEY);

    if (!rawState) {
      return defaultState;
    }

    const parsedState = JSON.parse(rawState) as Partial<PersistedQuizState>;

    if (
      parsedState.view !== "landing" &&
      parsedState.view !== "quiz" &&
      parsedState.view !== "result"
    ) {
      return defaultState;
    }

    if (!Array.isArray(parsedState.questionIds)) {
      return defaultState;
    }

    const questionMap = new Map(bank.questions.map((question) => [question.id, question]));
    const drawnQuestions = parsedState.questionIds
      .map((questionId) => questionMap.get(questionId))
      .filter((question): question is QuestionItem => Boolean(question));

    if (!drawnQuestions.length && parsedState.view !== "landing") {
      return defaultState;
    }

    const answers = Object.entries(parsedState.answers ?? {}).reduce<QuizAnswerMap>(
      (accumulator, [questionId, optionId]) => {
        const matchingQuestion = questionMap.get(questionId);

        if (!matchingQuestion) {
          return accumulator;
        }

        const hasMatchingOption = matchingQuestion.options.some((option) => option.id === optionId);

        if (!hasMatchingOption) {
          return accumulator;
        }

        return {
          ...accumulator,
          [questionId]: optionId,
        };
      },
      {},
    );

    const safeIndex =
      typeof parsedState.currentIndex === "number"
        ? Math.min(Math.max(parsedState.currentIndex, 0), Math.max(drawnQuestions.length - 1, 0))
        : 0;

    const isComplete =
      drawnQuestions.length > 0 && Object.keys(answers).length >= bank.draw_policy.required_answer_count;

    if (parsedState.view === "result" || isComplete) {
      return {
        answers,
        currentIndex: Math.max(drawnQuestions.length - 1, 0),
        drawnQuestions,
        result: calculateQuizResult(bank, drawnQuestions, answers),
        view: "result" as AppView,
      };
    }

    if (parsedState.view === "quiz" && drawnQuestions.length > 0) {
      return {
        answers,
        currentIndex: safeIndex,
        drawnQuestions,
        result: null,
        view: "quiz" as AppView,
      };
    }

    return defaultState;
  } catch {
    return defaultState;
  }
}

function App() {
  const restoredQuizState = useMemo(() => restorePersistedQuizState(), []);
  const [view, setView] = useState<AppView>(restoredQuizState.view);
  const [agreed, setAgreed] = useState(true);
  const [showTerms, setShowTerms] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [drawnQuestions, setDrawnQuestions] = useState<QuestionItem[]>(restoredQuizState.drawnQuestions);
  const [answers, setAnswers] = useState<QuizAnswerMap>(restoredQuizState.answers);
  const [currentIndex, setCurrentIndex] = useState(restoredQuizState.currentIndex);
  const [result, setResult] = useState<QuizResult | null>(restoredQuizState.result);

  const currentQuestion = drawnQuestions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const hasSavedSession = drawnQuestions.length > 0 && (answeredCount > 0 || result !== null);
  const progressPercent = drawnQuestions.length ? (answeredCount / drawnQuestions.length) * 100 : 0;
  const topStyleCards = bank.styles.map((style) => ({
    ...style,
    summary: bank.result_profiles[style.id].subtitle,
  }));

  const consentDetails = useMemo(
    () => [
      "本测试默认只在你的浏览器本地保存进度，用于继续答题或回看结果。",
      "测试结果仅用于自我探索与关系反思，不构成心理诊断、医疗建议或身份判定。",
      "题库基于公开研究主题自主撰写，避免直接复用现成量表或商业测试表达。",
    ],
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (view === "landing" || drawnQuestions.length === 0) {
      window.localStorage.removeItem(QUIZ_STATE_STORAGE_KEY);
      return;
    }

    const persistedState: PersistedQuizState = {
      answers,
      currentIndex,
      questionIds: drawnQuestions.map((question) => question.id),
      view,
    };

    window.localStorage.setItem(QUIZ_STATE_STORAGE_KEY, JSON.stringify(persistedState));
  }, [answers, currentIndex, drawnQuestions, view]);

  const startQuiz = () => {
    const selectedQuestions = drawQuestions(bank);
    setDrawnQuestions(selectedQuestions);
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setShowQuitConfirm(false);
    setView("quiz");
  };

  const continueQuiz = () => {
    if (!drawnQuestions.length) {
      return;
    }

    setView(result ? "result" : "quiz");
  };

  const returnToLanding = () => {
    setShowQuitConfirm(false);
    setView("landing");
  };

  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) {
      return;
    }

    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: optionId,
    };

    setAnswers(nextAnswers);

    const isLastQuestion = currentIndex === drawnQuestions.length - 1;

    if (isLastQuestion) {
      const nextResult = calculateQuizResult(bank, drawnQuestions, nextAnswers);
      setResult(nextResult);
      setView("result");
      return;
    }

    setCurrentIndex((previousIndex) => previousIndex + 1);
  };

  const handlePreviousQuestion = () => {
    const previousQuestion = drawnQuestions[Math.max(currentIndex - 1, 0)];

    if (!previousQuestion) {
      setCurrentIndex((previousIndex) => Math.max(0, previousIndex - 1));
      return;
    }

    const nextAnswers = { ...answers };
    delete nextAnswers[currentQuestion.id];
    setAnswers(nextAnswers);
    setCurrentIndex((previousIndex) => Math.max(0, previousIndex - 1));
  };

  const restartQuiz = () => {
    startQuiz();
  };

  const closeStylesText = result?.closeStyles.length
    ? result.closeStyles.map((styleId) => bank.result_profiles[styleId].label).join("、")
    : "";

  return (
    <div className="page-shell">
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />

      <main className="app-frame">
        {view === "landing" ? (
          <>
            <section className="hero-panel">
              <div className="hero-copy">
                <p className="eyebrow">LesBTI Relationship Atmosphere Test</p>
                <h1>测测你在关系里的气场，更像哪一种推进方式</h1>
                <p className="hero-text">
                  这不是身份鉴定，也不是心理诊断，而是一份围绕关系节奏、边界感、亲密表达与照顾方式展开的气场报告。
                </p>

                <div className="hero-pills">
                  <span>35 道原创场景题</span>
                  <span>固定流程，便于首版调试</span>
                  <span>约 6 - 8 分钟</span>
                </div>

                <div className="hero-actions">
                  {hasSavedSession ? (
                    <button className="secondary-button" onClick={continueQuiz} type="button">
                      {result ? "查看上次结果" : "继续上次答题"}
                    </button>
                  ) : null}
                  <button
                    className="primary-button"
                    disabled={!agreed}
                    onClick={startQuiz}
                    type="button"
                  >
                    开始测试
                  </button>
                </div>
              </div>

              <div className="hero-visual" aria-hidden="true">
                <div className="hero-orbit hero-orbit-large" />
                <div className="hero-orbit hero-orbit-small" />
                <div className="hero-card-stack">
                  {topStyleCards.map((style) => (
                    <article
                      className={`style-preview-card ${styleThemes[style.id].accentClass}`}
                      key={style.id}
                    >
                      <div className="style-preview-head">
                        <span className="style-preview-icon">{renderStyleGlyph(style.id)}</span>
                        <span className="style-preview-badge">{styleThemes[style.id].badge}</span>
                      </div>
                      <h2>{style.label}</h2>
                      <p>{style.summary}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="content-grid">
              <article className="info-panel">
                <p className="section-label">项目定位</p>
                <h2>从互动细节出发，而不是从标签倒推你是谁</h2>
                <p>
                  题目全部使用关系场景，不要求你抽象地评价自己。每个选项都映射一种更常见的反应模式，再汇总成主结果、8
                  维拆解和派生气场条。
                </p>
                <ul className="bullet-list">
                  <li>主结果给出本次最明显的关系气场倾向</li>
                  <li>8 维拆解告诉你是哪些互动侧面在拉高结果</li>
                  <li>派生气场条保留传播感，但不把梗标签当作身份结论</li>
                </ul>
              </article>

              <article className="info-panel notice-panel">
                <p className="section-label">测试边界</p>
                <h2>结果适合自我理解，不替代现实判断</h2>
                <div className="notice-list">
                  {bank.notices.map((notice) => (
                    <p key={notice}>{notice}</p>
                  ))}
                </div>
              </article>
            </section>

            <section className="metric-panel">
              <div className="metric-panel-head">
                <p className="section-label">结果结构</p>
                <h2>这份报告会怎么读</h2>
              </div>

              <div className="metric-grid">
                {bank.dimensions.map((dimension) => (
                  <article className="metric-card" key={dimension.id}>
                    <div className="metric-scale">
                      <span>{dimension.left_label}</span>
                      <span>{dimension.right_label}</span>
                    </div>
                    <h3>{dimension.label}</h3>
                    <p>{dimension.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="consent-panel">
              <label className="consent-row">
                <input
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                  type="checkbox"
                />
                <span className="checkmark" aria-hidden="true">
                  {agreed ? "✓" : ""}
                </span>
                <span>
                  我已阅读并理解这是一份自我探索测试。
                  <button className="inline-button" onClick={() => setShowTerms(true)} type="button">
                    查看说明
                  </button>
                </span>
              </label>
            </section>
          </>
        ) : null}

        {view === "quiz" && currentQuestion ? (
          <>
            <section className="quiz-header">
              <div>
                <p className="eyebrow">Question Flow</p>
                <h1>
                  第 {currentIndex + 1} 题 <span>/ 共 {drawnQuestions.length} 题</span>
                </h1>
                <p className="quiz-caption">优先选择更接近你平时默认反应的那个选项。</p>
              </div>

              <div className="quiz-actions">
                <button
                  className="secondary-button"
                  disabled={currentIndex === 0}
                  onClick={handlePreviousQuestion}
                  type="button"
                >
                  上一题
                </button>
                <button
                  className="secondary-button"
                  onClick={() => setShowQuitConfirm((previous) => !previous)}
                  type="button"
                >
                  返回首页
                </button>
              </div>
            </section>

            <section className="progress-panel">
              <div className="progress-meta">
                <span>已完成 {answeredCount} 题</span>
                <span>{formatPercent(progressPercent)}</span>
              </div>
              <div className="progress-track" aria-hidden="true">
                <span className="progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </section>

            <section className="question-panel">
              <p className="section-label">当前场景</p>
              <h2>{currentQuestion.prompt}</h2>

              <div className="option-list" role="list">
                {currentQuestion.options.map((option) => (
                  <button
                    className="option-card"
                    key={`${currentQuestion.id}-${option.id}`}
                    onClick={() => handleSelectOption(option.id)}
                    type="button"
                  >
                    <span className="option-id">{option.id}</span>
                    <span className="option-copy">{option.text}</span>
                  </button>
                ))}
              </div>

              <p className="question-footnote">单题作答模式下，选择任一选项后会自动进入下一题。</p>

              {showQuitConfirm ? (
                <div className="inline-confirm" role="alertdialog" aria-labelledby="quit-confirm-title">
                  <h3 id="quit-confirm-title">确认要返回首页吗？</h3>
                  <p>当前进度会保存在本地，回到首页后仍可继续答题或查看结果。</p>
                  <div className="inline-confirm-actions">
                    <button className="secondary-button" onClick={() => setShowQuitConfirm(false)} type="button">
                      继续答题
                    </button>
                    <button className="primary-button" onClick={returnToLanding} type="button">
                      返回首页
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          </>
        ) : null}

        {view === "result" && result ? (
          <>
            <section className={`result-hero ${styleThemes[result.primaryStyle].accentClass}`}>
              <div className="result-hero-top">
                <div className="result-icon-wrap">{renderStyleGlyph(result.primaryStyle)}</div>
                <div>
                  <p className="eyebrow">{bank.result_page_copy.report_title}</p>
                  <h1>{result.primaryProfile.label}</h1>
                  <p className="result-subtitle">{result.primaryProfile.subtitle}</p>
                </div>
              </div>

              <div className="result-pill-row">
                <span>完成 {result.answeredCount} / {bank.draw_policy.required_answer_count} 题</span>
                <span>主类型占比 {formatPercent(result.percentages[result.primaryStyle])}</span>
                <span>题库版本 {bank.version}</span>
              </div>

              {result.closeStyles.length ? (
                <p className="result-secondary-note">
                  本次结果里还有较明显的次级倾向：{closeStylesText}。
                </p>
              ) : null}
            </section>

            <section className="result-layout">
              <article className="report-panel">
                <p className="section-label">{bank.result_page_copy.about_title}</p>
                <h2>{result.primaryProfile.label}</h2>
                <p className="long-copy">{result.primaryProfile.about}</p>

                <div className="top-dimension-row">
                  {result.topDimensions.map((dimension) => (
                    <div className="top-dimension-chip" key={dimension.id}>
                      <strong>{dimension.label}</strong>
                      <span>{formatPercent(dimension.value)}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="report-panel">
                <p className="section-label">8 维雷达</p>
                <h2>你的关系气场轮廓</h2>
                <RadarChart
                  dimensions={bank.dimensions.map((dimension) => ({
                    id: dimension.id,
                    label: dimension.label,
                    value: result.dimensionPercentages[dimension.id],
                  }))}
                />
              </article>
            </section>

            <section className="result-layout">
              <article className="report-panel">
                <p className="section-label">{bank.result_page_copy.distribution_title}</p>
                <h2>四种主气场在本次作答中的分布</h2>

                <div className="distribution-list">
                  {result.distribution.map((item) => (
                    <article className="distribution-item" key={item.styleId}>
                      <div className="distribution-head">
                        <div className="distribution-title-wrap">
                          <span className={`distribution-glyph ${styleThemes[item.styleId].accentClass}`}>
                            {renderStyleGlyph(item.styleId)}
                          </span>
                          <div>
                            <h3>{item.label}</h3>
                            <p>{item.subtitle}</p>
                          </div>
                        </div>
                        <strong>{formatPercent(item.percentage)}</strong>
                      </div>
                      <div className="distribution-track" aria-hidden="true">
                        <span
                          className={`distribution-fill ${styleThemes[item.styleId].accentClass}`}
                          style={{ width: `${Math.max(item.percentage, 4)}%` }}
                        />
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            </section>

            <section className="result-layout">
              <article className="report-panel">
                <p className="section-label">{bank.result_page_copy.traits_title}</p>
                <h2>8 维关系拆解</h2>

                <div className="dimension-list">
                  {bank.dimensions.map((dimension) => (
                    <article className="dimension-item" key={dimension.id}>
                      <div className="dimension-head">
                        <div>
                          <h3>{dimension.label}</h3>
                          <p>{dimension.description}</p>
                        </div>
                        <strong>{formatPercent(result.dimensionPercentages[dimension.id])}</strong>
                      </div>

                      <div className="dimension-track" aria-hidden="true">
                        <span
                          className="dimension-fill"
                          style={{ width: `${Math.max(result.dimensionPercentages[dimension.id], 4)}%` }}
                        />
                      </div>

                      <div className="dimension-scale">
                        <span>{dimension.left_label}</span>
                        <span>{dimension.right_label}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </article>

              <article className="report-panel">
                <p className="section-label">{bank.result_page_copy.bars_title}</p>
                <h2>派生气场条</h2>

                <div className="derived-list">
                  {result.derivedBars.map((bar) => (
                    <article className="derived-item" key={bar.id}>
                      <div className="derived-head">
                        <span>{bar.label}</span>
                        <strong>{formatPercent(bar.value)}</strong>
                      </div>
                      <div className="derived-track" aria-hidden="true">
                        <span className="derived-fill" style={{ width: `${Math.max(bar.value, 4)}%` }} />
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            </section>

            <section className="result-layout">
              <article className="report-panel">
                <p className="section-label">你在关系里可能更常见的表现</p>
                <ul className="detail-list">
                  {result.primaryProfile.traits.map((trait) => (
                    <li key={trait}>{trait}</li>
                  ))}
                </ul>
              </article>

              <article className="report-panel">
                <p className="section-label">{bank.result_page_copy.advice_title}</p>
                <ul className="detail-list">
                  {result.primaryProfile.advice.map((advice) => (
                    <li key={advice}>{advice}</li>
                  ))}
                </ul>
              </article>
            </section>

            <section className="footer-panel">
              <p>{bank.result_page_copy.footer_disclaimer}</p>
              <div className="result-footer-actions">
                <button className="secondary-button" onClick={returnToLanding} type="button">
                  返回首页
                </button>
                <button className="primary-button" onClick={restartQuiz} type="button">
                  再测一次
                </button>
              </div>
            </section>
          </>
        ) : null}
      </main>

      {showTerms ? (
        <div className="modal-backdrop" onClick={() => setShowTerms(false)} role="presentation">
          <section
            aria-labelledby="terms-title"
            aria-modal="true"
            className="modal-panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="modal-head">
              <div>
                <p className="section-label">使用说明</p>
                <h2 id="terms-title">开始测试前请先了解这些边界</h2>
              </div>
              <button className="close-button" onClick={() => setShowTerms(false)} type="button">
                ×
              </button>
            </div>

            <div className="modal-body">
              {consentDetails.map((item) => (
                <p key={item}>{item}</p>
              ))}
              <p>
                参考来源包含：
                {bank.references.map((reference) => reference.title).join("、")}。
              </p>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default App;
