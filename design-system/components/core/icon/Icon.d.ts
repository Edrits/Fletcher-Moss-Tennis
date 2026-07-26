/**
 * Icon — thin wrapper around the Lucide icon set (flagged CDN substitution;
 * the source site used emoji as icons). Page must load Lucide's UMD bundle:
 * <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
 */
export interface IconProps {
  /** Lucide icon name, e.g. "calendar", "users", "map-pin", "message-circle",
   * "trophy", "cloud-sun", "shuffle", "shield", "x", "plus", "chevron-right", "megaphone" */
  name: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  style?: React.CSSProperties;
}
