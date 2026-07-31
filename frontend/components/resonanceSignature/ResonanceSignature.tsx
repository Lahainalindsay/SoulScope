import { memo, useMemo } from "react";
import {
  normalizeSignatureInput,
  serializeSignatureSvg,
  validateResonanceSignatureInput,
  type ResonanceSignatureInputV1,
} from "../../lib/resonanceSignature";
import styles from "./ResonanceSignature.module.css";

export type ResonanceSignatureProps = {
  input: ResonanceSignatureInputV1;
  size?: number;
  showGuides?: boolean;
  showBaselineGhost?: boolean;
  motion?: "none" | "reveal";
  className?: string;
};

function ResonanceSignatureComponent({
  input,
  size = 640,
  showGuides = true,
  showBaselineGhost = false,
  motion = "none",
  className = "",
}: ResonanceSignatureProps) {
  const output = useMemo(() => {
    const validated = validateResonanceSignatureInput(input);
    const normalized = normalizeSignatureInput(validated);
    return serializeSignatureSvg(normalized, { showGuides, showBaselineGhost });
  }, [input, showBaselineGhost, showGuides]);

  return (
    <div
      className={`${styles.shell} ${motion === "reveal" ? styles.reveal : ""} ${className}`.trim()}
      style={{ width: size, maxWidth: "100%" }}
      data-signature-seed={output.seed}
      data-scalar-checksum={output.scalarChecksum}
    >
      <div
        className={styles.svg}
        aria-label="SoulScope Resonance Signature"
        dangerouslySetInnerHTML={{ __html: output.svg }}
      />
    </div>
  );
}

export default memo(ResonanceSignatureComponent);
