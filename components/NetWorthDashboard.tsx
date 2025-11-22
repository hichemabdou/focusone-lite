"use client";

import { useState } from "react";

type Asset = {
    id: string;
    name: string;
    value: number;
    type: "cash" | "investment" | "property" | "other";
};

type Liability = {
    id: string;
    name: string;
    value: number;
    type: "loan" | "credit-card" | "mortgage" | "other";
};

export default function NetWorthDashboard() {
    const [assets, setAssets] = useState<Asset[]>([
        { id: "1", name: "Savings Account", value: 15000, type: "cash" },
        { id: "2", name: "Investment Portfolio", value: 45000, type: "investment" },
        { id: "3", name: "Real Estate", value: 250000, type: "property" },
    ]);

    const [liabilities, setLiabilities] = useState<Liability[]>([
        { id: "1", name: "Mortgage", value: 180000, type: "mortgage" },
        { id: "2", name: "Car Loan", value: 15000, type: "loan" },
    ]);

    const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
    const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.value, 0);
    const netWorth = totalAssets - totalLiabilities;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="net-worth-dashboard">
            {/* Net Worth Summary */}
            <div className="financial-summary">
                <div className="financial-card financial-card--primary">
                    <div className="financial-card__label">Net Worth</div>
                    <div className="financial-card__value">{formatCurrency(netWorth)}</div>
                    <div className="financial-card__change">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 15l-6-6-6 6" />
                        </svg>
                        <span>+8.2% from last month</span>
                    </div>
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
                        <div className="allocation-bar">
                            <div
                                className="allocation-bar__fill allocation-bar__fill--cash"
                                style={{ width: `${(assets.find(a => a.type === "cash")?.value || 0) / totalAssets * 100}%` }}
                            ></div>
                        </div>
                        <div className="allocation-legend">
                            <span className="allocation-legend__item">
                                <span className="allocation-dot allocation-dot--cash"></span>
                                Cash {((assets.find(a => a.type === "cash")?.value || 0) / totalAssets * 100).toFixed(1)}%
                            </span>
                            <span className="allocation-legend__item">
                                <span className="allocation-dot allocation-dot--investment"></span>
                                Investments {((assets.filter(a => a.type === "investment").reduce((sum, a) => sum + a.value, 0)) / totalAssets * 100).toFixed(1)}%
                            </span>
                            <span className="allocation-legend__item">
                                <span className="allocation-dot allocation-dot--property"></span>
                                Property {((assets.filter(a => a.type === "property").reduce((sum, a) => sum + a.value, 0)) / totalAssets * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assets & Liabilities Tables */}
            <div className="financial-tables">
                {/* Assets */}
                <div className="financial-table-container">
                    <div className="financial-table-header">
                        <h3>Assets</h3>
                        <button className="btn btn--sm btn--ghost">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            Add Asset
                        </button>
                    </div>
                    <div className="financial-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th className="text-right">Value</th>
                                    <th className="text-right">% of Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.map((asset) => (
                                    <tr key={asset.id}>
                                        <td>{asset.name}</td>
                                        <td>
                                            <span className={`asset-type asset-type--${asset.type}`}>
                                                {asset.type.replace("-", " ")}
                                            </span>
                                        </td>
                                        <td className="text-right font-mono">{formatCurrency(asset.value)}</td>
                                        <td className="text-right text-muted">
                                            {((asset.value / totalAssets) * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={2}><strong>Total Assets</strong></td>
                                    <td className="text-right font-mono"><strong>{formatCurrency(totalAssets)}</strong></td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Liabilities */}
                <div className="financial-table-container">
                    <div className="financial-table-header">
                        <h3>Liabilities</h3>
                        <button className="btn btn--sm btn--ghost">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            Add Liability
                        </button>
                    </div>
                    <div className="financial-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th className="text-right">Value</th>
                                    <th className="text-right">% of Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {liabilities.map((liability) => (
                                    <tr key={liability.id}>
                                        <td>{liability.name}</td>
                                        <td>
                                            <span className={`liability-type liability-type--${liability.type}`}>
                                                {liability.type.replace("-", " ")}
                                            </span>
                                        </td>
                                        <td className="text-right font-mono">{formatCurrency(liability.value)}</td>
                                        <td className="text-right text-muted">
                                            {((liability.value / totalLiabilities) * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={2}><strong>Total Liabilities</strong></td>
                                    <td className="text-right font-mono"><strong>{formatCurrency(totalLiabilities)}</strong></td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
