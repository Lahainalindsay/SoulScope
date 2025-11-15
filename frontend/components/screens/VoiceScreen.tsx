type VoicePrompt = {
  label: string;
  prompt: string;
  duration: string;
  status: "idle" | "recording" | "done";
};

type VoiceScreenProps = {
  prompts: VoicePrompt[];
  onCapture: (index: number) => void;
};

export default function VoiceScreen({ prompts, onCapture }: VoiceScreenProps) {
  return (
    <div className="voice-grid">
      {prompts.map((prompt, index) => (
        <article className="voice-card" key={prompt.label}>
          <header>
            <small>{prompt.label}</small>
            <span>{prompt.duration}</span>
          </header>
          <p>{prompt.prompt}</p>
          <div className="voice-card__footer">
            <span className={`sensor-chip sensor-chip--${prompt.status}`}>
              {prompt.status === "idle"
                ? "Awaiting capture"
                : prompt.status === "recording"
                ? "Recording…"
                : "Recording OK"}
            </span>
            <button
              className="wizard-button wizard-button--ghost"
              onClick={() => onCapture(index)}
              disabled={prompt.status === "recording"}
            >
              {prompt.status === "done" ? "Retake" : "Record clip"}
            </button>
          </div>
        </article>
      ))}
      <p className="voice-note">
        After each clip, SoulScope will save the .wav file and later run{" "}
        <code>extract_voice_features_from_file()</code>.
      </p>
    </div>
  );
}

