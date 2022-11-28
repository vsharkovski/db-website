export interface WikiApiPage {
  missing?: boolean;
  thumbnail?: {
    source?: string;
  };
  title?: string;
  extract?: string;
  wikipediaUrl?: string;
}
