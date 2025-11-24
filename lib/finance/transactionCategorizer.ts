// Transaction Categorization Logic

import { CATEGORY_KEYWORDS, TransactionType } from './types';

/**
 * Categorizes a transaction based on its description and amount
 * @param description Transaction description
 * @param amount Transaction amount (positive for income, negative for expense)
 * @returns Category name
 */
export function categorizeTransaction(description: string, amount: number): string {
    const normalizedDesc = description.toLowerCase().trim();

    // Check each category's keywords
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (normalizedDesc.includes(keyword.toLowerCase())) {
                return category;
            }
        }
    }

    // Fallback categorization based on amount
    if (amount > 0) {
        return 'Other Income';
    }

    return 'Uncategorized';
}

/**
 * Determines the transaction type based on description and amount
 * @param description Transaction description
 * @param amount Transaction amount
 * @returns Transaction type
 */
export function determineTransactionType(description: string, amount: number): TransactionType {
    const normalizedDesc = description.toLowerCase().trim();

    // Check for transfers
    if (normalizedDesc.includes('transfer') ||
        normalizedDesc.includes('xfer') ||
        normalizedDesc.includes('payment to') ||
        normalizedDesc.includes('payment from')) {
        return 'transfer';
    }

    // Check for investments
    if (normalizedDesc.includes('investment') ||
        normalizedDesc.includes('401k') ||
        normalizedDesc.includes('ira') ||
        normalizedDesc.includes('brokerage') ||
        normalizedDesc.includes('dividend') ||
        normalizedDesc.includes('capital gain')) {
        return 'investment';
    }

    // Income vs Expense based on amount
    if (amount > 0) {
        return 'income';
    } else if (amount < 0) {
        return 'expense';
    }

    return 'other';
}

/**
 * Detects if a transaction is likely recurring
 * @param description Transaction description
 * @param amount Transaction amount
 * @returns True if likely recurring
 */
export function isLikelyRecurring(description: string, amount: number): boolean {
    const normalizedDesc = description.toLowerCase().trim();

    const recurringKeywords = [
        'subscription',
        'monthly',
        'annual',
        'recurring',
        'autopay',
        'auto pay',
        'netflix',
        'spotify',
        'hulu',
        'disney',
        'gym',
        'insurance',
        'rent',
        'mortgage',
        'utility',
        'phone bill',
        'internet',
    ];

    return recurringKeywords.some(keyword => normalizedDesc.includes(keyword));
}

/**
 * Batch categorize multiple transactions
 * @param transactions Array of transactions with description and amount
 * @returns Array of transactions with added category and type
 */
export function batchCategorize<T extends { description: string; amount: number }>(
    transactions: T[]
): Array<T & { category: string; transaction_type: TransactionType; is_recurring: boolean }> {
    return transactions.map(transaction => ({
        ...transaction,
        category: categorizeTransaction(transaction.description, transaction.amount),
        transaction_type: determineTransactionType(transaction.description, transaction.amount),
        is_recurring: isLikelyRecurring(transaction.description, transaction.amount),
    }));
}

/**
 * Get category color for visualization
 * @param category Category name
 * @returns Hex color code
 */
export function getCategoryColor(category: string): string {
    const colorMap: Record<string, string> = {
        // Income
        'Salary': '#10b981',
        'Freelance': '#34d399',
        'Investment Income': '#6ee7b7',
        'Other Income': '#a7f3d0',

        // Housing
        'Rent': '#ef4444',
        'Mortgage': '#dc2626',
        'Utilities': '#f87171',
        'Home Maintenance': '#fca5a5',
        'Home Insurance': '#fecaca',

        // Food
        'Groceries': '#f59e0b',
        'Dining Out': '#fbbf24',
        'Coffee & Snacks': '#fcd34d',

        // Transportation
        'Gas': '#8b5cf6',
        'Public Transit': '#a78bfa',
        'Car Payment': '#c4b5fd',
        'Car Insurance': '#ddd6fe',
        'Car Maintenance': '#ede9fe',

        // Healthcare
        'Medical': '#ec4899',
        'Dental': '#f472b6',
        'Pharmacy': '#f9a8d4',
        'Health Insurance': '#fbcfe8',

        // Entertainment
        'Streaming Services': '#06b6d4',
        'Events & Activities': '#22d3ee',
        'Hobbies': '#67e8f9',

        // Shopping
        'Clothing': '#14b8a6',
        'Electronics': '#2dd4bf',
        'General Shopping': '#5eead4',

        // Debt
        'Credit Card Payment': '#f97316',
        'Loan Payment': '#fb923c',

        // Savings
        'Transfer to Savings': '#84cc16',
        'Investment Contribution': '#a3e635',

        // Default
        'Uncategorized': '#6b7280',
    };

    return colorMap[category] || '#6b7280';
}
