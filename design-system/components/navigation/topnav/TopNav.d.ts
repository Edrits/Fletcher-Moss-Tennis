export interface TopNavProps {
  logo?: string;
  title: string;
  subtitle?: string;
  links: {label:string;href:string}[];
  /** Marks the current-page link. */
  active?: string;
}
