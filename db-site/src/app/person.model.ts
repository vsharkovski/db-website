export interface Person {
  id: number;
  wikidataCode: number;
  birth: number | null;
  death: number | null;
  name: string | null;
  nameProcessed: string | null;
  genderId: number | null;
  level1MainOccId: number | null;
  level3MainOccId: number | null;
  citizenship1BId: number | null;
  citizenship2BId: number | null;
  birthLongitude: number | null;
  birthLatitude: number | null;
  deathLongitude: number | null;
  deathLatitude: number | null;
  notabilityIndex: number | null;
}
