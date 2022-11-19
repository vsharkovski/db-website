import { WikiApiPage } from './wiki-api-page.model';

export interface WikiApiResponse {
  query: {
    pages: WikiApiPage[];
  };
}
