import type { AtlasInput, AtlasProfileId, AtlasResult, AtlasSubpatternId } from "./patternAtlas";
import type { DynamicPatternResult, PatternFamily, StateVector } from "./patternInterpretation";

export const CANONICAL_NAMING_MATRIX_VERSION = "canonical-naming-matrix-v1";

export type OrganizingQuality =
  | "coherent"
  | "fragmented"
  | "pressurized"
  | "strained"
  | "contained"
  | "open"
  | "adaptive";

export type NamingSelectionMode = "single" | "composite" | "ambiguous" | "insufficient-evidence";

export type CanonicalContent = {
  summary: string;
  explanation: [string, string];
  dailyLife: [string, string, string, string];
  supportLines: [string, string, string];
  reflectionQuestion: string;
};

export type MatrixRequirements = {
  minActivation?: number;
  maxActivation?: number;
  minOrganization?: number;
  maxOrganization?: number;
  minRegulation?: number;
  maxRegulation?: number;
  minExpression?: number;
  maxExpression?: number;
  minRelationalOrientation?: number;
  maxRelationalOrientation?: number;
  minDirection?: number;
  maxDirection?: number;
  minCapacity?: number;
  maxCapacity?: number;
  minSecondaryScore?: number;
  maxCompositeMargin?: number;
  minConfidence?: number;
  minEvidence?: Partial<Record<string, number>>;
  minSubpatterns?: Partial<Record<AtlasSubpatternId, number>>;
  requiresBaseline?: boolean;
};

export type MatrixContradictions = MatrixRequirements & {
  poorCapture?: boolean;
};

export type CanonicalNamingMatrixEntry = {
  signature: string;
  displayName: string;
  primaryFamily: PatternFamily;
  secondaryFamily?: PatternFamily;
  organizingQuality?: OrganizingQuality;
  resultType: NamingSelectionMode;
  required: MatrixRequirements;
  contradictions: MatrixContradictions;
  contentSources: {
    baseProfile?: AtlasProfileId;
    expressionProfile?: AtlasProfileId;
  };
  content: CanonicalContent;
  version: string;
  founderApproval?: boolean;
};

export type NamingResolutionContext = {
  primaryFamily: PatternFamily;
  secondaryFamily: PatternFamily | null;
  mode: NamingSelectionMode;
  vector: StateVector;
  dynamicPattern: DynamicPatternResult;
  atlasInput: AtlasInput;
  atlasResult: AtlasResult;
  confidence: number;
  margin: number;
  secondaryScore: number | null;
  poorEvidence: boolean;
};

const SINGLE_FAMILY_DISPLAY_NAMES: Record<PatternFamily, string> = {
  overextended: "The Overextended Steward",
  activated: "The Coherent Accelerator",
  protective: "The Contained Communicator",
  adaptive: "The Adaptive Builder",
  recovering: "The Emerging Restorer",
  grounded: "The Grounded Navigator",
  expressive: "The Open Integrator",
  purposeful: "The Focused Creator",
  reflective: "The Quiet Processor",
  reorganizing: "The Reorganizing Explorer",
};

function content(
  summary: string,
  explanation: [string, string],
  dailyLife: [string, string, string, string],
  supportLines: [string, string, string],
  reflectionQuestion: string,
): CanonicalContent {
  return { summary, explanation, dailyLife, supportLines, reflectionQuestion };
}

export const CANONICAL_NAMING_MATRIX: CanonicalNamingMatrixEntry[] = [
  {
    signature: "overextended",
    displayName: "The Overextended Steward",
    primaryFamily: "overextended",
    resultType: "single",
    required: { maxCapacity: 0.58 },
    contradictions: { minCapacity: 0.7, minRegulation: 0.68 },
    contentSources: { baseProfile: "overextended-steward" },
    content: content(
      "Your scan suggests capacity and regulation are carrying more demand than they can easily restore right now.",
      [
        "The strongest pattern is not grounded steadiness; it is continued functioning while available recovery appears low.",
        "This does not define you. It describes a present pattern where effort may be moving ahead of restoration.",
      ],
      [
        "Continuing to handle what matters while privately feeling the cost.",
        "Finding it easier to keep going than to fully stop.",
        "Appearing capable while needing more room than others can see.",
        "Using direction to keep moving even when capacity is asking for care.",
      ],
      [
        "A smaller demand surface.",
        "Recovery that is protected rather than postponed.",
        "Permission to receive support before reaching depletion.",
      ],
      "What could become lighter before your system has to ask more loudly?",
    ),
    version: CANONICAL_NAMING_MATRIX_VERSION,
  },
  {
    signature: "overextended+protective+contained",
    displayName: "The Guarded Steward",
    primaryFamily: "overextended",
    secondaryFamily: "protective",
    resultType: "composite",
    required: { maxCapacity: 0.5, minSecondaryScore: 0.46, maxCompositeMargin: 0.18, minSubpatterns: { "protective-expression": 0.5 } },
    contradictions: { minCapacity: 0.68, minRelationalOrientation: 0.72 },
    contentSources: { baseProfile: "overextended-steward", expressionProfile: "reflective-protector" },
    content: content(
      "You may still be functioning with composure while keeping more of the strain contained than others can see.",
      [
        "The primary signal is overextension, with a protective style shaping how much of that demand becomes visible.",
        "The reflection should preserve both parts: capacity appears taxed, and expression may be managing exposure carefully.",
      ],
      [
        "Handling what is necessary while keeping the fuller strain private.",
        "Choosing careful words even when the internal load feels high.",
        "Showing reliability while needing more room to recover.",
        "Protecting others from the full weight of what you are carrying.",
      ],
      [
        "Reducing the load before it has to become obvious.",
        "A private place to name what is being carried.",
        "Support that does not require overexplaining.",
      ],
      "What have you been carrying quietly that could be named more plainly?",
    ),
    version: CANONICAL_NAMING_MATRIX_VERSION,
  },
  {
    signature: "overextended+reflective+strained",
    displayName: "The Quietly Overloaded",
    primaryFamily: "overextended",
    secondaryFamily: "reflective",
    resultType: "composite",
    required: { maxCapacity: 0.52, minSecondaryScore: 0.46, maxCompositeMargin: 0.18, minSubpatterns: { "quiet-overload": 0.52 } },
    contradictions: { minCapacity: 0.7, minRegulation: 0.68 },
    contentSources: { baseProfile: "quietly-overloaded", expressionProfile: "quiet-processor" },
    content: content(
      "You may be steadily maintaining while quietly carrying more than your current recovery can comfortably support.",
      [
        "The scan points toward strain distributed beneath a composed surface, rather than a simple grounded state.",
        "Reflection and effort both appear present, so the useful question is what has been requiring ongoing internal management.",
      ],
      [
        "Getting through the day and only noticing the depletion afterward.",
        "Feeling mentally busy even during downtime.",
        "Becoming more selective with conversation or stimulation.",
        "Managing many small demands that collectively feel heavy.",
      ],
      [
        "Fewer simultaneous responsibilities.",
        "Quiet that actually reduces input.",
        "Naming the total load instead of minimizing each piece.",
      ],
      "What has become so familiar that you have stopped noticing its cost?",
    ),
    version: CANONICAL_NAMING_MATRIX_VERSION,
  },
  {
    signature: "activated+coherent",
    displayName: "The Coherent Accelerator",
    primaryFamily: "activated",
    organizingQuality: "coherent",
    resultType: "single",
    required: { minActivation: 0.56, minOrganization: 0.52, minEvidence: { "activation-with-coherence": 0.45 } },
    contradictions: { maxOrganization: 0.38, minEvidence: { "activation-with-fragmentation": 0.62 } },
    contentSources: { baseProfile: "focused-creator" },
    content: content(
      "Activation was present in this scan, but it appeared organized enough to keep movement coherent.",
      [
        "The useful distinction is not intensity by itself; it is intensity with enough structure to keep the pattern moving in one piece.",
        "This may reflect a moment where energy, urgency, or momentum is available without fully scattering your expression.",
      ],
      [
        "Moving quickly while still tracking what matters.",
        "Speaking with energy without losing the thread.",
        "Feeling momentum around a clear next step.",
        "Needing pace, but not necessarily more pressure.",
      ],
      [
        "A clear container for the next action.",
        "Enough room to slow down before committing.",
        "A way to use momentum without letting it become demand.",
      ],
      "Where is momentum useful right now, and where would it benefit from more space?",
    ),
    version: CANONICAL_NAMING_MATRIX_VERSION,
    founderApproval: true,
  },
  {
    signature: "activated+reorganizing+fragmented",
    displayName: "The Pressurized Reorganizer",
    primaryFamily: "activated",
    secondaryFamily: "reorganizing",
    organizingQuality: "fragmented",
    resultType: "composite",
    required: { minActivation: 0.5, maxOrganization: 0.58, minSecondaryScore: 0.46, maxCompositeMargin: 0.18 },
    contradictions: { minOrganization: 0.72, minCapacity: 0.68 },
    contentSources: { baseProfile: "reorganizing-explorer" },
    content: content(
      "Activation appears present while organization is still finding a workable arrangement.",
      [
        "The scan suggests movement and pressure together, rather than settled groundedness.",
        "The useful signal is not simply intensity; it is how the pattern is reorganizing under that intensity.",
      ],
      [
        "Trying to respond while several parts are still sorting themselves.",
        "Feeling urgency before the structure is fully clear.",
        "Revising what you mean as you say it.",
        "Needing room for the pattern to settle before acting on it.",
      ],
      [
        "A pause before commitment.",
        "Fewer simultaneous inputs.",
        "A way to capture the next clear step without forcing the whole answer.",
      ],
      "What needs to settle before the next step becomes clear?",
    ),
    version: CANONICAL_NAMING_MATRIX_VERSION,
  },
  {
    signature: "grounded+protective+contained",
    displayName: "The Selective Navigator",
    primaryFamily: "grounded",
    secondaryFamily: "protective",
    resultType: "composite",
    required: { minCapacity: 0.52, minRegulation: 0.52, minSecondaryScore: 0.46, maxCompositeMargin: 0.18, minSubpatterns: { "protective-expression": 0.45 } },
    contradictions: { maxCapacity: 0.4, maxRegulation: 0.4, minSubpatterns: { "quiet-overload": 0.7 } },
    contentSources: { baseProfile: "grounded-navigator", expressionProfile: "reflective-protector" },
    content: content(
      "Steadiness appears present, but expression is more selective than fully open.",
      [
        "The grounded signal is meaningful, but the protective component changes the final pattern from plain navigation to selective navigation.",
        "This suggests presence and direction alongside careful control over what becomes visible or shared.",
      ],
      [
        "Moving with clarity while choosing what belongs in conversation.",
        "Staying present without making every internal detail available.",
        "Knowing the next step while protecting private context.",
        "Offering enough, while holding some expression in reserve.",
      ],
      [
        "Trustworthy pacing.",
        "Boundaries that preserve steadiness.",
        "Conditions where honesty does not require overexposure.",
      ],
      "Where does selectivity feel protective, and where might it be costing connection?",
    ),
    version: CANONICAL_NAMING_MATRIX_VERSION,
  },
  {
    signature: "reorganizing+protective+contained",
    displayName: "The Contained Explorer",
    primaryFamily: "reorganizing",
    secondaryFamily: "protective",
    resultType: "composite",
    required: { maxOrganization: 0.52, minSecondaryScore: 0.46, maxCompositeMargin: 0.18 },
    contradictions: { minOrganization: 0.72, minCapacity: 0.68 },
    contentSources: { baseProfile: "reorganizing-explorer", expressionProfile: "contained-communicator" },
    content: content(
      "The scan suggests active reorganization while expression stays carefully contained.",
      [
        "Something may be sorting itself internally, but the outward pattern does not appear fully open-ended.",
        "This can reflect exploration that still needs privacy, structure, or protection around what is becoming clear.",
      ],
      [
        "Testing several meanings before sharing one.",
        "Needing time to understand what belongs outside your inner process.",
        "Exploring a change while keeping the emotional surface controlled.",
        "Wanting movement without being pushed into disclosure.",
      ],
      [
        "Low-pressure reflection.",
        "A private place to draft what is still forming.",
        "One small experiment rather than a full declaration.",
      ],
      "What are you still exploring that does not need to be shared before it has shape?",
    ),
    version: CANONICAL_NAMING_MATRIX_VERSION,
    founderApproval: true,
  },
  {
    signature: "expressive+overextended+strained",
    displayName: "The Expressive Strain",
    primaryFamily: "expressive",
    secondaryFamily: "overextended",
    organizingQuality: "strained",
    resultType: "composite",
    required: { minExpression: 0.62, maxCapacity: 0.52, minSecondaryScore: 0.46, maxCompositeMargin: 0.18 },
    contradictions: { maxExpression: 0.42, minCapacity: 0.72 },
    contentSources: { baseProfile: "open-integrator", expressionProfile: "overextended-steward" },
    content: content(
      "Expression appears available, while capacity may be carrying more strain than that openness can easily sustain.",
      [
        "The scan should not treat openness as unlimited capacity.",
        "This result preserves the expressive signal while acknowledging that the available energy beneath it may be under load.",
      ],
      [
        "Having a lot to say while not feeling fully restored.",
        "Opening up and only later noticing the effort it required.",
        "Using expression to move through pressure.",
        "Needing support after being more available than usual.",
      ],
      [
        "Expression with a clear stopping point.",
        "Recovery after important conversations.",
        "Support that does not require you to keep performing clarity.",
      ],
      "Where might expression need a boundary so it can stay honest without becoming draining?",
    ),
    version: CANONICAL_NAMING_MATRIX_VERSION,
    founderApproval: true,
  },
  {
    signature: "adaptive+overextended+strained",
    displayName: "The Adaptive Under Load",
    primaryFamily: "adaptive",
    secondaryFamily: "overextended",
    organizingQuality: "strained",
    resultType: "composite",
    required: { minOrganization: 0.48, maxCapacity: 0.56, minSecondaryScore: 0.46, maxCompositeMargin: 0.18 },
    contradictions: { minCapacity: 0.74, minRegulation: 0.72 },
    contentSources: { baseProfile: "adaptive-builder", expressionProfile: "overextended-steward" },
    content: content(
      "Adaptation appears available, but it may be happening under more load than is easy to replenish.",
      [
        "The scan suggests practical adjustment rather than collapse, while capacity still asks to be respected.",
        "This is not a failure of adaptation; it may be a sign that adaptation itself has become part of the demand.",
      ],
      [
        "Changing plans while still feeling the cost of doing so.",
        "Solving around constraints instead of getting more room.",
        "Staying useful while needing clearer limits.",
        "Adjusting repeatedly without a full reset.",
      ],
      [
        "Fewer pivots at once.",
        "A clearer boundary around what can change today.",
        "Recovery that is planned rather than squeezed in.",
      ],
      "Where has adapting become the work itself?",
    ),
    version: CANONICAL_NAMING_MATRIX_VERSION,
    founderApproval: true,
  },
  {
    signature: "overextended+purposeful+directed",
    displayName: "The Directed Depletion",
    primaryFamily: "overextended",
    secondaryFamily: "purposeful",
    organizingQuality: "strained",
    resultType: "composite",
    required: { minDirection: 0.6, maxCapacity: 0.52, minSecondaryScore: 0.44, maxCompositeMargin: 0.2 },
    contradictions: { maxDirection: 0.42, minCapacity: 0.7 },
    contentSources: { baseProfile: "overextended-steward", expressionProfile: "focused-creator" },
    content: content(
      "Direction remains visible, but capacity appears too taxed for this to be read as simple focus.",
      [
        "The scan suggests movement toward something specific while available restoration may be lagging behind.",
        "This result protects the distinction between purpose and pressure: direction may be real, but the cost also matters.",
      ],
      [
        "Knowing the next step while feeling less resourced to take it.",
        "Using purpose to keep moving through depletion.",
        "Feeling clearer about the destination than the recovery needed to reach it.",
        "Continuing because the direction matters, not because capacity feels abundant.",
      ],
      [
        "A smaller next step.",
        "A deadline or goal checked against real capacity.",
        "Support that protects the direction without increasing the load.",
      ],
      "What part of the direction matters most, and what could be made lighter around it?",
    ),
    version: CANONICAL_NAMING_MATRIX_VERSION,
    founderApproval: true,
  },
  {
    signature: "recovering+grounded+coherent",
    displayName: "The Emerging Restorer",
    primaryFamily: "recovering",
    secondaryFamily: "grounded",
    organizingQuality: "coherent",
    resultType: "composite",
    required: { minCapacity: 0.42, minRegulation: 0.44, minSubpatterns: { "emerging-restoration": 0.45 }, requiresBaseline: true },
    contradictions: { requiresBaseline: false, maxCapacity: 0.24 },
    contentSources: { baseProfile: "emerging-restorer", expressionProfile: "grounded-navigator" },
    content: content(
      "Capacity may be returning, but the pattern still benefits from being protected while it becomes reliable again.",
      [
        "This result requires eligible longitudinal evidence; it should not appear from the absence of strain alone.",
        "The scan suggests a present movement toward restoration while still staying bounded to this subject's history.",
      ],
      [
        "Having more energy, but not wanting to spend all of it at once.",
        "Returning to routines with more flexibility than before.",
        "Noticing small signs of clarity before the whole picture feels settled.",
        "Feeling capable in one moment and more easily depleted in another.",
      ],
      [
        "Consistency over intensity.",
        "Gentle re-entry into demand.",
        "Room to stop before exhaustion returns.",
      ],
      "What capacity is returning, and what would help it remain available?",
    ),
    version: CANONICAL_NAMING_MATRIX_VERSION,
  },
];

function evidenceValue(dynamic: DynamicPatternResult, id: string) {
  return dynamic.evidenceLedger.supporting.find((entry) => entry.id === id)?.value ?? 0;
}

function subpatternScore(result: AtlasResult, id: AtlasSubpatternId) {
  return result.subpatterns.find((entry) => entry.id === id)?.score ?? 0;
}

function valueFor(vector: StateVector, key: keyof StateVector) {
  return vector[key];
}

function failsMinimum(value: number, minimum: number | undefined) {
  return minimum !== undefined && value < minimum;
}

function failsMaximum(value: number, maximum: number | undefined) {
  return maximum !== undefined && value > maximum;
}

function requirementFailures(requirements: MatrixRequirements, context: NamingResolutionContext) {
  const vector = context.vector;
  const failures: string[] = [];
  const checks: Array<[keyof StateVector, number | undefined, number | undefined, string]> = [
    ["activation", requirements.minActivation, requirements.maxActivation, "activation"],
    ["organization", requirements.minOrganization, requirements.maxOrganization, "organization"],
    ["regulation", requirements.minRegulation, requirements.maxRegulation, "regulation"],
    ["expression", requirements.minExpression, requirements.maxExpression, "expression"],
    ["relationalOrientation", requirements.minRelationalOrientation, requirements.maxRelationalOrientation, "relational orientation"],
    ["direction", requirements.minDirection, requirements.maxDirection, "direction"],
    ["capacity", requirements.minCapacity, requirements.maxCapacity, "capacity"],
  ];

  for (const [key, min, max, label] of checks) {
    const value = valueFor(vector, key);
    if (failsMinimum(value, min)) failures.push(`${label} ${value.toFixed(2)} is below required ${min}.`);
    if (failsMaximum(value, max)) failures.push(`${label} ${value.toFixed(2)} is above allowed ${max}.`);
  }
  if (requirements.minSecondaryScore !== undefined && (context.secondaryScore ?? 0) < requirements.minSecondaryScore) {
    failures.push(`secondary score ${(context.secondaryScore ?? 0).toFixed(3)} is below required ${requirements.minSecondaryScore}.`);
  }
  if (requirements.maxCompositeMargin !== undefined && context.margin > requirements.maxCompositeMargin) {
    failures.push(`candidate margin ${context.margin.toFixed(3)} exceeds allowed ${requirements.maxCompositeMargin}.`);
  }
  if (requirements.minConfidence !== undefined && context.confidence < requirements.minConfidence) {
    failures.push(`confidence ${context.confidence.toFixed(3)} is below required ${requirements.minConfidence}.`);
  }
  if (requirements.requiresBaseline && !context.dynamicPattern.baseline.comparisonAvailable) {
    failures.push("eligible longitudinal baseline is required.");
  }
  for (const [id, minimum] of Object.entries(requirements.minEvidence ?? {})) {
    const value = evidenceValue(context.dynamicPattern, id);
    if (value < minimum) failures.push(`${id} evidence ${value.toFixed(3)} is below required ${minimum}.`);
  }
  for (const [id, minimum] of Object.entries(requirements.minSubpatterns ?? {}) as Array<[AtlasSubpatternId, number]>) {
    const value = subpatternScore(context.atlasResult, id);
    if (value < minimum) failures.push(`${id} subpattern ${value.toFixed(3)} is below required ${minimum}.`);
  }
  return failures;
}

function contradictionFailures(contradictions: MatrixContradictions, context: NamingResolutionContext) {
  const vector = context.vector;
  const failures: string[] = [];
  const checks: Array<[keyof StateVector, number | undefined, number | undefined, string]> = [
    ["activation", contradictions.minActivation, contradictions.maxActivation, "activation"],
    ["organization", contradictions.minOrganization, contradictions.maxOrganization, "organization"],
    ["regulation", contradictions.minRegulation, contradictions.maxRegulation, "regulation"],
    ["expression", contradictions.minExpression, contradictions.maxExpression, "expression"],
    ["relationalOrientation", contradictions.minRelationalOrientation, contradictions.maxRelationalOrientation, "relational orientation"],
    ["direction", contradictions.minDirection, contradictions.maxDirection, "direction"],
    ["capacity", contradictions.minCapacity, contradictions.maxCapacity, "capacity"],
  ];

  for (const [key, min, max, label] of checks) {
    const value = valueFor(vector, key);
    if (min !== undefined && value >= min) failures.push(`contradiction: ${label} ${value.toFixed(2)} is at or above ${min}.`);
    if (max !== undefined && value <= max) failures.push(`contradiction: ${label} ${value.toFixed(2)} is at or below ${max}.`);
  }
  for (const [id, minimum] of Object.entries(contradictions.minEvidence ?? {})) {
    const value = evidenceValue(context.dynamicPattern, id);
    if (value >= minimum) failures.push(`contradiction: ${id} evidence ${value.toFixed(3)} is at or above ${minimum}.`);
  }
  for (const [id, minimum] of Object.entries(contradictions.minSubpatterns ?? {}) as Array<[AtlasSubpatternId, number]>) {
    const value = subpatternScore(context.atlasResult, id);
    if (value >= minimum) failures.push(`contradiction: ${id} subpattern ${value.toFixed(3)} is at or above ${minimum}.`);
  }
  if (contradictions.poorCapture && context.poorEvidence) failures.push("contradiction: capture quality is insufficient.");
  return failures;
}

export function deriveOrganizingQuality(dynamic: DynamicPatternResult): OrganizingQuality {
  const vector = dynamic.stateVector;
  const fragmentation = evidenceValue(dynamic, "activation-with-fragmentation");
  const coherence = evidenceValue(dynamic, "activation-with-coherence");
  if (vector.organization < 0.42 || fragmentation >= 0.55) return "fragmented";
  if (vector.organization >= 0.58 && coherence >= 0.55 && vector.capacity >= 0.45 && vector.regulation >= 0.45) return "coherent";
  if (vector.activation >= 0.6 && vector.capacity < 0.55) return "pressurized";
  if (vector.capacity < 0.45 || vector.regulation < 0.45) return "strained";
  if (vector.expression < 0.52 || vector.relationalOrientation < 0.52) return "contained";
  if (vector.expression >= 0.68 && vector.relationalOrientation >= 0.58) return "open";
  if (vector.organization >= 0.58) return "coherent";
  return "adaptive";
}

function entryMatches(entry: CanonicalNamingMatrixEntry, context: NamingResolutionContext) {
  const secondaryMatches =
    entry.secondaryFamily === undefined
      ? context.secondaryFamily === null || context.mode !== "composite"
      : context.secondaryFamily === entry.secondaryFamily ||
        (entry.primaryFamily === context.secondaryFamily && entry.secondaryFamily === context.primaryFamily);
  if (entry.primaryFamily !== context.primaryFamily && entry.primaryFamily !== context.secondaryFamily) return false;
  if (!secondaryMatches) return false;
  if (entry.resultType === "composite" && context.mode !== "composite") return false;
  if (entry.organizingQuality && entry.organizingQuality !== deriveOrganizingQuality(context.dynamicPattern)) return false;
  return requirementFailures(entry.required, context).length === 0 && contradictionFailures(entry.contradictions, context).length === 0;
}

export function resolveNamingMatrixEntry(context: NamingResolutionContext) {
  const organizingQuality = deriveOrganizingQuality(context.dynamicPattern);
  const exact = CANONICAL_NAMING_MATRIX.find((entry) => entryMatches(entry, context));
  const single = exact ?? CANONICAL_NAMING_MATRIX.find((entry) =>
    entry.primaryFamily === context.primaryFamily &&
    !entry.secondaryFamily &&
    requirementFailures(entry.required, context).length === 0,
  );

  return {
    entry: single ?? null,
    organizingQuality,
    requirementFailures: single ? requirementFailures(single.required, context) : [],
    contradictionFailures: single ? contradictionFailures(single.contradictions, context) : [],
  };
}

export function fallbackDisplayName(primary: PatternFamily, secondary: PatternFamily | null, dynamic: DynamicPatternResult) {
  const organizingQuality = deriveOrganizingQuality(dynamic);
  if (primary === "activated" && organizingQuality === "fragmented") return "The Pressurized Reorganizer";
  return CANONICAL_NAMING_MATRIX.find((entry) => entry.primaryFamily === primary && !entry.secondaryFamily)?.displayName ?? SINGLE_FAMILY_DISPLAY_NAMES[primary];
}

export function familyDisplayName(family: PatternFamily) {
  return CANONICAL_NAMING_MATRIX.find((entry) => entry.primaryFamily === family && !entry.secondaryFamily)?.displayName ?? SINGLE_FAMILY_DISPLAY_NAMES[family];
}
