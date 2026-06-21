interface BadgeProps {
  status: string;
  className?: string;
}

const STATUS_MAP: Record<string, [string, string]> = {
  'Shipped':          ['#2f8049', '#e9f4ec'],
  'In transit':       ['#1f6b8a', '#e6f2f6'],
  'Awaiting ship':    ['#a9690a', '#fdeccc'],
  'In escrow':        ['#1f6b8a', '#e6f2f6'],
  'Delivered':        ['#1f6b3a', '#e9f4ec'],
  'Completed':        ['#1f6b3a', '#e9f4ec'],
  'Disputed':         ['#b6442a', '#fbe7e2'],
  'Cancelled':        ['#7a6f5d', '#efe9dd'],
  'Pending':          ['#a9690a', '#fdeccc'],
  'Pending payment':  ['#a9690a', '#fdeccc'],
  'Paid':             ['#2f8049', '#e9f4ec'],
  'Confirmed':        ['#2f8049', '#e9f4ec'],
  'Live':             ['#2f8049', '#e9f4ec'],
  'Paused':           ['#a9690a', '#fdeccc'],
  'Sold':             ['#7a6f5d', '#efe9dd'],
  'Expired':          ['#7a6f5d', '#efe9dd'],
  'Flagged':          ['#b6442a', '#fbe7e2'],
  'Verified':         ['#1f6b3a', '#e9f4ec'],
  'Rejected':         ['#b6442a', '#fbe7e2'],
  'Open':             ['#b6442a', '#fbe7e2'],
  'Under review':     ['#1f6b8a', '#e6f2f6'],
  'Resolved':         ['#1f6b3a', '#e9f4ec'],
  'Escalated':        ['#a9690a', '#fdeccc'],
  'Active':           ['#1f6b3a', '#e9f4ec'],
  'Suspended':        ['#b6442a', '#fbe7e2'],
  'Processed':        ['#1f6b3a', '#e9f4ec'],
  'Released':         ['#1f6b3a', '#e9f4ec'],
  'Holding':          ['#1f6b8a', '#e6f2f6'],
  'pending':          ['#a9690a', '#fdeccc'],
  'quoted':           ['#1f6b8a', '#e6f2f6'],
  'accepted':         ['#1f6b3a', '#e9f4ec'],
  'rejected':         ['#b6442a', '#fbe7e2'],
  'ordered':          ['#1f6b3a', '#e9f4ec'],
};

export default function Badge({ status, className = '' }: BadgeProps) {
  const [color, bg] = STATUS_MAP[status] ?? ['#7a6f5d', '#efe9dd'];
  return (
    <span
      className={`nm-pill ${className}`}
      style={{ color, background: bg, fontWeight: 700 }}
    >
      {status}
    </span>
  );
}

export function statusColor(status: string): [string, string] {
  return STATUS_MAP[status] ?? ['#7a6f5d', '#efe9dd'];
}
