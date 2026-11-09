import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { calculateEMI, calculateSIP, calculateCompound, compoundSeries, inr } from '../lib/finance';
type EmiCalculatorProps = {
  principal?: number;
  rate?: number;
  months?: number;
};

type SipCalculatorProps = {
  monthly?: number;
  rate?: number;
  years?: number;
};

type CompoundCalculatorProps = {
  principal?: number;
  rate?: number;
  years?: number;
  frequency?: 1 | 2 | 4 | 12;
};
export function EmiCalculator({
  principal = 500000,
  rate = 8.5,
  months = 240,
}: EmiCalculatorProps) {
  const [p, setP] = useState(principal);
  const [r, setR] = useState(rate);
  const [n, setN] = useState(months);

  useEffect(() => {
    setP(principal);
    setR(rate);
    setN(months);
  }, [principal, rate, months]);
  const result = useMemo(() => {
    try {
      return calculateEMI(p, r, n);
    } catch {
      return null;
    }
  }, [p, r, n]);
  return (
    <div className="calc-card">
      <div className="calc-head">
        <div>
          <span className="eyebrow">LOAN PLANNER</span>
          <h3>Home loan EMI calculator</h3>
        </div>
        <span className="pill">Live calculation</span>
      </div>
      <div className="calc-grid">
        <label>
          Loan amount <b>{inr(p)}</b>
          <input
            aria-label="Loan amount"
            type="range"
            min="10000"
            max="100000000"
            step="10000"
            value={p}
            onChange={(e) => setP(+e.target.value)}
          />
          <input
            type="number"
            min="10000"
            max="100000000"
            value={p}
            onChange={(e) => setP(+e.target.value)}
          />
        </label>
        <label>
          Interest rate <b>{r.toFixed(1)}%</b>
          <input
            aria-label="Interest rate"
            type="range"
            min="1"
            max="36"
            step="0.1"
            value={r}
            onChange={(e) => setR(+e.target.value)}
          />
        </label>
        <label>
          Tenure <b>{n} months</b>
          <input
            aria-label="Tenure"
            type="range"
            min="1"
            max="360"
            value={n}
            onChange={(e) => setN(+e.target.value)}
          />
          <input
            type="number"
            min="1"
            max="360"
            value={n}
            onChange={(e) => setN(+e.target.value)}
          />
        </label>
      </div>
      {result ? (
        <>
          <div className="result-grid">
            <div className="result-primary">
              <small>MONTHLY EMI</small>
              <strong>{inr(result.emi)}</strong>
            </div>
            <div>
              <small>Total interest</small>
              <b>{inr(result.totalInterest)}</b>
            </div>
            <div>
              <small>Total payment</small>
              <b>{inr(result.totalPayment)}</b>
            </div>
          </div>
          <div className="chart-row">
            <div className="donut">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Principal', value: p },
                      { name: 'Interest', value: Math.max(0, result.totalInterest) },
                    ]}
                    dataKey="value"
                    innerRadius={48}
                    outerRadius={68}
                  >
                    <Cell fill="#2563eb" />
                    <Cell fill="#14b8a6" />
                  </Pie>
                  <Tooltip formatter={(v) => inr(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="legend">
              <span>
                <i className="blue-dot" /> Principal {inr(p)}
              </span>
              <span>
                <i className="mint-dot" /> Interest {inr(result.totalInterest)}
              </span>
            </div>
          </div>
          <details>
            <summary>Amortisation schedule ({n} months)</summary>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Opening</th>
                    <th>EMI</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Closing</th>
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.map((x) => (
                    <tr key={x.month}>
                      <td>{x.month}</td>
                      <td>{inr(x.opening)}</td>
                      <td>{inr(x.emi)}</td>
                      <td>{inr(x.principal)}</td>
                      <td>{inr(x.interest)}</td>
                      <td>{inr(x.closing)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              className="text-button"
              onClick={() =>
                downloadCsv(
                  'emi-amortisation.csv',
                  ['Month', 'Opening', 'EMI', 'Principal', 'Interest', 'Closing'],
                  result.schedule.map((x) => [
                    x.month,
                    x.opening,
                    x.emi,
                    x.principal,
                    x.interest,
                    x.closing,
                  ]),
                )
              }
            >
              Export schedule CSV
            </button>
          </details>
        </>
      ) : (
        <p className="error-text">Enter values within the allowed ranges.</p>
      )}
    </div>
  );
}
export function SipCalculator({
  monthly: initialMonthly = 5000,
  rate: initialRate = 12,
  years: initialYears = 10,
}: SipCalculatorProps) {
  const [monthly, setMonthly] = useState(initialMonthly);
  const [rate, setRate] = useState(initialRate);
  const [years, setYears] = useState(initialYears);

  useEffect(() => {
    setMonthly(initialMonthly);
    setRate(initialRate);
    setYears(initialYears);
  }, [initialMonthly, initialRate, initialYears]);
const result = useMemo(() => {
  try {
    return calculateSIP(monthly, rate, years);
  } catch {
    return null;
  }
}, [monthly, rate, years]);
  return (
    <div className="calc-card">
      <div className="calc-head">
        <div>
          <span className="eyebrow">WEALTH PLANNER</span>
          <h3>Monthly SIP calculator</h3>
        </div>
      </div>
      <div className="calc-grid">
        <label>
          Monthly investment <b>{inr(monthly)}</b>
          <input
            aria-label="Monthly investment"
            type="range"
            min="500"
            max="1000000"
            step="500"
            value={monthly}
            onChange={(e) => setMonthly(+e.target.value)}
          />
        </label>
        <label>
          Expected annual return <b>{rate}%</b>
          <input
            aria-label="Expected annual return"
            type="range"
            min="1"
            max="30"
            step="0.5"
            value={rate}
            onChange={(e) => setRate(+e.target.value)}
          />
        </label>
        <label>
          Duration <b>{years} years</b>
          <input
            aria-label="SIP duration"
            type="range"
            min="1"
            max="40"
            value={years}
            onChange={(e) => setYears(+e.target.value)}
          />
        </label>
      </div>
      {result && (
        <>
          <div className="result-grid">
            <div className="result-primary">
              <small>ESTIMATED FUTURE VALUE</small>
              <strong>{inr(result.futureValue)}</strong>
            </div>
            <div>
              <small>Total invested</small>
              <b>{inr(result.invested)}</b>
            </div>
            <div>
              <small>Wealth gained</small>
              <b>{inr(result.wealthGained)}</b>
            </div>
          </div>
          <div className="chart-row">
            <div className="donut">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Invested', value: result.invested },
                      { name: 'Gain', value: result.wealthGained },
                    ]}
                    dataKey="value"
                    innerRadius={48}
                    outerRadius={68}
                  >
                    <Cell fill="#2563eb" />
                    <Cell fill="#14b8a6" />
                  </Pie>
                  <Tooltip formatter={(v) => inr(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="legend">
              <span>
                <i className="blue-dot" /> Invested {inr(result.invested)}
              </span>
              <span>
                <i className="mint-dot" /> Wealth gained {inr(result.wealthGained)}
              </span>
            </div>
          </div>
          <details>
            <summary>Year-by-year growth</summary>
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Invested</th>
                  <th>Future value</th>
                  <th>Gain</th>
                </tr>
              </thead>
              <tbody>
                {result.yearly.map((x) => (
                  <tr key={x.year}>
                    <td>{x.year}</td>
                    <td>{inr(x.invested)}</td>
                    <td>{inr(x.futureValue)}</td>
                    <td>{inr(x.wealthGained)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="text-button"
              onClick={() =>
                downloadCsv(
                  'sip-growth.csv',
                  ['Year', 'Invested', 'Future value', 'Gain'],
                  result.yearly.map((x) => [x.year, x.invested, x.futureValue, x.wealthGained]),
                )
              }
            >
              Export growth CSV
            </button>
          </details>
        </>
      )}
    </div>
  );
}
export function CompoundCalculator({
  principal = 100000,
  rate = 8,
  years: initialYears = 10,
  frequency = 4,
}: CompoundCalculatorProps) {
  const [p, setP] = useState(principal);
  const [r, setR] = useState(rate);
  const [years, setYears] = useState(initialYears);
  const [freq, setFreq] = useState<1 | 2 | 4 | 12>(frequency);

  useEffect(() => {
    setP(principal);
    setR(rate);
    setYears(initialYears);
    setFreq(frequency);
  }, [principal, rate, initialYears, frequency]);
const result = useMemo(() => {
  try {
    return {
      value: calculateCompound(p, r, years, freq),
      series: compoundSeries(p, r, years, freq),
    };
  } catch {
    return null;
  }
}, [p, r, years, freq]);
  return (
    <div className="calc-card">
      <div className="calc-head">
        <div>
          <span className="eyebrow">GROWTH EXPLORER</span>
          <h3>Compound interest calculator</h3>
        </div>
      </div>
      <div className="calc-grid">
        <label>
          Starting amount <b>{inr(p)}</b>
          <input type="number" value={p} onChange={(e) => setP(+e.target.value)} />
        </label>
        <label>
          Annual rate <b>{r}%</b>
          <input
            type="range"
            min="0"
            max="36"
            step="0.5"
            value={r}
            onChange={(e) => setR(+e.target.value)}
          />
        </label>
        <label>
          Years <b>{years}</b>
          <input
            type="range"
            min="1"
            max="50"
            value={years}
            onChange={(e) => setYears(+e.target.value)}
          />
        </label>
        <label>
          Frequency
          <select value={freq} onChange={(e) => setFreq(+e.target.value as 1 | 2 | 4 | 12)}>
            <option value="1">Annually</option>
            <option value="2">Half-yearly</option>
            <option value="4">Quarterly</option>
            <option value="12">Monthly</option>
          </select>
        </label>
      </div>
      {result ? (
        <>
          <div className="result-primary">
            <small>MATURITY VALUE</small>
            <strong>{inr(result.value)}</strong>
          </div>
          <div style={{ height: 220, marginTop: 18 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={result.series}>
                <defs>
                  <linearGradient id="growth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v) => inr(Number(v))} />
                <Area type="monotone" dataKey="value" stroke="#2563eb" fill="url(#growth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <p className="error-text">Enter a positive starting amount and duration.</p>
      )}
    </div>
  );
}
function downloadCsv(name: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
