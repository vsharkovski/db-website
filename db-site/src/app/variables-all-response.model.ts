import { Response } from './response.model';
import { Variable } from './variable.model';

export interface VariablesAllResponse extends Response {
  genders: Variable[];
  occupations: Variable[];
  citizenships: Variable[];
}
