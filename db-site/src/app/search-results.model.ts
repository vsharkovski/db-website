import { Person } from './person.model';
import { Response } from './response.model';
import { SortState } from './sort-state.model';

export interface SearchResults {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  persons: Person[];
  sort: SortState;
}
