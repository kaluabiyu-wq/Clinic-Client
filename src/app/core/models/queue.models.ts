/** One doctor's column on the public board. Never contains patient names. */
export interface QueueBoardCard {
  doctorId: number;
  doctorName: string;
  /** Queue number being served now, e.g. "G005"; null when nobody is in consultation */
  nowServing: string | null;
  /** Next queue numbers in arrival order (API decides how many, e.g. 3) */
  next: string[];
  waitingCount: number;
  /** Rounded to the nearest 5 minutes by the API (WaitEstimator) */
  estimatedWaitMinutes: number | null;
}

/** Response of GET /queue/board (public) */
export interface QueueBoard {
  generatedAt: string;
  cards: QueueBoardCard[];
}
