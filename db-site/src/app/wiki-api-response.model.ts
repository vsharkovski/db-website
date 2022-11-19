export interface WikiApiResponse {
  query?: {
    pages?: {
      thumbnail?: {
        source?: string;
      };
      missing?: boolean;
    }[];
  };
}
