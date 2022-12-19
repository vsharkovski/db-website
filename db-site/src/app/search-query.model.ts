import { SortState } from './sort-state.model';

export interface SearchQuery {
  page: number;
  term: string;
  sort: SortState | null;
}
