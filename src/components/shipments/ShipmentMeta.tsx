'use client';
import Link from 'next/link';
import { Copy } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';
import { StellarLink } from '@/components/StellarLink';
import { FormattedDate } from '@/components/FormattedDate';
import type { Shipment } from '@/types';

export function ShipmentMeta({ shipment }: { shipment: Shipment }) {
  const rows = [
    { label: 'Buyer', value: shipment.buyerAddress, type: 'account' as const },
    { label: 'Supplier', value: shipment.supplierAddress, type: 'account' as const, isSupplier: true },
    { label: 'Logistics', value: shipment.logisticsAddress, type: 'account' as const },
    { label: 'Arbiter', value: shipment.arbiterAddress, type: 'account' as const },
    { label: 'USDC contract', value: shipment.tokenAddress, type: 'account' as const },
    { label: 'Created', value: null, date: shipment.createdAt },
    { label: 'Tx hash', value: shipment.txHash, type: 'tx' as const },
  ];

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Details</h2>
      <div className="space-y-2.5">
        {rows.map(({ label, value, date, isSupplier }) => (
          <div key={label} className="flex items-center justify-between text-xs">
            <span className="text-gray-400 w-32 flex-shrink-0">{label}</span>
            {value ? (
              <div className="flex items-center gap-1.5 min-w-0">
                {isSupplier && (
                  <Link
                    href={`/dashboard/counterparties?address=${encodeURIComponent(value)}`}
                    className="text-[11px] font-medium text-brand-600 hover:underline me-1 flex-shrink-0"
                  >
                    Metrics
                  </Link>
                )}
                <StellarLink value={value} type={label === 'Tx hash' ? 'tx' : 'account'} className="font-mono text-blue-600 hover:text-blue-800 truncate" />
                <button
                  onClick={() => copyToClipboard(value)}
                  aria-label={`Copy ${label.toLowerCase()} to clipboard`}
                  className="text-gray-300 hover:text-gray-600 transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <FormattedDate date={date} mode="date" className="text-gray-700" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
