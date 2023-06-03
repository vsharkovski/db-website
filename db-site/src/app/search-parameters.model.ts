export interface SearchParameters {
  name: string;
  birthMin: number | null;
  birthMax: number | null;
  deathMin: number | null;
  deathMax: number | null;
  citizenshipId: number | null;
  occupationLevel1Id: number | null;
  occupationLevel3Id: number | null;
  genderId: number | null;
  notabilityMin: number | null;
  notabilityMax: number | null;
  wikidataCode: number | null;
}
