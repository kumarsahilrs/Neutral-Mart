interface BadgeProps {
  status: string;
  className?: string;
}

// [textColor, bgColor]
const GREEN: [string, string]  = ['#1f6b3a', '#e9f4ec'];
const GREEN2: [string, string] = ['#2f8049', '#e9f4ec'];
const GOLD: [string, string]   = ['#a9690a', '#fdeccc'];
const INFO: [string, string]   = ['#1f6b8a', '#e6f2f6'];
const RED: [string, string]    = ['#b6442a', '#fbe7e2'];
const NEUTRAL: [string, string]= ['#7a6f5d', '#efe9dd'];

const STATUS_MAP: Record<string, [string, string]> = {
  // Human labels
  'Shipped': GREEN2, 'In transit': INFO, 'Awaiting ship': GOLD, 'In escrow': INFO,
  'Delivered': GREEN, 'Completed': GREEN, 'Disputed': RED, 'Cancelled': NEUTRAL,
  'Pending': GOLD, 'Pending payment': GOLD, 'Paid': GREEN2, 'Confirmed': GREEN2,
  'Live': GREEN2, 'Paused': GOLD, 'Sold': NEUTRAL, 'Expired': NEUTRAL, 'Flagged': RED,
  'Verified': GREEN, 'Rejected': RED, 'Open': RED, 'Under review': INFO, 'Resolved': GREEN,
  'Escalated': GOLD, 'Active': GREEN, 'Suspended': RED, 'Banned': RED, 'Processed': GREEN,
  'Released': GREEN, 'Holding': INFO, 'On hold': GOLD, 'Scheduled': INFO, 'Failed': RED,

  // snake_case / lowercase keys
  pending: GOLD, in_review: INFO, approved: GREEN, rejected: RED, resolved: GREEN,
  open: RED, escalated: GOLD, active: GREEN, inactive: NEUTRAL, suspended: RED,
  banned: RED, completed: GREEN, released: GREEN, holding: INFO, paid: GREEN2,
  shipped: GREEN2, delivered: GREEN, live: GREEN2, disputed: RED, featured: INFO,
  paused: GOLD, delisted: NEUTRAL, draft: NEUTRAL, refunded: GOLD, frozen: INFO,
  in_escrow: INFO, pending_payment: GOLD, scheduled: INFO, on_hold: GOLD, failed: RED,
  processed: GREEN, kyc_pending: GOLD, kyc_verified: GREEN, kyc_rejected: RED,
  quoted: INFO, accepted: GREEN, ordered: GREEN,
};

const LABELS: Record<string, string> = {
  pending: 'Pending', in_review: 'Under review', approved: 'Approved', rejected: 'Rejected',
  resolved: 'Resolved', open: 'Open', escalated: 'Escalated', active: 'Active',
  inactive: 'Inactive', suspended: 'Suspended', banned: 'Banned', completed: 'Completed',
  released: 'Released', holding: 'In escrow', paid: 'Paid', shipped: 'Shipped',
  delivered: 'Delivered', live: 'Live', disputed: 'Disputed', featured: 'Featured',
  paused: 'Paused', delisted: 'Delisted', draft: 'Draft', refunded: 'Refunded',
  frozen: 'Frozen', in_escrow: 'In escrow', pending_payment: 'Pending payment',
  scheduled: 'Scheduled', on_hold: 'On hold', failed: 'Failed', processed: 'Processed',
  kyc_pending: 'KYC pending', kyc_verified: 'KYC verified', kyc_rejected: 'KYC rejected',
};

export default function Badge({ status, className = '' }: BadgeProps) {
  const [color, bg] = STATUS_MAP[status] ?? NEUTRAL;
  const label =
    LABELS[status] ??
    (status ? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—');
  return (
    <span
      className={`nm-pill ${className}`}
      style={{ color, background: bg, fontWeight: 700 }}
    >
      {label}
    </span>
  );
}

export function statusColor(status: string): [string, string] {
  return STATUS_MAP[status] ?? NEUTRAL;
}
