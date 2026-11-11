/** A free slot returned by GET /doctors/{id}/slots?date=yyyy-MM-dd */
export interface Slot {
  /** 24h local clinic time, "HH:mm" */
  time: string;
}
