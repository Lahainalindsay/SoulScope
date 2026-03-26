import { GUIDED_SCAN_QUESTIONS } from "./scanProtocol";

export type GuidedScanAnswer = {
  questionId: string;
  title: string;
  prompt: string;
  rationale: string;
  blob: Blob;
  durationMs: number;
};

type GuidedScanAnswerRecord = Omit<GuidedScanAnswer, "blob"> & {
  blobKey: string;
};

type GuidedScanSessionState = {
  startedAt: string | null;
  answers: GuidedScanAnswerRecord[];
};

const STORAGE_KEY = "soulscope.guidedScanSession";
const DB_NAME = "soulscope-guided-scan";
const DB_VERSION = 1;
const AUDIO_STORE = "audio-blobs";

let state: GuidedScanSessionState = {
  startedAt: null,
  answers: [],
};

let dbPromise: Promise<IDBDatabase> | null = null;

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function getBlobKey(questionId: string) {
  return `answer:${questionId}`;
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
    state = {
      startedAt: parsed.startedAt ?? null,
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
  state = {
    startedAt: new Date().toISOString(),
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
        const blob = await readBlob(answer.blobKey);
        if (!blob) return null;

        return {
          questionId: answer.questionId,
          title: answer.title,
          prompt: answer.prompt,
          rationale: answer.rationale,
          durationMs: answer.durationMs,
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

export async function saveGuidedScanAnswer(stepIndex: number, blob: Blob, durationMs: number) {
  const question = GUIDED_SCAN_QUESTIONS[stepIndex];
  if (!question) {
    throw new Error("Unknown guided scan step.");
  }

  const blobKey = getBlobKey(question.id);
  await writeBlob(blobKey, blob);

  state.answers = [
    ...state.answers.filter((answer) => answer.questionId !== question.id),
    {
      questionId: question.id,
      title: question.title,
      prompt: question.prompt,
      rationale: question.rationale,
      durationMs,
      blobKey,
    },
  ].sort(
    (a, b) =>
      GUIDED_SCAN_QUESTIONS.findIndex((questionItem) => questionItem.id === a.questionId) -
      GUIDED_SCAN_QUESTIONS.findIndex((questionItem) => questionItem.id === b.questionId)
  );

  writeState();
}

export async function clearGuidedScanAnswer(stepIndex: number) {
  const question = GUIDED_SCAN_QUESTIONS[stepIndex];
  if (!question) return;

  state.answers = state.answers.filter((answer) => answer.questionId !== question.id);
  writeState();

  try {
    await deleteBlob(getBlobKey(question.id));
  } catch (error) {
    console.error(`Failed to clear guided scan answer for ${question.id}`, error);
  }
}
