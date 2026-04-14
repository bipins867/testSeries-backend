import { StoredQuiz } from "../types/quiz";
import { config } from "../config";

/**
 * Simple in-memory store for quizzes.
 * Automatically evicts expired quizzes on access.
 */
class QuizStore {
  private store = new Map<string, StoredQuiz>();

  /** Persist a quiz into the store. */
  set(quizId: string, quiz: StoredQuiz): void {
    this.store.set(quizId, quiz);
    console.log(
      `[Store] Saved quiz ${quizId} (${quiz.questions.length} questions)`
    );
  }

  /** Retrieve a quiz by ID. Returns undefined if missing or expired. */
  get(quizId: string): StoredQuiz | undefined {
    const quiz = this.store.get(quizId);
    if (!quiz) return undefined;

    // TTL check
    const age = Date.now() - quiz.createdAt.getTime();
    if (age > config.quiz.quizTtlMs) {
      this.store.delete(quizId);
      console.log(`[Store] Quiz ${quizId} expired — evicted`);
      return undefined;
    }

    return quiz;
  }

  /** Delete a quiz by ID. */
  delete(quizId: string): boolean {
    return this.store.delete(quizId);
  }

  /** Current number of stored quizzes. */
  get size(): number {
    return this.store.size;
  }

  /** Purge all expired quizzes. Call periodically in production. */
  purgeExpired(): number {
    const now = Date.now();
    let purged = 0;

    for (const [id, quiz] of this.store) {
      if (now - quiz.createdAt.getTime() > config.quiz.quizTtlMs) {
        this.store.delete(id);
        purged++;
      }
    }

    if (purged > 0) {
      console.log(`[Store] Purged ${purged} expired quiz(es)`);
    }
    return purged;
  }
}

/** Singleton quiz store instance. */
export const quizStore = new QuizStore();
