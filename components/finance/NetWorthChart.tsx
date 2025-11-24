"use client";

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TimePeriod, NetWorthChartData } from '@/lib/finance/types';

interface NetWorthChartProps {
    data: NetWorthChartData[];
    period: TimePeriod;
    onPeriodChange: (period: TimePeriod) => void;
}

export default function NetWorthChart({ data, period, onPeriodChange }: NetWorthChartProps) {
    const [chartData, setChartData] = useState<NetWorthChartData[]>([]);

    useEffect(() => {
        setChartData(data);
    }, [data]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Calculate change
    const latestValue = chartData.length > 0 ? chartData[chartData.length - 1].netWorth : 0;
    const earliestValue = chartData.length > 0 ? chartData[0].netWorth : 0;
    const change = latestValue - earliestValue;
    const percentChange = earliestValue !== 0 ? (change / Math.abs(earliestValue)) * 100 : 0;

    const periods: TimePeriod[] = ['1M', '3M', '6M', '1Y', 'ALL'];

    return (
        <div className="net-worth-chart">
            {/* Header with time period buttons */}
            <div className="chart-header">
                <div className="chart-title-section">
                    <h3 className="chart-title">Net Worth Over Time</h3>
                    <div className="chart-stats">
                        <span className="chart-value">{formatCurrency(latestValue)}</span>
                        <span className={`chart-change ${change >= 0 ? 'chart-change--positive' : 'chart-change--negative'}`}>
                            {change >= 0 ? '+' : ''}{formatCurrency(change)} ({percentChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}%)
                        </span>
                    </div>
                </div>

                <div className="chart-period-buttons">
                    {periods.map((p) => (
                        <button
                            key={p}
                            className={`period-button ${period === p ? 'period-button--active' : ''}`}
                            onClick={() => onPeriodChange(p)}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="chart-container">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                stroke="rgba(255, 255, 255, 0.5)"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                tickFormatter={formatCurrency}
                                stroke="rgba(255, 255, 255, 0.5)"
                                style={{ fontSize: '12px' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                }}
                                labelStyle={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}
                                itemStyle={{ color: 'rgba(255, 255, 255, 0.9)' }}
                                formatter={(value: number) => formatCurrency(value)}
                                labelFormatter={formatDate}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: '20px' }}
                                iconType="line"
                            />
                            <Line
                                type="monotone"
                                dataKey="netWorth"
                                stroke="#34C759"
                                strokeWidth={3}
                                dot={{ fill: '#34C759', r: 4 }}
                                activeDot={{ r: 6 }}
                                name="Net Worth"
                            />
                            <Line
                                type="monotone"
                                dataKey="assets"
                                stroke="#007AFF"
                                strokeWidth={2}
                                dot={false}
                                strokeDasharray="5 5"
                                name="Assets"
                            />
                            <Line
                                type="monotone"
                                dataKey="liabilities"
                                stroke="#FF3B30"
                                strokeWidth={2}
                                dot={false}
                                strokeDasharray="5 5"
                                name="Liabilities"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="chart-empty">
                        <p>No historical data available yet. Data will appear as you track your finances over time.</p>
                    </div>
                )}
            </div>

            <style jsx>{`
        .net-worth-chart {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .chart-title-section {
          flex: 1;
          min-width: 200px;
        }

        .chart-title {
          font-size: 18px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 8px;
        }

        .chart-stats {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }

        .chart-value {
          font-size: 28px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
        }

        .chart-change {
          font-size: 14px;
          font-weight: 600;
        }

        .chart-change--positive {
          color: #34C759;
        }

        .chart-change--negative {
          color: #FF3B30;
        }

        .chart-period-buttons {
          display: flex;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 8px;
        }

        .period-button {
          padding: 6px 16px;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .period-button:hover {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.8);
        }

        .period-button--active {
          background: rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.95);
        }

        .chart-container {
          margin-top: 16px;
        }

        .chart-empty {
          height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          padding: 48px;
        }

        @media (max-width: 768px) {
          .chart-header {
            flex-direction: column;
          }

          .chart-period-buttons {
            width: 100%;
            justify-content: space-between;
          }

          .period-button {
            flex: 1;
          }
        }
      `}</style>
        </div>
    );
}
