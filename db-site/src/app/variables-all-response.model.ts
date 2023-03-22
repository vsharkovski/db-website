import { Variable } from './variable.model';

export interface VariablesAllResponse {
  genders: Variable[];
  occupations: Variable[];
  citizenships: Variable[];
}
