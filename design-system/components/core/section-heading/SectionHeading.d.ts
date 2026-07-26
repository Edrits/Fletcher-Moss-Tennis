export interface SectionHeadingProps {
  /** Small uppercase label above the title, e.g. "How it works". Optional. */
  kicker?: string;
  title: string;
  align?: 'left' | 'center';
  /** Use on dark/photo backgrounds. */
  inverse?: boolean;
  style?: React.CSSProperties;
}
