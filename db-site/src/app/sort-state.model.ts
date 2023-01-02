export interface SortState {
  variable: 'notabilityIndex' | 'birth' | 'death';
  direction: 'ascending' | 'descending';
}

export const SortStateVariableArray = ['notabilityIndex', 'birth', 'death'];
export const SortStateDirectionArray = ['ascending', 'descending'];
