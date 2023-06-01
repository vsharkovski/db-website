import { Person } from './person.model';
import { SortState } from './sort-state.model';

export interface SearchResponse {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  pageNumber: number;
  totalPages: number;
  totalResults: number;
  resultsPerPage: number;
  results: Person[];
  sort: SortState;
}
