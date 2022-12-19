import { Person } from './person.model';
import { Response } from './response.model';
import { SortState } from './sort-state.model';

export interface SearchResponse extends Response {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  pageNumber: number;
  maxSliceSize: number;
  persons: Person[];
  sort: SortState;
}
