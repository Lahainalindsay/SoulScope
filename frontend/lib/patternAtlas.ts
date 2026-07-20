export type AtlasEvidenceId =
  | "sustained-effort"
  | "reduced-recovery"
  | "cognitive-searching"
  | "steady-regulation"
  | "protective-restraint"
  | "expressive-flexibility"
  | "adaptive-momentum"
  | "fragmented-processing"
  | "returning-capacity"
  | "grounded-presence"
  | "social-availability"
  | "directional-clarity";

export type AtlasSubpatternId =
  | "carrying-forward"
  | "recovery-gap"
  | "internal-processing"
  | "protective-expression"
  | "emotional-fluidity"
  | "adaptive-regulation"
  | "quiet-overload"
  | "emerging-restoration"
  | "settled-presence"
  | "relational-openness"
  | "focused-direction"
  | "reorganizing-capacity";

export type AtlasFamilyId =
  | "overextended"
  | "reflective"
  | "protective"
  | "adaptive"
  | "recovering"
  | "grounded"
  | "expressive"
  | "purposeful";

export type AtlasProfileId =
  | "overextended-steward"
  | "quiet-processor"
  | "reflective-protector"
  | "adaptive-builder"
  | "emerging-restorer"
  | "grounded-navigator"
  | "contained-communicator"
  | "open-integrator"
  | "focused-creator"
  | "quietly-overloaded"
  | "reorganizing-explorer"
  | "steady-supporter";

export type EvidenceStrength = "absent" | "emerging" | "present" | "pronounced";

export type AtlasEvidence = {
  id: AtlasEvidenceId;
  label: string;
  description: string;
  researchBoundary: string;
};

export type AtlasSubpattern = {
  id: AtlasSubpatternId;
  label: string;
  description: string;
  evidenceWeights: Partial<Record<AtlasEvidenceId, number>>;
};

export type AtlasProfile = {
  id: AtlasProfileId;
  name: string;
  family: AtlasFamilyId;
  theme: string;
  subpatternWeights: Partial<Record<AtlasSubpatternId, number>>;
  dailyLife: [string, string, string, string];
  strengths: [string, string, string];
  support: [string, string, string];
  watchFor: [string, string, string];
};

export const ATLAS_EVIDENCE: Record<AtlasEvidenceId, AtlasEvidence> = {
  "sustained-effort": {
    id: "sustained-effort",
    label: "Sustained Effort",
    description: "The scan remained organized, but maintaining that organization appeared to require continued output.",
    researchBoundary: "Derived from converging timing, intensity, prosodic and within-person change signals; never interpreted from one acoustic feature alone.",
  },
  "reduced-recovery": {
    id: "reduced-recovery",
    label: "Reduced Recovery",
    description: "Restorative capacity appeared less available than the amount of effort being used.",
    researchBoundary: "A functional observation, not a claim about sleep, illness, burnout or nervous-system diagnosis.",
  },
  "cognitive-searching": {
    id: "cognitive-searching",
    label: "Cognitive Searching",
    description: "Response timing and vocal organization suggest additional work was occurring before expression settled.",
    researchBoundary: "Pause and speech-rate findings vary across people and tasks; this signal requires prompt-relative and personal-baseline support.",
  },
  "steady-regulation": {
    id: "steady-regulation",
    label: "Steady Regulation",
    description: "The voice and pacing remained comparatively organized across the scan.",
    researchBoundary: "Steadiness describes signal consistency, not emotional wellness or absence of difficulty.",
  },
  "protective-restraint": {
    id: "protective-restraint",
    label: "Protective Restraint",
    description: "Expression remained available while becoming more contained around greater demand or personal material.",
    researchBoundary: "Requires cross-prompt change; never inferred from a naturally quiet, flat or reserved speaking style alone.",
  },
  "expressive-flexibility": {
    id: "expressive-flexibility",
    label: "Expressive Flexibility",
    description: "Vocal movement, timing and facial activity shifted without losing overall coherence.",
    researchBoundary: "Healthy variability is assessed relative to the individual and recording context, not a universal expressiveness ideal.",
  },
  "adaptive-momentum": {
    id: "adaptive-momentum",
    label: "Adaptive Momentum",
    description: "The scan showed continued direction alongside the ability to adjust rather than rigidly force one response style.",
    researchBoundary: "A SoulScope interpretive construct built from multiple observable capacities.",
  },
  "fragmented-processing": {
    id: "fragmented-processing",
    label: "Fragmented Processing",
    description: "Several response signals appeared less synchronized, suggesting that organizing the response required extra work.",
    researchBoundary: "Must be separated from poor capture quality, language differences, disability and normal conversational variation.",
  },
  "returning-capacity": {
    id: "returning-capacity",
    label: "Returning Capacity",
    description: "Compared with the person’s recent baseline, steadiness or available energy appears to be re-emerging.",
    researchBoundary: "Longitudinal only; unavailable on a first scan and never claimed from population norms.",
  },
  "grounded-presence": {
    id: "grounded-presence",
    label: "Grounded Presence",
    description: "Attention, pacing and expression remained available without one area clearly dominating the scan.",
    researchBoundary: "A balanced signal pattern, not a personality judgment or proof of calmness.",
  },
  "social-availability": {
    id: "social-availability",
    label: "Relational Availability",
    description: "The scan retained responsiveness and expressive contact rather than narrowing across interpersonal prompts.",
    researchBoundary: "Describes response availability during this scan only, not attachment style or relationship health.",
  },
  "directional-clarity": {
    id: "directional-clarity",
    label: "Directional Clarity",
    description: "Responses became more organized around choice, movement or next steps.",
    researchBoundary: "A prompt-dependent functional signal, not proof that a decision is correct.",
  },
};

export const ATLAS_SUBPATTERNS: Record<AtlasSubpatternId, AtlasSubpattern> = {
  "carrying-forward": { id: "carrying-forward", label: "Carrying Forward", description: "Momentum remains available through sustained demand.", evidenceWeights: { "sustained-effort": 1, "adaptive-momentum": .75, "directional-clarity": .35 } },
  "recovery-gap": { id: "recovery-gap", label: "Recovery Gap", description: "Output is currently outpacing restoration.", evidenceWeights: { "reduced-recovery": 1, "sustained-effort": .7, "fragmented-processing": .25 } },
  "internal-processing": { id: "internal-processing", label: "Internal Processing", description: "Meaning is being organized before it becomes easy to express.", evidenceWeights: { "cognitive-searching": 1, "fragmented-processing": .55, "steady-regulation": .2 } },
  "protective-expression": { id: "protective-expression", label: "Protective Expression", description: "Connection remains possible while expression is carefully held.", evidenceWeights: { "protective-restraint": 1, "social-availability": .45, "steady-regulation": .35 } },
  "emotional-fluidity": { id: "emotional-fluidity", label: "Emotional Fluidity", description: "Expression can move and adapt without losing coherence.", evidenceWeights: { "expressive-flexibility": 1, "social-availability": .5, "steady-regulation": .35 } },
  "adaptive-regulation": { id: "adaptive-regulation", label: "Adaptive Regulation", description: "Steadiness and flexibility are working together.", evidenceWeights: { "steady-regulation": .8, "adaptive-momentum": 1, "expressive-flexibility": .45 } },
  "quiet-overload": { id: "quiet-overload", label: "Quiet Overload", description: "The system remains functional while demand accumulates beneath the surface.", evidenceWeights: { "sustained-effort": .8, "reduced-recovery": 1, "steady-regulation": .4, "cognitive-searching": .45 } },
  "emerging-restoration": { id: "emerging-restoration", label: "Emerging Restoration", description: "Capacity is returning, though the system is not fully replenished.", evidenceWeights: { "returning-capacity": 1, "reduced-recovery": .35, "steady-regulation": .55 } },
  "settled-presence": { id: "settled-presence", label: "Settled Presence", description: "Attention and expression remain available without concentrated strain.", evidenceWeights: { "grounded-presence": 1, "steady-regulation": .75, "expressive-flexibility": .3 } },
  "relational-openness": { id: "relational-openness", label: "Relational Openness", description: "Responsiveness and connection remain accessible across the scan.", evidenceWeights: { "social-availability": 1, "expressive-flexibility": .55, "protective-restraint": -.35 } },
  "focused-direction": { id: "focused-direction", label: "Focused Direction", description: "Available energy is organizing around movement or purpose.", evidenceWeights: { "directional-clarity": 1, "adaptive-momentum": .75, "steady-regulation": .3 } },
  "reorganizing-capacity": { id: "reorganizing-capacity", label: "Reorganizing Capacity", description: "The system is actively finding a more workable arrangement.", evidenceWeights: { "cognitive-searching": .55, "adaptive-momentum": .7, "returning-capacity": .55, "fragmented-processing": .35 } },
};

export const ATLAS_PROFILES: AtlasProfile[] = [
  { id: "overextended-steward", name: "The Overextended Steward", family: "overextended", theme: "You are still showing up, but restoration is no longer keeping pace with responsibility.", subpatternWeights: { "carrying-forward": .8, "recovery-gap": 1, "quiet-overload": .75 }, dailyLife: ["Continuing to handle what matters while privately feeling the cost.", "Finding it easier to keep going than to fully stop.", "Protecting other people’s needs before restoring your own capacity.", "Looking capable from the outside while needing more room than others can see."], strengths: ["Reliability remains available.", "Direction has not disappeared.", "You can still organize action under pressure."], support: ["A smaller demand surface.", "Recovery that is protected rather than postponed.", "Permission to receive support before reaching depletion."], watchFor: ["Irritability after sustained output.", "Rest that never feels complete.", "Treating endurance as proof that the load is sustainable."] },
  { id: "quiet-processor", name: "The Quiet Processor", family: "reflective", theme: "Your system appears to be making meaning internally before expression can fully settle.", subpatternWeights: { "internal-processing": 1, "protective-expression": .35, "reorganizing-capacity": .45 }, dailyLife: ["Needing time after a conversation to know what you actually think.", "Replaying details until the larger meaning becomes clear.", "Answering carefully when several truths feel present at once.", "Feeling clearer in quiet than under immediate pressure."], strengths: ["Depth of reflection.", "Pattern recognition.", "Careful meaning-making."], support: ["More time before decisions.", "Fewer simultaneous open loops.", "A private place to finish thoughts."], watchFor: ["Mistaking continued thinking for progress.", "Delaying expression until it feels perfect.", "Carrying unresolved material into rest." ] },
  { id: "reflective-protector", name: "The Reflective Protector", family: "protective", theme: "You remain present while carefully controlling how much of the inner experience becomes visible.", subpatternWeights: { "protective-expression": 1, "internal-processing": .55, "settled-presence": .2 }, dailyLife: ["Choosing words carefully around emotionally important topics.", "Staying engaged while keeping the most vulnerable part private.", "Monitoring the room before deciding how open to be.", "Wanting connection without wanting to be rushed into it."], strengths: ["Discernment.", "Emotional awareness.", "The ability to stay present without overexposing yourself."], support: ["Trustworthy pacing.", "Privacy without isolation.", "Conditions where honesty does not require self-abandonment."], watchFor: ["Protection becoming disconnection.", "Calm presentation hiding unmet needs.", "Waiting for perfect safety before speaking." ] },
  { id: "adaptive-builder", name: "The Adaptive Builder", family: "adaptive", theme: "You are finding workable movement while adjusting to changing demands.", subpatternWeights: { "adaptive-regulation": 1, "focused-direction": .75, "carrying-forward": .35 }, dailyLife: ["Changing the plan without losing the purpose.", "Solving what is directly in front of you.", "Using structure without becoming trapped by it.", "Making progress through steady course correction."], strengths: ["Practical flexibility.", "Forward orientation.", "Usable steadiness."], support: ["Clear priorities.", "Enough margin to adjust.", "Feedback that helps refine rather than derail."], watchFor: ["Constant adaptation becoming its own demand.", "Solving around needs instead of addressing them.", "Building momentum without checking recovery." ] },
  { id: "emerging-restorer", name: "The Emerging Restorer", family: "recovering", theme: "Capacity is beginning to return, but it still benefits from being protected while it becomes reliable again.", subpatternWeights: { "emerging-restoration": 1, "adaptive-regulation": .45, "recovery-gap": .25 }, dailyLife: ["Having more energy, but not wanting to spend all of it at once.", "Returning to routines with more flexibility than before.", "Noticing small signs of clarity before the whole picture feels settled.", "Feeling capable in one moment and more easily depleted in another."], strengths: ["Returning responsiveness.", "Patience with gradual change.", "Awareness of capacity."], support: ["Consistency over intensity.", "Gentle re-entry into demand.", "Room to stop before exhaustion returns."], watchFor: ["Treating one better day as complete recovery.", "Spending new energy immediately.", "Comparing the present to your strongest past baseline." ] },
  { id: "grounded-navigator", name: "The Grounded Navigator", family: "grounded", theme: "Steadiness and direction are available without one part of the system carrying the entire load.", subpatternWeights: { "settled-presence": 1, "focused-direction": .75, "adaptive-regulation": .5 }, dailyLife: ["Making decisions without excessive internal friction.", "Moving between responsibilities without becoming scattered.", "Recovering more easily after effort.", "Knowing what deserves attention and what can wait."], strengths: ["Clear presence.", "Balanced responsiveness.", "Practical discernment."], support: ["Protecting the rhythm that created this steadiness.", "Enough space between demands.", "Continuing what is already working."], watchFor: ["Adding unnecessary demands because capacity is available.", "Assuming balance will maintain itself.", "Overlooking the conditions supporting clarity." ] },
  { id: "contained-communicator", name: "The Contained Communicator", family: "protective", theme: "Expression is available, but it is being shaped carefully before it is released.", subpatternWeights: { "protective-expression": .9, "focused-direction": .35, "internal-processing": .45 }, dailyLife: ["Saying the essential thing while leaving context unspoken.", "Preferring precise language over emotional overflow.", "Taking time to decide what belongs in the conversation.", "Communicating clearly while remaining internally guarded."], strengths: ["Precision.", "Boundary awareness.", "Composure in communication."], support: ["More room for nuance.", "Low-pressure conversation.", "A listener who does not force immediacy."], watchFor: ["Important context remaining invisible.", "Precision replacing emotional truth.", "Being understood functionally but not fully." ] },
  { id: "open-integrator", name: "The Open Integrator", family: "expressive", theme: "Expression, responsiveness and internal organization are moving together with useful flexibility.", subpatternWeights: { "emotional-fluidity": 1, "relational-openness": .85, "settled-presence": .55 }, dailyLife: ["Finding words that match what you feel.", "Moving through emotion without becoming trapped in it.", "Staying connected while allowing the response to change.", "Letting insight emerge through expression rather than only before it."], strengths: ["Emotional flexibility.", "Relational presence.", "Coherent expression."], support: ["Honest conversation.", "Creative or embodied expression.", "Relationships that can hold nuance."], watchFor: ["Overextending availability to others.", "Using expression without enough restoration.", "Mistaking openness for unlimited capacity." ] },
  { id: "focused-creator", name: "The Focused Creator", family: "purposeful", theme: "Available energy is concentrating around something that feels worth moving toward.", subpatternWeights: { "focused-direction": 1, "carrying-forward": .6, "emotional-fluidity": .25 }, dailyLife: ["Seeing the next useful step more clearly.", "Feeling energized by meaningful work.", "Reducing distractions without needing to force concentration.", "Turning internal material into a concrete direction."], strengths: ["Purposeful attention.", "Creative momentum.", "Decisive organization."], support: ["Protected focus time.", "A realistic next milestone.", "Recovery that preserves creative capacity."], watchFor: ["Purpose becoming pressure.", "Ignoring body signals during momentum.", "Tying self-worth to output." ] },
  { id: "quietly-overloaded", name: "The Quietly Overloaded", family: "overextended", theme: "You may be maintaining more than your current recovery can comfortably support, without one dramatic point of collapse.", subpatternWeights: { "quiet-overload": 1, "recovery-gap": .8, "internal-processing": .35 }, dailyLife: ["Getting through the day and only noticing the depletion afterward.", "Feeling mentally busy even during downtime.", "Becoming more selective with conversation or stimulation.", "Managing many small demands that collectively feel heavy."], strengths: ["Functional steadiness.", "Persistence.", "The ability to distribute attention across demands."], support: ["Fewer simultaneous responsibilities.", "Quiet that actually reduces input.", "Naming the total load instead of minimizing each piece."], watchFor: ["Reduced patience.", "Difficulty switching tasks.", "Believing the absence of crisis means the load is manageable." ] },
  { id: "reorganizing-explorer", name: "The Reorganizing Explorer", family: "reflective", theme: "Your system is testing new ways of understanding or responding while the final direction is still forming.", subpatternWeights: { "reorganizing-capacity": 1, "internal-processing": .55, "adaptive-regulation": .45 }, dailyLife: ["Trying several explanations before one feels true.", "Changing your mind as new information settles.", "Feeling between an old way of responding and a new one.", "Needing experimentation more than immediate certainty."], strengths: ["Curiosity.", "Capacity to revise.", "Openness to new organization."], support: ["Low-stakes experimentation.", "Time to notice what fits.", "Permission for clarity to arrive gradually."], watchFor: ["Endless exploration without commitment.", "Treating uncertainty as failure.", "Overloading yourself with too many possible directions." ] },
  { id: "steady-supporter", name: "The Steady Supporter", family: "grounded", theme: "Relational availability and steadiness are both present, allowing you to respond without losing your center.", subpatternWeights: { "settled-presence": .8, "relational-openness": 1, "adaptive-regulation": .45 }, dailyLife: ["Being present with others without absorbing everything they carry.", "Listening while remaining connected to your own perspective.", "Offering support without immediately taking control.", "Moving between connection and solitude without a sharp internal shift."], strengths: ["Relational steadiness.", "Responsive presence.", "Balanced support."], support: ["Reciprocal connection.", "Boundaries that preserve warmth.", "Time that belongs only to you."], watchFor: ["Support becoming responsibility.", "Quietly carrying what others leave behind.", "Assuming steadiness means you need less care." ] },
];

export type AtlasInput = Partial<Record<AtlasEvidenceId, number>>;
export type AtlasResult = { profile: AtlasProfile; score: number; supporting: Array<{ profile: AtlasProfile; score: number }>; subpatterns: Array<{ id: AtlasSubpatternId; score: number }> };

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function scoreAtlasSubpatterns(input: AtlasInput) {
  return Object.values(ATLAS_SUBPATTERNS)
    .map((subpattern) => {
      let positiveWeight = 0;
      let score = 0;
      for (const [evidenceId, weight] of Object.entries(subpattern.evidenceWeights) as Array<[AtlasEvidenceId, number]>) {
        const evidence = clamp(input[evidenceId] ?? 0);
        score += weight >= 0 ? evidence * weight : (1 - evidence) * Math.abs(weight);
        positiveWeight += Math.abs(weight);
      }
      return { id: subpattern.id, score: positiveWeight ? clamp(score / positiveWeight) : 0 };
    })
    .sort((a, b) => b.score - a.score);
}

export function resolveAtlasProfile(input: AtlasInput): AtlasResult {
  const subpatterns = scoreAtlasSubpatterns(input);
  const subpatternMap = Object.fromEntries(subpatterns.map((entry) => [entry.id, entry.score])) as Record<AtlasSubpatternId, number>;
  const ranked = ATLAS_PROFILES.map((profile) => {
    let score = 0;
    let weightTotal = 0;
    for (const [subpatternId, weight] of Object.entries(profile.subpatternWeights) as Array<[AtlasSubpatternId, number]>) {
      score += subpatternMap[subpatternId] * weight;
      weightTotal += weight;
    }
    return { profile, score: weightTotal ? clamp(score / weightTotal) : 0 };
  }).sort((a, b) => b.score - a.score);

  return { profile: ranked[0].profile, score: ranked[0].score, supporting: ranked.slice(1, 3), subpatterns: subpatterns.slice(0, 4) };
}
