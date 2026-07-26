export interface ButtonProps {
  children: React.ReactNode;
  /** Visual style. `whatsapp` is the join-CTA variant. */
  variant?: 'primary' | 'secondary' | 'inverse' | 'whatsapp' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  /** Render as a different element, e.g. "a" for a link-styled button. */
  as?: React.ElementType;
  icon?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}
