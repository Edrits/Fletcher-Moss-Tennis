export interface CardProps {
  children: React.ReactNode;
  /** Lifts + deepens shadow on hover. Default true. */
  hoverable?: boolean;
  padding?: number;
  style?: React.CSSProperties;
}
export interface InfoCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}
export interface NoticeCardProps {
  children: React.ReactNode;
  /** Shows italic, centred placeholder styling for "no updates" state. */
  empty?: boolean;
}
