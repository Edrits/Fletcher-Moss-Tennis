export interface BadgeProps {
  children: React.ReactNode;
  tone?: 'neutral' | 'active' | 'sub' | 'success' | 'weather';
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}
