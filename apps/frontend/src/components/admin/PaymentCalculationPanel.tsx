import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check } from 'lucide-react';
import { PaymentCalculation } from '../../types/verifiedData';

interface PaymentCalculationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  calculation: PaymentCalculation | null;
}

export default function PaymentCalculationPanel({ isOpen, onClose, calculation }: PaymentCalculationPanelProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Payment Calculation Details</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!calculation ? (
          <div className="text-center py-8 text-white/40">
            No calculation data available
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-white/10 rounded-lg p-6">
              <div className="text-sm text-white/60 mb-2">Net Cash Received</div>
              <div className="text-4xl font-bold text-emerald-400">
                ${calculation.net_cash_received.toLocaleString()}
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                <div>
                  <div className="font-medium">Gross Payments</div>
                  <div className="text-sm text-white/40">Stripe payments captured</div>
                </div>
                <div className="text-emerald-400 font-bold">
                  ${calculation.gross_payments.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                <div>
                  <div className="font-medium">Refunds</div>
                  <div className="text-sm text-white/40">Stripe refunds processed</div>
                </div>
                <div className="text-red-400 font-bold">
                  -${calculation.refunds.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                <div>
                  <div className="font-medium">Stripe Fees</div>
                  <div className="text-sm text-white/40">Processing fees</div>
                </div>
                <div className="text-red-400 font-bold">
                  -${calculation.fees.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Formula */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-sm text-white/60 mb-2">Calculation Formula</div>
              <div className="font-mono text-sm text-white/80">
                ${calculation.gross_payments.toLocaleString()} - ${calculation.refunds.toLocaleString()} - ${calculation.fees.toLocaleString()} = ${calculation.net_cash_received.toLocaleString()}
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Date Range</span>
                <span className="text-white">
                  {new Date(calculation.date_range.start).toLocaleDateString()} - {new Date(calculation.date_range.end).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Currency</span>
                <span className="text-white">{calculation.query_params.currency || 'USD'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Status Filter</span>
                <span className="text-white">{calculation.query_params.status || 'All'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Idempotency Key</span>
                <div className="flex items-center gap-2">
                  <span className="text-white/80 font-mono text-xs">{calculation.idempotency_key.slice(0, 8)}...</span>
                  <button
                    onClick={() => copyToClipboard(calculation.idempotency_key)}
                    className="text-white/40 hover:text-white"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Stripe Link */}
            <div className="flex items-center justify-center pt-4">
              <a
                href="https://dashboard.stripe.com/payments"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                View in Stripe Dashboard
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
