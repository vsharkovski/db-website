export interface WikiApiPage {
  missing?: boolean;
  title?: string;
  pageprops?: {
    wikibase_item?: string;
  };
  thumbnail?: {
    source?: string;
  };
  terms?: {
    description?: string;
  };
  extract?: string;
  fullurl?: string;
  wikidataCode?: number;
}
