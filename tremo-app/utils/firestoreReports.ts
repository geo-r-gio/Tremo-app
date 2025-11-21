import { db } from "@/firebaseConfig";
import {
  collection,
  addDoc,
  Timestamp,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import type { TremorSession } from "./pdfReport";

/**
 * Firestore session shape
 */
export type StoredSession = {
  timestamp: Timestamp;
  mode: string;
  duration: number;
  before: number;
  after: number;
  reduction: number;
  avgFrequency: number;
};

/**
 * Save tremor session for the authenticated user
 */
export async function saveSessionToFirestore(params: {
  userId: string;
  mode: string;
  duration: number;
  before: number;
  after: number;
  reduction?: number;      // optional override
  avgFrequency: number;
}) {
  const {
    userId,
    mode,
    duration,
    before,
    after,
    avgFrequency,
    reduction,
  } = params;

  if (!userId) throw new Error("Missing userId");

  // If reduction is not provided → compute it
  const computedReduction =
    reduction !== undefined
      ? reduction
      : before > 0
      ? ((before - after) / before) * 100
      : 0;

  const sessionsRef = collection(db, "users", userId, "sessions");

  const data: StoredSession = {
    timestamp: Timestamp.now(),
    mode,
    duration,
    before,
    after,
    reduction: computedReduction,
    avgFrequency,
  };

  await addDoc(sessionsRef, data);
}

/**
 * Load all sessions for the user, sorted desc
 * Returns TremorSession[] (used in UI/PDF)
 */
export async function getUserSessions(
  userId: string
): Promise<TremorSession[]> {
  if (!userId) return [];

  const sessionsRef = collection(db, "users", userId, "sessions");
  const q = query(sessionsRef, orderBy("timestamp", "desc"));

  const snapshot = await getDocs(q);

  const sessions: TremorSession[] = snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as StoredSession;

    const jsDate = data.timestamp.toDate();
    const dateStr = jsDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    return {
      id: docSnap.id,
      date: dateStr,
      mode: data.mode,
      duration: String(data.duration),
      before: data.before,
      after: data.after,
      reduction: data.reduction,
      avgFrequency: data.avgFrequency,
    };
  });

  return sessions;
}