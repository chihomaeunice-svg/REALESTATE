import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { formatTZS } from "../lib/format";

export function MortgageCalculator({ price }: { price: number }) {
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [rate, setRate] = useState(18);
  const [years, setYears] = useState(15);

  const monthlyPayment = useMemo(() => {
    const downPayment = price * (downPaymentPct / 100);
    const principal = price - downPayment;
    const monthlyRate = rate / 100 / 12;
    const numPayments = years * 12;
    if (principal <= 0 || numPayments <= 0) return 0;
    if (monthlyRate === 0) return principal / numPayments;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  }, [price, downPaymentPct, rate, years]);

  return (
    <div className="card mt-4 p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
        <Calculator className="h-4 w-4 text-brand-600" /> Mortgage calculator
      </h3>
      <div className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <label className="text-ink-500">Down payment</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              className="input !w-20 !py-1.5 text-right"
              value={downPaymentPct}
              onChange={(e) => setDownPaymentPct(Number(e.target.value))}
            />
            <span className="text-ink-400">%</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <label className="text-ink-500">Interest rate</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              step="0.1"
              className="input !w-20 !py-1.5 text-right"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
            <span className="text-ink-400">%/yr</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <label className="text-ink-500">Loan term</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={40}
              className="input !w-20 !py-1.5 text-right"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
            />
            <span className="text-ink-400">years</span>
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-xl bg-brand-50 p-3 text-center">
        <p className="text-xs font-medium text-brand-700">Estimated monthly payment</p>
        <p className="mt-0.5 text-xl font-semibold text-brand-700">{formatTZS(Math.round(monthlyPayment))}</p>
      </div>
      <p className="mt-3 text-xs text-ink-400">
        Estimate only — actual loan terms depend on the lender. Not financial advice.
      </p>
    </div>
  );
}
