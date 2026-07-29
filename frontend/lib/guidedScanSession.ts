import { GUIDED_SCAN_QUESTIONS } from "./scanProtocol";

export type GuidedScanAnswer = {
  questionId: string;
  title: string;
  prompt: string;
  rationale: string;
  blob: Blob;
  durationMs: number;
  captureKind: "sustained_vowel" | "guided_speech";
};

export type GuidedScanSubject = {
  subjectId: string | null;
  subjectLabel: string;
  identityConfidence: number;
  historyEligible: boolean;
  status: "confirmed" | "unconfirmed" | "guest" | "unidentified";
};

type GuidedScanAnswerRecord = Omit<GuidedScanAnswer, "blob"> & {
  blobKey: string;
  captureKind?: "sustained_vowel" | "guided_speech";
};

type GuidedScanSessionState = {
  startedAt: string | null;
  subject: GuidedScanSubject | null;
  answers: GuidedScanAnswerRecord[];
};

const STORAGE_KEY = "soulscope.guidedScanSession";
const DB_NAME = "soulscope-guided-scan";
const DB_VERSION = 1;
const AUDIO_STORE = "audio-blobs";
const STORAGE_OPERATION_TIMEOUT_MS = 2500;

let state: GuidedScanSessionState = {
  startedAt: null,
  subject: null,
  answers: [],
};

let dbPromise: Promise<IDBDatabase> | null = null;
const sessionBlobs = new Map<string, Blob>();

function withStorageTimeout<T>(operation: Promise<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(
      () => reject(new Error(`${label} timed out after ${STORAGE_OPERATION_TIMEOUT_MS}ms.`)),
      STORAGE_OPERATION_TIMEOUT_MS,
    );
    operation.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function shouldDebugScan() {
  return typeof window !== "undefined" && window.localStorage.getItem("soulscope.debugScan") !== "0";
}

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function getBlobKey(questionId: string, startedAt = state.startedAt) {
  return `answer:${startedAt ?? "unknown"}:${questionId}`;
}

function openDatabase() {
  if (!canUseBrowserStorage()) {
    return Promise.reject(new Error("Browser storage is unavailable."));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(AUDIO_STORE)) {
          database.createObjectStore(AUDIO_STORE);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Failed to open guided scan database."));
    });
  }

  return dbPromise;
}

async function writeBlob(blobKey: string, blob: Blob) {
  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(AUDIO_STORE, "readwrite");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Failed to write guided scan audio."));
    transaction.objectStore(AUDIO_STORE).put(blob, blobKey);
  });
}

async function readBlob(blobKey: string) {
  const database = await openDatabase();

  return await new Promise<Blob | null>((resolve, reject) => {
    const transaction = database.transaction(AUDIO_STORE, "readonly");
    const request = transaction.objectStore(AUDIO_STORE).get(blobKey);
    request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to read guided scan audio."));
  });
}

async function deleteBlob(blobKey: string) {
  if (!canUseBrowserStorage()) return;

  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(AUDIO_STORE, "readwrite");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Failed to delete guided scan audio."));
    transaction.objectStore(AUDIO_STORE).delete(blobKey);
  });
}

async function clearAllBlobs() {
  if (!canUseBrowserStorage()) return;

  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(AUDIO_STORE, "readwrite");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Failed to clear guided scan audio."));
    transaction.objectStore(AUDIO_STORE).clear();
  });
}

function writeState() {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function hydrateState() {
  if (typeof window === "undefined") return;
  if (state.startedAt) return;

  const stored = window.sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return;

  try {
    const parsed = JSON.parse(stored) as Partial<GuidedScanSessionState>;
    const parsedSubject =
      parsed.subject &&
      typeof parsed.subject === "object" &&
      typeof parsed.subject.subjectLabel === "string" &&
      typeof parsed.subject.identityConfidence === "number" &&
      typeof parsed.subject.historyEligible === "boolean" &&
      typeof parsed.subject.status === "string"
        ? parsed.subject
        : null;
    state = {
      startedAt: parsed.startedAt ?? null,
      subject: parsedSubject
        ? {
            subjectId: typeof parsedSubject.subjectId === "string" ? parsedSubject.subjectId : null,
            subjectLabel: parsedSubject.subjectLabel,
            identityConfidence: parsedSubject.identityConfidence,
            historyEligible: parsedSubject.historyEligible,
            status: parsedSubject.status,
          }
        : null,
      answers: Array.isArray(parsed.answers)
        ? parsed.answers.filter(
            (answer): answer is GuidedScanAnswerRecord =>
              Boolean(
                answer &&
                  typeof answer.questionId === "string" &&
                  typeof answer.title === "string" &&
                  typeof answer.prompt === "string" &&
                  typeof answer.rationale === "string" &&
                  typeof answer.durationMs === "number" &&
                  typeof answer.blobKey === "string"
              )
          )
        : [],
    };
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function resetGuidedScanSession() {
  sessionBlobs.clear();
  state = {
    startedAt: new Date().toISOString(),
    subject: null,
    answers: [],
  };

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    void clearAllBlobs().catch((error) => {
      console.error("Failed to clear guided scan blobs", error);
    });
  }
}

export function ensureGuidedScanSession() {
  hydrateState();
  if (!state.startedAt) {
    resetGuidedScanSession();
  }
}

export async function getGuidedScanAnswers() {
  hydrateState();

  const answers = await Promise.all(
    state.answers.map(async (answer) => {
      try {
        const blob = sessionBlobs.get(answer.blobKey)
          ?? await withStorageTimeout(readBlob(answer.blobKey), `Reading ${answer.questionId}`);
        if (!blob) return null;
        if (shouldDebugScan()) {
          console.info("[SoulScope scan] hydrated answer blob", {
            questionId: answer.questionId,
            blobKey: answer.blobKey,
            blobSize: blob.size,
            blobType: blob.type,
            durationMs: answer.durationMs,
          });
        }

        return {
          questionId: answer.questionId,
          title: answer.title,
          prompt: answer.prompt,
          rationale: answer.rationale,
          durationMs: answer.durationMs,
          captureKind: answer.captureKind ?? "guided_speech",
          blob,
        } satisfies GuidedScanAnswer;
      } catch (error) {
        console.error(`Failed to hydrate guided scan answer for ${answer.questionId}`, error);
        return null;
      }
    })
  );

  return answers.filter((answer): answer is GuidedScanAnswer => answer !== null);
}

export function getGuidedScanProgress() {
  hydrateState();
  return state.answers.length;
}

export function getGuidedScanStartedAt() {
  hydrateState();
  return state.startedAt;
}

export function getGuidedScanSubject() {
  hydrateState();
  return state.subject;
}

export function setGuidedScanSubject(subject: GuidedScanSubject) {
  hydrateState();
  state.subject = subject;
  writeState();
}

export async function saveGuidedScanAnswer(stepIndex: number, blob: Blob, durationMs: number) {
  const question = GUIDED_SCAN_QUESTIONS[stepIndex];
  if (!question) {
    throw new Error("Unknown guided scan step.");
  }

  const blobKey = getBlobKey(question.id);
  // Keep the active recording synchronously available before attempting
  // IndexedDB. Safari can leave an IDB transaction pending indefinitely; a
  // durable-storage stall must never trap the guided workflow on "Saving…".
  sessionBlobs.set(blobKey, blob);
  if (shouldDebugScan()) {
    console.info("[SoulScope scan] saved answer blob", {
      questionId: question.id,
      blobKey,
      blobSize: blob.size,
      blobType: blob.type,
      durationMs,
    });
  }

  state.answers = [
    ...state.answers.filter((answer) => answer.questionId !== question.id),
    {
      questionId: question.id,
      title: question.title,
      prompt: question.prompt,
      rationale: question.rationale,
      durationMs,
      captureKind: question.captureKind,
      blobKey,
    },
  ].sort(
    (a, b) =>
      GUIDED_SCAN_QUESTIONS.findIndex((questionItem) => questionItem.id === a.questionId) -
      GUIDED_SCAN_QUESTIONS.findIndex((questionItem) => questionItem.id === b.questionId)
  );

  writeState();

  try {
    await withStorageTimeout(writeBlob(blobKey, blob), `Saving ${question.id}`);
  } catch (error) {
    // The in-memory copy remains authoritative for this uninterrupted guided
    // session. A reload may require the user to repeat this prompt, but the
    // current workflow can safely advance.
    console.warn(`Guided scan audio is available for this session but was not written to browser storage.`, error);
  }
}

export async function clearGuidedScanAnswer(stepIndex: number) {
  const question = GUIDED_SCAN_QUESTIONS[stepIndex];
  if (!question) return;

  state.answers = state.answers.filter((answer) => answer.questionId !== question.id);
  writeState();
  sessionBlobs.delete(getBlobKey(question.id));

  try {
    await deleteBlob(getBlobKey(question.id));
  } catch (error) {
    console.error(`Failed to clear guided scan answer for ${question.id}`, error);
  }
}
