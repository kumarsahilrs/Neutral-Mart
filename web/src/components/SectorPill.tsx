'use client';

interface SectorPillProps {
  sector: { id: string; name: string; listing_count?: number };
  active: boolean;
  onClick: () => void;
}

export default function SectorPill({ sector, active, onClick }: SectorPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'border rounded-full px-4 py-1.5 text-sm font-medium cursor-pointer transition-colors whitespace-nowrap',
        active
          ? 'bg-indigo-600 text-white border-indigo-600'
          : 'bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50',
      ].join(' ')}
    >
      {sector.name}
      {sector.listing_count !== undefined && (
        <span className={active ? 'ml-1 opacity-80' : 'ml-1 text-indigo-400'}>
          ({sector.listing_count})
        </span>
      )}
    </button>
  );
}
