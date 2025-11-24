"use client";

import { useState, useEffect } from "react";
import NetWorthChart from "./finance/NetWorthChart";
import { TimePeriod, NetWorthChartData } from "@/lib/finance/types";

type Account = {
    id: string;
    account_name: string;
    current_balance: number;
    account_type: string;
    is_asset: boolean;
    institution?: string;
};

export default function NetWorthDashboard() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [chartData, setChartData] = useState<NetWorthChartData[]>([]);
    const [period, setPeriod] = useState<TimePeriod>('6M');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch accounts
            const accountsResponse = await fetch('/api/finance/accounts');
            if (!accountsResponse.ok) throw new Error('Failed to fetch accounts');
            const accountsData = await accountsResponse.json();
            setAccounts(accountsData.accounts || []);

            // Fetch net worth history
            const netWorthResponse = await fetch(`/api/finance/net-worth?period=${period}`);
            if (!netWorthResponse.ok) throw new Error('Failed to fetch net worth data');
            const netWorthData = await netWorthResponse.json();

            // Transform snapshots to chart data
            const transformedData: NetWorthChartData[] = (netWorthData.history || []).map((snapshot: any) => ({
                date: snapshot.snapshot_date,
                netWorth: snapshot.net_worth,
                assets: snapshot.total_assets,
                liabilities: snapshot.total_liabilities,
            }));

            setChartData(transformedData);
        } catch (err) {
            console.error('Error fetching financial data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const assets = accounts.filter(a => a.is_asset);
    const liabilities = accounts.filter(a => !a.is_asset);

    const totalAssets = assets.reduce((sum, asset) => sum + asset.current_balance, 0);
    const totalLiabilities = liabilities.reduce((sum, liability) => sum + Math.abs(liability.current_balance), 0);
    const netWorth = totalAssets - totalLiabilities;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getAccountTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'checking': 'Checking',
            'savings': 'Savings',
            'investment': 'Investment',
            'credit_card': 'Credit Card',
            'loan': 'Loan',
            'mortgage': 'Mortgage',
            'other': 'Other',
        };
        return labels[type] || type;
    };

    // Calculate asset allocation
    const assetAllocation = assets.reduce((acc, asset) => {
        const type = asset.account_type;
        acc[type] = (acc[type] || 0) + asset.current_balance;
        return acc;
    }, {} as Record<string, number>);

    if (isLoading) {
        return (
            <div className="net-worth-dashboard">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading your financial data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="net-worth-dashboard">
                <div className="error-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <h3>Failed to load data</h3>
                    <p>{error}</p>
                    <button className="btn btn--primary" onClick={fetchData}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="net-worth-dashboard">
            {/* Net Worth Chart */}
            <NetWorthChart
                data={chartData}
                period={period}
                onPeriodChange={setPeriod}
            />

            {/* Net Worth Summary */}
            <div className="financial-summary">
                <div className="financial-card financial-card--primary">
                    <div className="financial-card__label">Net Worth</div>
                    <div className="financial-card__value">{formatCurrency(netWorth)}</div>
                    {chartData.length > 1 && (
                        <div className="financial-card__change">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 15l-6-6-6 6" />
                            </svg>
                            <span>Historical data available</span>
                        </div>
                    )}
                </div>

                <div className="financial-card">
                    <div className="financial-card__label">Total Assets</div>
                    <div className="financial-card__value financial-card__value--success">
                        {formatCurrency(totalAssets)}
                    </div>
                </div>

                <div className="financial-card">
                    <div className="financial-card__label">Total Liabilities</div>
                    <div className="financial-card__value financial-card__value--danger">
                        {formatCurrency(totalLiabilities)}
                    </div>
                </div>

                <div className="financial-card">
                    <div className="financial-card__label">Asset Allocation</div>
                    <div className="allocation-bars">
                        {Object.keys(assetAllocation).length > 0 ? (
                            <>
                                <div className="allocation-bar">
                                    {Object.entries(assetAllocation).map(([type, value]) => (
                                        <div
                                            key={type}
                                            className={`allocation-bar__fill allocation-bar__fill--${type}`}
                                            style={{ width: `${(value / totalAssets) * 100}%` }}
                                            title={`${getAccountTypeLabel(type)}: ${formatCurrency(value)}`}
                                        />
                                    ))}
                                </div>
                                <div className="allocation-legend">
                                    {Object.entries(assetAllocation).map(([type, value]) => (
                                        <span key={type} className="allocation-legend__item">
                                            <span className={`allocation-dot allocation-dot--${type}`}></span>
                                            {getAccountTypeLabel(type)} {((value / totalAssets) * 100).toFixed(1)}%
                                        </span>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="empty-message">No assets to display</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Assets & Liabilities Tables */}
            <div className="financial-tables">
                <div className="financial-table">
                    <div className="financial-table__header">
                        <h3>Assets</h3>
                        <button className="btn btn--sm btn--ghost">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            Add Asset
                        </button>
                    </div>
                    <div className="financial-table__body">
                        {assets.length > 0 ? (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Account</th>
                                        <th>Type</th>
                                        <th>Institution</th>
                                        <th className="text-right">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assets.map((asset) => (
                                        <tr key={asset.id}>
                                            <td>{asset.account_name}</td>
                                            <td>{getAccountTypeLabel(asset.account_type)}</td>
                                            <td>{asset.institution || '—'}</td>
                                            <td className="text-right">{formatCurrency(asset.current_balance)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state">
                                <p>No assets added yet</p>
                                <button className="btn btn--sm btn--primary">Add Your First Asset</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="financial-table">
                    <div className="financial-table__header">
                        <h3>Liabilities</h3>
                        <button className="btn btn--sm btn--ghost">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            Add Liability
                        </button>
                    </div>
                    <div className="financial-table__body">
                        {liabilities.length > 0 ? (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Account</th>
                                        <th>Type</th>
                                        <th>Institution</th>
                                        <th className="text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {liabilities.map((liability) => (
                                        <tr key={liability.id}>
                                            <td>{liability.account_name}</td>
                                            <td>{getAccountTypeLabel(liability.account_type)}</td>
                                            <td>{liability.institution || '—'}</td>
                                            <td className="text-right">{formatCurrency(Math.abs(liability.current_balance))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state">
                                <p>No liabilities tracked</p>
                                <button className="btn btn--sm btn--primary">Add a Liability</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
