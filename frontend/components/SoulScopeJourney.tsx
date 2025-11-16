import { useMemo, useState } from "react";

type NodeKind = "intro" | "choice" | "scale" | "breath" | "results";

type BaseNode = {
  id: string;
  kind: NodeKind;
  title: string;
  text: string;
  next?: string;
};

type ChoiceNode = BaseNode & {
  kind: "choice";
  field: string;
  options: { id: string; label: string }[];
};

type ScaleNode = BaseNode & {
  kind: "scale";
  field: string;
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
};

type IntroNode = BaseNode & { kind: "intro" };
type BreathNode = BaseNode & { kind: "breath" };
type ResultsNode = BaseNode & { kind: "results" };

type TreeNode = IntroNode | ChoiceNode | ScaleNode | BreathNode | ResultsNode;

type Answers = Record<string, string | number>;

const soulScopeTree: TreeNode[] = [
  {
    id: "intro",
    kind: "intro",
    title: "Return to Your Center",
    text: "This gentle scan listens to your body, heart, mind, and boundaries to see where you may have drifted from your natural balance.",
    next: "starting-point",
  },
  {
    id: "starting-point",
    kind: "choice",
    title: "How Are You Really?",
    text: "Which feels most honest right now?",
    field: "starting_state",
    options: [
      { id: "wired", label: "Running on fumes — wired, busy, hard to slow down" },
      { id: "drained", label: "Flat or exhausted — tired, hard to care" },
      { id: "heavy", label: "Carrying a lot emotionally — heart feels full or tight" },
      { id: "okay_tense", label: "Mostly okay, but with quiet tension underneath" },
    ],
    next: "body-awareness",
  },
  {
    id: "body-awareness",
    kind: "scale",
    title: "Body Groundedness",
    text: "On a scale from grounded to scattered, how does your body feel in this moment?",
    min: 1,
    max: 5,
    minLabel: "Very Grounded",
    maxLabel: "Very Scattered",
    field: "body_state",
    next: "heart-space",
  },
  {
    id: "heart-space",
    kind: "choice",
    title: "Heart Space",
    text: "If you feel into your heart area right now, what fits best?",
    field: "heart_state",
    options: [
      { id: "soft", label: "Soft, open, present" },
      { id: "guarded", label: "Guarded, careful, a bit armored" },
      { id: "heavy", label: "Heavy, holding a lot for you or others" },
      { id: "numb", label: "Muted or numb, hard to feel much" },
    ],
    next: "mind-noise",
  },
  {
    id: "mind-noise",
    kind: "scale",
    title: "Mind vs Inner Knowing",
    text: "How loud is your mind compared to your deeper, quieter knowing?",
    min: 1,
    max: 5,
    minLabel: "Mostly Quiet",
    maxLabel: "Very Loud",
    field: "mind_noise",
    next: "boundaries",
  },
  {
    id: "boundaries",
    kind: "choice",
    title: "Energy Boundaries",
    text: "Lately, how does your energy behave around other people’s needs?",
    field: "boundary_pattern",
    options: [
      { id: "overgiving", label: "I overgive and then crash later" },
      { id: "collapsed", label: "I pull away / shut down to protect myself" },
      { id: "porous", label: "I absorb other people’s moods easily" },
      { id: "balanced", label: "Mostly balanced — I can say yes/no from truth" },
    ],
    next: "self-connection",
  },
  {
    id: "self-connection",
    kind: "scale",
    title: "Connection to Yourself",
    text: "Right now, how connected do you feel to your inner truth and needs?",
    min: 1,
    max: 5,
    minLabel: "Very Disconnected",
    maxLabel: "Very Connected",
    field: "self_connection",
    next: "breath",
  },
  {
    id: "breath",
    kind: "breath",
    title: "A Single Honest Breath",
    text: "Take one slow, honest breath — not a performance, just what’s real. Notice where it naturally goes: chest, belly, throat… nothing to fix, just see it.",
    next: "results",
  },
  {
    id: "results",
    kind: "results",
    title: "Alignment Snapshot",
    text: "Here’s a gentle mirror of how your energy may be arranged in this moment. Not a label — just a reflection.",
  },
];

const nodeIndexById: Record<string, number> = soulScopeTree.reduce((acc, node, index) => {
  acc[node.id] = index;
  return acc;
}, {} as Record<string, number>);

function interpretAnswers(answers: Answers) {
  const starting = (answers["starting_state"] as string | undefined) ?? "okay_tense";
  const body = (answers["body_state"] as number | undefined) ?? 3;
  const heart = (answers["heart_state"] as string | undefined) ?? "guarded";
  const mind = (answers["mind_noise"] as number | undefined) ?? 3;
  const boundary = (answers["boundary_pattern"] as string | undefined) ?? "balanced";
  const selfConn = (answers["self_connection"] as number | undefined) ?? 3;

  let overallPattern = "Mixed but Manageable";
  let primaryDrift = "Carrying more than you’re admitting to yourself";
  let centerDirection = "Turning gently back toward your own pace and needs";
  let meaning =
    "Your answers suggest a system that has been staying functional while quietly stretching beyond what feels natural. There’s resilience here, but also a hint of fatigue underneath.";
  let suggestion =
    "Today, experiment with choosing the smallest possible next step that feels kind to your body – not impressive, not productive, just kind.";

  if (starting === "wired" && mind >= 4) {
    overallPattern = "Wired & Thin";
    primaryDrift = "Pulled up into the head and away from the body";
    centerDirection = "Letting your body set the pace instead of your thoughts";
    meaning =
      "Your energy looks like it’s been running hot – busy mind, less groundedness. That often happens when life has demanded a lot, or when it feels safer to stay in motion than to feel too much.";
    suggestion =
      "Try pausing for 30 seconds with your awareness in your feet or hips. No big rituals – just letting your body know it’s allowed to be here and not rush.";
  }

  if (starting === "drained" && body <= 2) {
    overallPattern = "Quiet & Drained";
    primaryDrift = "Energy pulled inward, not much to give";
    centerDirection = "Letting rest be valid instead of a problem to fix";
    meaning =
      "Your system feels more collapsed than activated – like it’s had to shut down a bit to cope. This doesn’t mean you’re failing; it often means you’ve carried too much for too long.";
    suggestion =
      "If it feels safe, give yourself permission to do one thing today at 70% instead of 120%. Let “good enough” be truly enough for now.";
  }

  if (heart === "heavy") {
    overallPattern = "Carrying Quiet Weight";
    primaryDrift = "Holding too much emotional weight in the heart space";
    centerDirection = "Letting some of that weight be seen and shared";
    meaning =
      "There’s a sense of the heart doing a lot of work – maybe for you, maybe for others, maybe both. Strength is beautiful, but constant carrying is exhausting.";
    suggestion =
      "If you can, name one thing you’re tired of holding alone – in a journal, a note to yourself, or with someone safe. Let the truth exist outside your chest for a moment.";
  }

  if (boundary === "overgiving" || boundary === "porous") {
    overallPattern = "Leaking Energy Outward";
    primaryDrift = "Prioritizing others’ needs over your own center";
    centerDirection = "Reclaiming a little energy for yourself without guilt";
    meaning =
      "Your pattern suggests that other people’s needs and feelings might be taking up a lot of space inside you. It often starts from love, but over time it pulls you away from your own center.";
    suggestion =
      "Pick one small boundary today – a slower reply, a softer no, or a moment to check in with your body before saying yes. Let your energy ask, “Is this truly okay for me?”";
  }

  if (selfConn >= 4 && body <= 3 && mind <= 3 && heart === "soft") {
    overallPattern = "Near-Center";
    primaryDrift = "Closer to balance than your old story might believe";
    centerDirection = "Trusting the steadiness that’s already here";
    meaning =
      "Your responses suggest more alignment than chaos. Even if life isn’t perfect, there’s a thread of genuine connection to yourself present right now.";
    suggestion =
      "Notice where regulation and okay-ness already live in your day – a moment, a place, a person. Let that count as real evidence of your balance, not an exception.";
  }

  return {
    overallPattern,
    primaryDrift,
    centerDirection,
    meaning,
    suggestion,
  };
}

export default function SoulScopeJourney() {
  const [currentId, setCurrentId] = useState(soulScopeTree[0].id);
  const [answers, setAnswers] = useState<Answers>({});
  const currentNode = useMemo(() => soulScopeTree[nodeIndexById[currentId]], [currentId]);
  const [scaleDraft, setScaleDraft] = useState<number | undefined>(undefined);

  const progress =
    (nodeIndexById[currentId] / (soulScopeTree.length - 1)) * 100;

  const goToNext = (next?: string) => {
    if (next) {
      setCurrentId(next);
    }
  };

  const restart = () => {
    setAnswers({});
    setCurrentId(soulScopeTree[0].id);
    setScaleDraft(undefined);
  };

  const handleChoiceSelect = (node: ChoiceNode, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [node.field]: optionId,
    }));
    goToNext(node.next);
  };

  const handleScaleConfirm = (node: ScaleNode) => {
    const value =
      scaleDraft ??
      (typeof answers[node.field] === "number" ? (answers[node.field] as number) : Math.round((node.min + node.max) / 2));
    setAnswers((prev) => ({
      ...prev,
      [node.field]: value,
    }));
    setScaleDraft(undefined);
    goToNext(node.next);
  };

  const renderNode = () => {
    switch (currentNode.kind) {
      case "intro":
        return (
          <>
            <h2 className="ss-title">{currentNode.title}</h2>
            <p className="ss-text">{currentNode.text}</p>
            <div className="ss-actions">
              <button className="ss-btn-primary" onClick={() => goToNext(currentNode.next)}>
                Begin Scan
              </button>
            </div>
          </>
        );
      case "choice":
        return (
          <>
            <h2 className="ss-title">{currentNode.title}</h2>
            <p className="ss-text">{currentNode.text}</p>
            <div className="ss-choice-grid">
              {currentNode.options.map((option) => {
                const active = answers[currentNode.field] === option.id;
                return (
                  <button
                    key={option.id}
                    className={`ss-choice-chip ${active ? "ss-choice-chip-active" : ""}`}
                    onClick={() => handleChoiceSelect(currentNode, option.id)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </>
        );
      case "scale":
        return (
          <>
            <h2 className="ss-title">{currentNode.title}</h2>
            <p className="ss-text">{currentNode.text}</p>
            <div className="ss-scale">
              <div className="ss-scale-labels">
                <span>{currentNode.minLabel}</span>
                <span>{currentNode.maxLabel}</span>
              </div>
              <input
                type="range"
                className="ss-scale-input"
                min={currentNode.min}
                max={currentNode.max}
                value={
                  scaleDraft ??
                  (typeof answers[currentNode.field] === "number"
                    ? (answers[currentNode.field] as number)
                    : Math.round((currentNode.min + currentNode.max) / 2))
                }
                onChange={(event) => setScaleDraft(Number(event.target.value))}
              />
            </div>
            <div className="ss-actions">
              <button className="ss-btn-primary" onClick={() => handleScaleConfirm(currentNode)}>
                Continue
              </button>
            </div>
          </>
        );
      case "breath":
        return (
          <>
            <h2 className="ss-title">{currentNode.title}</h2>
            <p className="ss-text">{currentNode.text}</p>
            <div className="ss-breath">
              <div className="ss-breath-orb" aria-hidden="true" />
              <p className="ss-breath-caption">Just one honest breath.</p>
            </div>
            <div className="ss-actions">
              <button className="ss-btn-primary" onClick={() => goToNext(currentNode.next)}>
                See Reflection
              </button>
            </div>
          </>
        );
      case "results": {
        const summary = interpretAnswers(answers);
        return (
          <>
            <h2 className="ss-title">{currentNode.title}</h2>
            <p className="ss-text">{currentNode.text}</p>
            <div className="ss-result-panel">
              <div className="ss-result-pill">
                <span className="ss-result-label">Pattern</span>
                <span className="ss-result-value">{summary.overallPattern}</span>
              </div>
              <div className="ss-result-pill">
                <span className="ss-result-label">Drift</span>
                <span className="ss-result-value">{summary.primaryDrift}</span>
              </div>
              <div className="ss-result-pill">
                <span className="ss-result-label">Direction</span>
                <span className="ss-result-value">{summary.centerDirection}</span>
              </div>
            </div>
            <div className="ss-result-block">
              <h3 className="ss-result-heading">What this might mean</h3>
              <p className="ss-text">{summary.meaning}</p>
            </div>
            <div className="ss-result-block">
              <h3 className="ss-result-heading">Suggested next micro-step</h3>
              <p className="ss-text">{summary.suggestion}</p>
            </div>
            <div className="ss-actions">
              <button className="ss-btn-primary" onClick={restart}>
                Run it again
              </button>
            </div>
          </>
        );
      }
      default:
        return null;
    }
  };

  return (
    <section className="ss-root">
      <div className="ss-gradient" aria-hidden="true" />
      <div className="ss-shell">
        <header className="ss-header">
          <div className="ss-brand-mark">
            <div className="ss-brand-orbit">
              <div className="ss-brand-core" />
            </div>
          </div>
          <div>
            <p className="ss-brand-title">SoulScope™</p>
            <p className="ss-brand-subtitle">Personal alignment · Whole-self balance</p>
          </div>
        </header>

        <main className="ss-main">
          <div className="ss-card">
            <div className="ss-card-header">
              <div>
                <p className="ss-label">Session Intake</p>
                <p className="ss-label-sub">Core Energy &amp; Pattern Mapping</p>
              </div>
              <div className="ss-progress">
                <div className="ss-progress-bar">
                  <div className="ss-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="ss-progress-text">{Math.round(progress)}%</p>
              </div>
            </div>
            <div className="ss-card-body">{renderNode()}</div>
            {currentNode.kind !== "intro" && currentNode.kind !== "results" && (
              <div className="ss-card-footer">
                <button
                  className="ss-btn-ghost"
                  onClick={() => {
                    const index = nodeIndexById[currentId];
                    if (index > 0) {
                      setCurrentId(soulScopeTree[index - 1].id);
                    }
                  }}
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </main>

        <footer className="ss-footer">
          Your body tells the truth. SoulScope listens.
        </footer>
      </div>
    </section>
  );
}
