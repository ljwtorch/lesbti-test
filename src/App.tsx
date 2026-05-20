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
import { AnnouncementModal } from "./AnnouncementModal";
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
  const [showAnnouncement, setShowAnnouncement] = useState(restoredQuizState.view === "landing");
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
  const landingHighlights = [
    `${bank.question_count} 道场景题`,
    `${bank.styles.length} 种关系气场`,
    ` 8 维倾向雷达`,
    "约 6 - 8 分钟",
  ];
  const landingInstructions = [
    "该测试相关题目比较保守，信息来源于网络",
    `进入答题页后，需要完成 ${bank.draw_policy.required_answer_count} 道题，系统会自动记录本地进度`,
    "请结合你在亲密关系中的真实感受与默认反应作答，不用刻意选择“更好”的答案",
    "题目没有标准答案，结果用于观察关系气场与互动倾向，不是身份判定或心理诊断",
    "完成测试后，你会看到主结果、4 种关系气场，维度拆解和 8 维倾向雷达",
    "如有问题请联系：vvmailbox@qq.com"
  ];

  const consentDetails = useMemo(
    () => [
      "本测试默认只在你的浏览器本地保存进度，用于继续答题或回看结果",
      "测试结果仅用于自我探索与关系反思，不构成心理诊断、医疗建议或身份判定",
      "题库基于公开研究主题自主撰写，避免直接复用现成量表或商业测试表达",
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

      <main className={`app-frame ${view === "landing" ? "landing-frame" : view === "quiz" ? "quiz-frame" : "result-frame"}`}>
        {view === "landing" ? (
          <>
            <section className="hero-panel landing-hero-panel">
              <div className="hero-mark landing-hero-mark" aria-hidden="true">
                <span className="hero-mark-icon">{renderStyleGlyph("soft_lead")}</span>
              </div>
              <div className="hero-copy hero-copy-centered landing-hero-copy">
                <p className="eyebrow">Relationship Atmosphere Reflection</p>
                <h1>LesBTI 关系气场测试</h1>
                <p className="hero-text">
                  从你的关系反应里，看见更常出现的互动节奏、边界感与亲密表达方式
                </p>
                <div className="hero-pills landing-hero-pills">
                  {landingHighlights.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            </section>

            <section className="landing-stack">
              <article className="info-panel intro-panel landing-intro-panel">
                <p className="section-label">关系气场是什么</p>
                <p>
                  这份测试关注的是你在亲密关系里的互动倾向，包括推进节奏、边界感、照顾方式和情绪表达。结果会用更轻量的“关系气场”语言呈现，而不是给出身份诊断
                </p>

                <div className="landing-style-grid">
                  {topStyleCards.map((style) => (
                    <article className="landing-style-card" key={style.id}>
                      <span className={`landing-style-icon ${styleThemes[style.id].accentClass}`}>
                        {renderStyleGlyph(style.id)}
                      </span>
                      <h3>{style.label}</h3>
                      <p>{style.summary}</p>
                    </article>
                  ))}
                </div>
              </article>

              <article className="info-panel intro-panel landing-intro-panel">
                <p className="section-label">测试说明</p>
                <ul className="bullet-list landing-bullet-list">
                  {landingInstructions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {/*<div className="notice-list">*/}
                {/*  {bank.notices.map((notice) => (*/}
                {/*    <p key={notice}>{notice}</p>*/}
                {/*  ))}*/}
                {/*</div>*/}
              </article>
            </section>

            <section className="consent-panel landing-consent-panel">
              <label className="consent-row landing-consent-row">
                <input
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                  type="checkbox"
                />
                <span className="checkmark" aria-hidden="true">
                  {agreed ? "✓" : ""}
                </span>
                <span>
                  我已阅读并同意
                  <button className="inline-button" onClick={() => setShowTerms(true)} type="button">
                    用户使用条款&免责声明
                  </button>
                </span>
              </label>

              <div className="cta-wrap">
                {hasSavedSession ? (
                  <button className="ghost-button" onClick={continueQuiz} type="button">
                    {result ? "查看上次结果" : "继续上次答题"}
                  </button>
                ) : null}
                <button
                  className="start-button"
                  disabled={!agreed}
                  onClick={startQuiz}
                  type="button"
                >
                  开始答题
                </button>
              </div>
            </section>

            <AnnouncementModal
              onClose={() => setShowAnnouncement(false)}
              open={showAnnouncement}
            />
          </>
        ) : null}

        {view === "quiz" && currentQuestion ? (
          <>
            <section className="hero-card quiz-hero-card">
              <div className="quiz-hero-top">
                <div className="quiz-hero-copy">
                  <p className="hero-kicker">Question Flow</p>
                  <h1>
                    第 {currentIndex + 1} 题 <span>/ 共 {drawnQuestions.length} 题</span>
                  </h1>
                </div>
              </div>
              <div className="progress-track" aria-hidden="true">
                <span className="progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </section>

            <section className="content-card question-card">
              <div className="section-head">
                <p className="section-kicker">当前题目</p>
                <h2>{currentQuestion.prompt}</h2>
              </div>

              <div className="options-grid" role="list">
                {currentQuestion.options.map((option) => {
                  const isSelected = answers[currentQuestion.id] === option.id;
                  return (
                    <button
                      className={`option-card ${isSelected ? "is-selected" : ""}`}
                      key={`${currentQuestion.id}-${option.id}`}
                      onClick={() => handleSelectOption(option.id)}
                      type="button"
                    >
                      <span className="option-badge">{option.id}</span>
                      <span className="option-copy">{option.text}</span>
                    </button>
                  );
                })}
              </div>

              <div className="question-actions">
                <div className="question-action-buttons">
                  <button className="ghost-button" disabled={currentIndex === 0} onClick={handlePreviousQuestion} type="button">
                    上一题
                  </button>
                  <button className="ghost-button" onClick={() => setShowQuitConfirm((prev) => !prev)} type="button">
                    返回首页
                  </button>
                  {showQuitConfirm ? (
                    <div className="confirm-bubble" role="alertdialog" aria-labelledby="quit-confirm-title">
                      <h3 id="quit-confirm-title">确认要返回首页吗？</h3>
                      <p>当前进度会保存在本地，回到首页后仍可继续答题或查看结果。</p>
                      <div className="confirm-bubble-actions">
                        <button className="ghost-button" onClick={() => setShowQuitConfirm(false)} type="button">
                          继续答题
                        </button>
                        <button className="ghost-button confirm-leave-button" onClick={returnToLanding} type="button">
                          返回首页
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
                <p className="question-footnote">当前为单题作答模式，选择任一选项后将自动进入下一题。</p>
              </div>
            </section>
          </>
        ) : null}

        {view === "result" && result ? (
          <>
            <section className="hero-card result-hero-card">
              <div className="result-hero-mark" aria-hidden="true">
                <span className="result-mark-icon">{renderStyleGlyph(result.primaryStyle)}</span>
              </div>
              <p className="hero-kicker">{bank.result_page_copy.report_title}</p>
              <h1>{result.primaryProfile.label}</h1>
              <p className="hero-text result-subtitle">{result.primaryProfile.subtitle}</p>

              <div className="result-pill-row">
                <span>已完成 {result.answeredCount} / {bank.draw_policy.required_answer_count} 题</span>
                <span>主类型占比 {formatPercent(result.percentages[result.primaryStyle])}</span>
              </div>

              {result.closeStyles.length ? (
                <p className="result-secondary-note">
                  本次结果里还有较明显的次级倾向：{closeStylesText}。
                </p>
              ) : null}
            </section>

            <section className="result-chart-row">
              <section className="content-card distribution-card">
                <div className="section-head">
                  <p className="section-kicker">{bank.result_page_copy.distribution_title}</p>
                </div>

                <div className="distribution-list">
                  {result.distribution.map((item) => (
                    <article className="distribution-item" key={item.styleId}>
                      <div className="distribution-head">
                        <div className="distribution-label-wrap">
                          <span className={`distribution-icon ${styleThemes[item.styleId].accentClass}`} aria-hidden="true">
                            {renderStyleGlyph(item.styleId)}
                          </span>
                          <div>
                            <h3>{item.label}</h3>
                            <p>{item.subtitle}</p>
                          </div>
                        </div>
                        <strong>{formatPercent(item.percentage)}</strong>
                      </div>

                      <div className="distribution-bar" aria-hidden="true">
                        <span
                          className={`distribution-fill ${styleThemes[item.styleId].accentClass}`}
                          style={{ width: `${Math.max(item.percentage, 4)}%` }}
                        />
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="content-card radar-card">
                <div className="section-head">
                  <p className="section-kicker">8 维雷达</p>
                </div>
                <RadarChart
                  dimensions={bank.dimensions.map((dimension) => ({
                    id: dimension.id,
                    label: dimension.label,
                    value: result.dimensionPercentages[dimension.id],
                  }))}
                />
              </section>
            </section>

            <section className="content-card dimension-card">
              <div className="section-head">
                <p className="section-kicker">{bank.result_page_copy.traits_title}</p>
              </div>

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
            </section>

            <section className="content-card result-copy-card">
              <div className="result-copy-grid">
                <article className="result-detail-card">
                  <div className="section-head">
                    <p className="section-kicker">{bank.result_page_copy.about_title}</p>
                  </div>
                  <p className="long-copy">{result.primaryProfile.about}</p>
                </article>

                <article className="result-detail-card">
                  <div className="section-head">
                    <p className="section-kicker">{bank.result_page_copy.advice_title}</p>
                  </div>
                  <ul className="detail-list">
                    {result.primaryProfile.advice.map((advice) => (
                      <li key={advice}>{advice}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </section>

            <section className="content-card result-footer-card">
              <p>{bank.result_page_copy.footer_disclaimer}</p>
            </section>

            <div className="result-actions" role="group" aria-label="结果页操作">
              <button className="ghost-button" onClick={returnToLanding} type="button">
                返回首页
              </button>
              <button className="start-button" onClick={restartQuiz} type="button">
                再测一次
              </button>
            </div>
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
                <h2 id="terms-title">开始测试前请先了解这些：</h2>
              </div>
              <button className="close-button" onClick={() => setShowTerms(false)} type="button">
                ×
              </button>
            </div>

            <div className="modal-body">
              {consentDetails.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default App;
