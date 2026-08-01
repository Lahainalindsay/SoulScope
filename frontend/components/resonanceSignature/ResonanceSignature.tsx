import { memo, useMemo } from "react";
import { generateSignature } from "../../../packages/resonance-renderer/src";
import {
  normalizeSignatureInput,
  serializeSignatureSvg,
  validateResonanceSignatureInput,
  type ResonanceSignatureInputV1,
} from "../../lib/resonanceSignature";
import styles from "./ResonanceSignature.module.css";

export type ResonanceSignatureProps = {
  input?: ResonanceSignatureInputV1;
  resultObject?: unknown;
  size?: number;
  showGuides?: boolean;
  showBaselineGhost?: boolean;
  showBloom?: boolean;
  showNodes?: boolean;
  isolateConstellation?: "all" | "COG" | "REG" | "CAP" | "EXP";
  showConfidenceOverlay?: boolean;
  showMissingnessOverlay?: boolean;
  grayscale?: boolean;
  motion?: "none" | "reveal";
  className?: string;
};

function ResonanceSignatureComponent({
  input,
  resultObject,
  size = 640,
  showGuides = true,
  showBaselineGhost = false,
  showBloom = true,
  showNodes = true,
  isolateConstellation = "all",
  showConfidenceOverlay = false,
  showMissingnessOverlay = false,
  grayscale = false,
  motion = "none",
  className = "",
}: ResonanceSignatureProps) {
  const output = useMemo(() => {
    if (resultObject) {
      const signature = generateSignature(resultObject);
      return {
        seed: signature.signatureId,
        scalarChecksum: signature.field.checksum,
        svg: signature.svg,
      };
    }
    if (!input) throw new Error("ResonanceSignature requires either resultObject or input.");
    const validated = validateResonanceSignatureInput(input);
    const normalized = normalizeSignatureInput(validated);
    return serializeSignatureSvg(normalized, {
      showGuides,
      showBaselineGhost,
      showBloom,
      showNodes,
      isolateConstellation,
      showConfidenceOverlay,
      showMissingnessOverlay,
      grayscale,
    });
  }, [grayscale, input, isolateConstellation, resultObject, showBaselineGhost, showBloom, showConfidenceOverlay, showGuides, showMissingnessOverlay, showNodes]);

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
