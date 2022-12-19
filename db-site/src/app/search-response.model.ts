import { Person } from './person.model';
import { Response } from './response.model';
import { SortState } from './sort-state.model';

export interface SearchResponse extends Response {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  persons: Person[];
  sort: SortState;
}
