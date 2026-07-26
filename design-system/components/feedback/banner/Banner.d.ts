export interface BannerProps {
  tone?: 'alert' | 'notice';
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClose?: () => void;
}
