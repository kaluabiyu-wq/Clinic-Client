/** One row of GET /patients?q= (PatientSearchResultDto). */
export interface PatientSearchResult {
  id: string;
  fullName: string;
  phone: string;
  /** ISO date, "yyyy-MM-dd". May be null for older records. */
  dateOfBirth: string | null;
}
