import { FormEvent, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import styles from "./BetaFeedbackForm.module.css";

type BetaFeedbackFormProps = {
  page: string;
  scanId?: string | null;
  selectedSummaryStyle?: string | null;
};

type RatingKey = "graphics" | "wording" | "clarity";

const ratingFields: Array<{ key: RatingKey; label: string }> = [
  { key: "graphics", label: "How does the interface feel?" },
  { key: "wording", label: "How is the wording?" },
  { key: "clarity", label: "Is the insight easy to understand?" },
];

export default function BetaFeedbackForm({ page, scanId = null, selectedSummaryStyle = null }: BetaFeedbackFormProps) {
  const [ratings, setRatings] = useState<Record<RatingKey, number | null>>({
    graphics: null,
    wording: null,
    clarity: null,
  });
  const [confusing, setConfusing] = useState("");
  const [changeOrAdd, setChangeOrAdd] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("saving");
    setMessage("Saving your feedback...");

    try {
      const { data: userData } = await supabase.auth.getUser();
      const response = await supabase.from("user_feedback").insert({
        user_id: userData?.user?.id ?? null,
        page,
        scan_id: scanId,
        selected_summary_style: selectedSummaryStyle,
        graphics_rating: ratings.graphics,
        wording_rating: ratings.wording,
        clarity_rating: ratings.clarity,
        confusing_feedback: confusing.trim() || null,
        change_or_add_feedback: changeOrAdd.trim() || null,
      });

      if (response.error) {
        throw response.error;
      }

      setStatus("success");
      setMessage("Thank you. This helps us make SoulScope clearer and more useful.");
      setConfusing("");
      setChangeOrAdd("");
      setRatings({ graphics: null, wording: null, clarity: null });
    } catch (error) {
      console.error("Failed to save SoulScope beta feedback", error);
      setStatus("error");
      setMessage("Feedback could not be saved yet. Please try again later.");
    }
  };

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Feedback</p>
        <h2 className={styles.title}>Help refine SoulScope</h2>
        <p className={styles.copy}>
          Your feedback helps us make each insight clearer, calmer, and more useful.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.ratingGrid}>
          {ratingFields.map((field) => (
            <div key={field.key} className={styles.ratingGroup}>
              <span className={styles.label}>{field.label}</span>
              <div className={styles.ratingButtons} role="radiogroup" aria-label={field.label}>
                {[1, 2, 3, 4, 5].map((value) => {
                  const isActive = ratings[field.key] === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      className={`${styles.ratingButton} ${isActive ? styles.ratingButtonActive : ""}`}
                      onClick={() => setRatings((current) => ({ ...current, [field.key]: value }))}
                      aria-pressed={isActive}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <label className={styles.textGroup}>
          <span className={styles.label}>What felt confusing?</span>
          <textarea
            className={styles.textarea}
            value={confusing}
            onChange={(event) => setConfusing(event.target.value)}
            placeholder="Anything unclear, awkward, too vague, or hard to understand?"
          />
        </label>

        <label className={styles.textGroup}>
          <span className={styles.label}>What would you change or add?</span>
          <textarea
            className={styles.textarea}
            value={changeOrAdd}
            onChange={(event) => setChangeOrAdd(event.target.value)}
            placeholder="Tell us what would make SoulScope feel clearer, more personal, or more useful."
          />
        </label>

        <div className={styles.actions}>
          <button type="submit" className={styles.submit} disabled={status === "saving"}>
            {status === "saving" ? "Saving..." : "Send Feedback"}
          </button>
          {message ? (
            <p className={`${styles.status} ${status === "success" ? styles.success : status === "error" ? styles.error : ""}`}>
              {message}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
