export type StyleId =
  | "direct_push"
  | "soft_lead"
  | "reverse_gap"
  | "high_sensitive";

export type DimensionId =
  | "traction"
  | "boundary"
  | "leadership"
  | "directness"
  | "empathy"
  | "care"
  | "stability"
  | "depth";

export type DerivedBarId =
  | "mei_energy"
  | "jie_energy"
  | "s_energy"
  | "m_energy"
  | "steady_energy"
  | "spark_energy";

export type DimensionDefinition = {
  id: DimensionId;
  label: string;
  left_label: string;
  right_label: string;
  description: string;
};

export type StyleDefinition = {
  id: StyleId;
  label: string;
  subtitle: string;
};

export type QuestionOption = {
  id: string;
  text: string;
  style: StyleId;
};

export type QuestionItem = {
  id: string;
  theme: string;
  prompt: string;
  options: QuestionOption[];
};

export type ResultProfile = {
  label: string;
  subtitle: string;
  about: string;
  traits: string[];
  advice: string[];
};

export type RelationshipBank = {
  schema_version: string;
  bank_id: string;
  version: string;
  locale: string;
  title: string;
  subtitle: string;
  authoring_strategy: string;
  question_format: string;
  question_count: number;
  draw_policy: {
    mode: string;
    draw_count: number;
    shuffle_question_order: boolean;
    shuffle_option_order: boolean;
    required_answer_count: number;
  };
  notices: string[];
  dimensions: DimensionDefinition[];
  styles: StyleDefinition[];
  scoring: {
    primary_metric: string;
    style_percentage_formula: string;
    dimension_points: Record<StyleId, Record<DimensionId, number>>;
    dimension_average_formula: string;
    dimension_percentage_formula: string;
    primary_style_rule: string[];
    result_page_distribution_order: StyleId[];
  };
  derived_bars: Array<{
    id: DerivedBarId;
    label: string;
    formula: string;
  }>;
  result_page_copy: {
    report_title: string;
    report_subtitle: string;
    distribution_title: string;
    about_title: string;
    traits_title: string;
    advice_title: string;
    bars_title: string;
    footer_disclaimer: string;
  };
  result_profiles: Record<StyleId, ResultProfile>;
  references: Array<{
    title: string;
    url: string;
    note: string;
  }>;
  questions: QuestionItem[];
};

export type QuizAnswerMap = Record<string, string>;

export type DimensionRecord = Record<DimensionId, number>;
export type StyleRecord = Record<StyleId, number>;
export type DerivedBarRecord = Record<DerivedBarId, number>;

export type QuizResult = {
  answeredCount: number;
  primaryStyle: StyleId;
  primaryProfile: ResultProfile;
  secondaryStyles: StyleId[];
  closeStyles: StyleId[];
  tiedTopStyles: StyleId[];
  votes: StyleRecord;
  percentages: StyleRecord;
  dimensionSums: DimensionRecord;
  dimensionAverages: DimensionRecord;
  dimensionPercentages: DimensionRecord;
  styleCentroidDistances: StyleRecord;
  derivedBars: Array<{
    id: DerivedBarId;
    label: string;
    value: number;
  }>;
  distribution: Array<{
    styleId: StyleId;
    votes: number;
    percentage: number;
    label: string;
    subtitle: string;
  }>;
  topDimensions: Array<{
    id: DimensionId;
    label: string;
    value: number;
    description: string;
  }>;
};

const styleIds: StyleId[] = [
  "direct_push",
  "soft_lead",
  "reverse_gap",
  "high_sensitive",
];

const dimensionIds: DimensionId[] = [
  "traction",
  "boundary",
  "leadership",
  "directness",
  "empathy",
  "care",
  "stability",
  "depth",
];

const derivedBarFormulas: Record<
  DerivedBarId,
  (dimensions: DimensionRecord) => number
> = {
  mei_energy: (dimensions) =>
    dimensions.empathy * 0.35 +
    dimensions.care * 0.25 +
    dimensions.depth * 0.25 +
    dimensions.traction * 0.15,
  jie_energy: (dimensions) =>
    dimensions.leadership * 0.35 +
    dimensions.boundary * 0.25 +
    dimensions.stability * 0.2 +
    dimensions.care * 0.2,
  s_energy: (dimensions) =>
    dimensions.leadership * 0.45 +
    dimensions.directness * 0.25 +
    dimensions.traction * 0.2 +
    dimensions.boundary * 0.1,
  m_energy: (dimensions) =>
    dimensions.empathy * 0.3 +
    dimensions.care * 0.25 +
    dimensions.depth * 0.25 +
    dimensions.traction * 0.2,
  steady_energy: (dimensions) =>
    dimensions.stability * 0.5 +
    dimensions.boundary * 0.25 +
    dimensions.empathy * 0.15 +
    dimensions.care * 0.1,
  spark_energy: (dimensions) =>
    dimensions.directness * 0.45 +
    dimensions.traction * 0.35 +
    dimensions.depth * 0.2,
};

function createEmptyStyleRecord(): StyleRecord {
  return {
    direct_push: 0,
    soft_lead: 0,
    reverse_gap: 0,
    high_sensitive: 0,
  };
}

function createEmptyDimensionRecord(): DimensionRecord {
  return {
    traction: 0,
    boundary: 0,
    leadership: 0,
    directness: 0,
    empathy: 0,
    care: 0,
    stability: 0,
    depth: 0,
  };
}

function shuffleItems<T>(items: T[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function drawQuestions(bank: RelationshipBank) {
  const {
    questions,
    draw_policy: {
      draw_count: drawCount,
      shuffle_option_order: shuffleOptionOrder,
      shuffle_question_order: shuffleQuestionOrder,
    },
  } = bank;

  const selectedQuestions = shuffleQuestionOrder
    ? shuffleItems(questions).slice(0, drawCount)
    : questions.slice(0, drawCount);

  const optionIds = ["A", "B", "C", "D"];

  return selectedQuestions.map((question) => {
    const shuffledOptions = shuffleOptionOrder
      ? shuffleItems(question.options)
      : question.options;

    return {
      ...question,
      options: shuffledOptions.map((option, index) => ({
        ...option,
        id: optionIds[index],
      })),
    };
  });
}

function calculateStyleCentroidDistances(
  bank: RelationshipBank,
  dimensionAverages: DimensionRecord,
): StyleRecord {
  return styleIds.reduce<StyleRecord>((accumulator, styleId) => {
    const distance = dimensionIds.reduce((sum, dimensionId) => {
      const styleValue = bank.scoring.dimension_points[styleId][dimensionId];
      const delta = dimensionAverages[dimensionId] - styleValue;
      return sum + delta * delta;
    }, 0);

    return {
      ...accumulator,
      [styleId]: distance,
    };
  }, createEmptyStyleRecord());
}

function resolvePrimaryStyle(
  bank: RelationshipBank,
  votes: StyleRecord,
  dimensionAverages: DimensionRecord,
) {
  const distributionOrder = bank.scoring.result_page_distribution_order;
  const maxVotes = Math.max(...distributionOrder.map((styleId) => votes[styleId]));
  const tiedTopStyles = distributionOrder.filter((styleId) => votes[styleId] === maxVotes);
  const styleCentroidDistances = calculateStyleCentroidDistances(bank, dimensionAverages);

  const primaryStyle =
    tiedTopStyles
      .slice()
      .sort((styleA, styleB) => {
        const distanceDelta = styleCentroidDistances[styleA] - styleCentroidDistances[styleB];

        if (distanceDelta !== 0) {
          return distanceDelta;
        }

        return distributionOrder.indexOf(styleA) - distributionOrder.indexOf(styleB);
      })[0] ?? "soft_lead";

  return {
    primaryStyle,
    tiedTopStyles,
    styleCentroidDistances,
  };
}

export function calculateQuizResult(
  bank: RelationshipBank,
  questions: QuestionItem[],
  answers: QuizAnswerMap,
): QuizResult {
  const votes = createEmptyStyleRecord();
  const dimensionSums = createEmptyDimensionRecord();
  let answeredCount = 0;

  questions.forEach((question) => {
    const selectedOptionId = answers[question.id];

    if (!selectedOptionId) {
      return;
    }

    const selectedOption = question.options.find((option) => option.id === selectedOptionId);

    if (!selectedOption) {
      return;
    }

    answeredCount += 1;
    votes[selectedOption.style] += 1;

    dimensionIds.forEach((dimensionId) => {
      dimensionSums[dimensionId] += bank.scoring.dimension_points[selectedOption.style][dimensionId];
    });
  });

  const dimensionAverages = dimensionIds.reduce<DimensionRecord>((accumulator, dimensionId) => {
    return {
      ...accumulator,
      [dimensionId]: answeredCount ? dimensionSums[dimensionId] / answeredCount : 0,
    };
  }, createEmptyDimensionRecord());

  const dimensionPercentages = dimensionIds.reduce<DimensionRecord>((accumulator, dimensionId) => {
    return {
      ...accumulator,
      [dimensionId]: answeredCount ? (dimensionAverages[dimensionId] / 3) * 100 : 0,
    };
  }, createEmptyDimensionRecord());

  const { primaryStyle, tiedTopStyles, styleCentroidDistances } = resolvePrimaryStyle(
    bank,
    votes,
    dimensionAverages,
  );

  const secondaryStyles = tiedTopStyles.filter((styleId) => styleId !== primaryStyle);
  const maxVotes = Math.max(...styleIds.map((styleId) => votes[styleId]));
  const closeStyles = styleIds.filter(
    (styleId) =>
      styleId !== primaryStyle && maxVotes - votes[styleId] <= 2 && votes[styleId] > 0,
  );

  const percentages = styleIds.reduce<StyleRecord>((accumulator, styleId) => {
    return {
      ...accumulator,
      [styleId]: answeredCount ? (votes[styleId] / answeredCount) * 100 : 0,
    };
  }, createEmptyStyleRecord());

  const distribution = bank.scoring.result_page_distribution_order.map((styleId) => ({
    styleId,
    votes: votes[styleId],
    percentage: percentages[styleId],
    label: bank.result_profiles[styleId].label,
    subtitle: bank.result_profiles[styleId].subtitle,
  }));

  const derivedBars = bank.derived_bars.map((bar) => {
    const formula = derivedBarFormulas[bar.id];
    const rawValue = formula ? formula(dimensionAverages) : 0;
    const percentage = Math.max(0, Math.min(100, (rawValue / 3) * 100));

    return {
      id: bar.id,
      label: bar.label,
      value: percentage,
    };
  });

  const topDimensions = [...bank.dimensions]
    .sort((dimensionA, dimensionB) => {
      return dimensionPercentages[dimensionB.id] - dimensionPercentages[dimensionA.id];
    })
    .slice(0, 3)
    .map((dimension) => ({
      id: dimension.id,
      label: dimension.label,
      value: dimensionPercentages[dimension.id],
      description: dimension.description,
    }));

  return {
    answeredCount,
    primaryStyle,
    primaryProfile: bank.result_profiles[primaryStyle],
    secondaryStyles,
    closeStyles,
    tiedTopStyles,
    votes,
    percentages,
    dimensionSums,
    dimensionAverages,
    dimensionPercentages,
    styleCentroidDistances,
    derivedBars,
    distribution,
    topDimensions,
  };
}
