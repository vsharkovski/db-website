import { Person } from './person.model';
import { Response } from './response.model';

export interface SearchResponse extends Response {
  persons: Person[];
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
