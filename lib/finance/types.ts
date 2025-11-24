// Finance Module TypeScript Types

export type AccountType =
    | 'checking'
    | 'savings'
    | 'credit_card'
    | 'investment'
    | 'brokerage'
    | 'loan'
    | 'mortgage'
    | 'other';

export type TransactionType =
    | 'income'
    | 'expense'
    | 'transfer'
    | 'investment'
    | 'other';

export type InsightType =
    | 'positive'
    | 'warning'
    | 'info'
    | 'recommendation';

export type ProcessingStatus =
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed';

export type FileType =
    | 'pdf'
    | 'csv'
    | 'xlsx'
    | 'ofx'
    | 'qfx';

export interface FinancialAccount {
    id: string;
    user_id: string;
    account_name: string;
    account_type: AccountType;
    institution?: string;
    account_number_last4?: string;
    currency: string;
    is_asset: boolean;
    current_balance: number;
    created_at: string;
    updated_at: string;
}

export interface Transaction {
    id: string;
    user_id: string;
    account_id?: string;
    transaction_date: string; // ISO date string
    description: string;
    amount: number;
    category?: string;
    transaction_type?: TransactionType;
    is_recurring: boolean;
    source_file?: string;
    hash?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface NetWorthSnapshot {
    id: string;
    user_id: string;
    snapshot_date: string; // ISO date string
    total_assets: number;
    total_liabilities: number;
    net_worth: number;
    asset_breakdown?: Record<string, number>;
    liability_breakdown?: Record<string, number>;
    created_at: string;
}

export interface FinancialInsight {
    id: string;
    user_id: string;
    insight_type: InsightType;
    title: string;
    message: string;
    action_label?: string;
    action_data?: Record<string, any>;
    is_dismissed: boolean;
    priority: number;
    created_at: string;
    expires_at?: string;
}

export interface UploadedFile {
    id: string;
    user_id: string;
    file_name: string;
    file_type: FileType;
    file_size?: number;
    upload_date: string;
    processing_status: ProcessingStatus;
    transactions_extracted: number;
    accounts_detected: number;
    duplicates_skipped: number;
    error_message?: string;
    storage_path?: string;
    created_at: string;
}

// Parsed data structures (before saving to DB)
export interface ParsedTransaction {
    date: Date;
    description: string;
    amount: number;
    category?: string;
    type?: TransactionType;
    balance?: number; // Running balance if available
}

export interface ParsedAccount {
    name: string;
    type: AccountType;
    institution?: string;
    accountNumberLast4?: string;
    balance?: number;
}

export interface ParsedFinancialData {
    accounts: ParsedAccount[];
    transactions: ParsedTransaction[];
    metadata: {
        fileType: FileType;
        fileName: string;
        parseDate: Date;
        institution?: string;
        accountNumber?: string;
    };
}

// Financial metrics
export interface FinancialMetrics {
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySavings: number;
    savingsRate: number; // Percentage
    netWorth: number;
    totalAssets: number;
    totalLiabilities: number;
    debtToIncomeRatio: number;
    emergencyFundMonths: number;
}

export interface CategoryBreakdown {
    category: string;
    amount: number;
    percentage: number;
    transactionCount: number;
}

export interface TrendData {
    direction: 'up' | 'down' | 'stable';
    amount: number;
    percentage: number;
    period: number; // days
}

// Chart data types
export interface NetWorthChartData {
    date: string;
    netWorth: number;
    assets: number;
    liabilities: number;
}

export interface CategoryChartData {
    category: string;
    amount: number;
    color: string;
}

// Time period for charts
export type TimePeriod = '1M' | '3M' | '6M' | '1Y' | 'ALL';

// File upload response
export interface UploadResponse {
    success: boolean;
    fileId: string;
    accountsDetected: number;
    transactionsExtracted: number;
    duplicatesSkipped: number;
    errors?: string[];
}

// Transaction categorization
export const TRANSACTION_CATEGORIES = {
    INCOME: {
        Salary: 'Salary',
        Freelance: 'Freelance',
        InvestmentIncome: 'Investment Income',
        OtherIncome: 'Other Income',
    },
    HOUSING: {
        Rent: 'Rent',
        Mortgage: 'Mortgage',
        Utilities: 'Utilities',
        Maintenance: 'Home Maintenance',
        Insurance: 'Home Insurance',
    },
    FOOD: {
        Groceries: 'Groceries',
        Dining: 'Dining Out',
        Coffee: 'Coffee & Snacks',
    },
    TRANSPORTATION: {
        Gas: 'Gas',
        PublicTransit: 'Public Transit',
        CarPayment: 'Car Payment',
        CarInsurance: 'Car Insurance',
        Maintenance: 'Car Maintenance',
    },
    HEALTHCARE: {
        Medical: 'Medical',
        Dental: 'Dental',
        Pharmacy: 'Pharmacy',
        Insurance: 'Health Insurance',
    },
    ENTERTAINMENT: {
        Streaming: 'Streaming Services',
        Events: 'Events & Activities',
        Hobbies: 'Hobbies',
    },
    SHOPPING: {
        Clothing: 'Clothing',
        Electronics: 'Electronics',
        General: 'General Shopping',
    },
    DEBT: {
        CreditCard: 'Credit Card Payment',
        LoanPayment: 'Loan Payment',
    },
    SAVINGS: {
        Transfer: 'Transfer to Savings',
        Investment: 'Investment Contribution',
    },
    OTHER: {
        Uncategorized: 'Uncategorized',
    },
} as const;

// Flatten categories for easier use
export const FLAT_CATEGORIES = Object.values(TRANSACTION_CATEGORIES)
    .flatMap(group => Object.values(group));

// Category keywords for auto-categorization
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
    // Income
    'Salary': ['salary', 'payroll', 'wages', 'paycheck', 'direct deposit', 'employer'],
    'Freelance': ['freelance', 'contract', 'consulting', 'gig', 'upwork', 'fiverr'],
    'Investment Income': ['dividend', 'interest', 'capital gain', 'investment income'],

    // Housing
    'Rent': ['rent', 'lease', 'landlord'],
    'Mortgage': ['mortgage', 'home loan'],
    'Utilities': ['electric', 'gas', 'water', 'sewer', 'utility', 'power', 'energy'],
    'Home Maintenance': ['repair', 'maintenance', 'plumber', 'electrician', 'hvac'],
    'Home Insurance': ['home insurance', 'homeowners insurance'],

    // Food
    'Groceries': ['grocery', 'supermarket', 'whole foods', 'trader joe', 'safeway', 'kroger', 'walmart', 'target', 'costco'],
    'Dining Out': ['restaurant', 'cafe', 'diner', 'pizza', 'burger', 'sushi', 'chinese', 'mexican', 'italian', 'thai', 'doordash', 'uber eats', 'grubhub', 'postmates'],
    'Coffee & Snacks': ['starbucks', 'coffee', 'dunkin', 'cafe'],

    // Transportation
    'Gas': ['gas', 'fuel', 'shell', 'chevron', 'exxon', 'mobil', 'bp', 'arco'],
    'Public Transit': ['metro', 'subway', 'bus', 'train', 'transit', 'uber', 'lyft', 'taxi'],
    'Car Payment': ['car payment', 'auto loan', 'vehicle loan'],
    'Car Insurance': ['auto insurance', 'car insurance', 'vehicle insurance'],
    'Car Maintenance': ['auto repair', 'car wash', 'oil change', 'tire', 'mechanic'],

    // Healthcare
    'Medical': ['doctor', 'hospital', 'clinic', 'medical', 'physician'],
    'Dental': ['dentist', 'dental', 'orthodontist'],
    'Pharmacy': ['pharmacy', 'cvs', 'walgreens', 'rite aid', 'prescription'],
    'Health Insurance': ['health insurance', 'medical insurance'],

    // Entertainment
    'Streaming Services': ['netflix', 'hulu', 'disney', 'spotify', 'apple music', 'youtube premium', 'amazon prime'],
    'Events & Activities': ['movie', 'theater', 'concert', 'sports', 'tickets', 'event'],
    'Hobbies': ['hobby', 'craft', 'game', 'book'],

    // Shopping
    'Clothing': ['clothing', 'apparel', 'fashion', 'shoes', 'nike', 'adidas', 'zara', 'h&m'],
    'Electronics': ['electronics', 'apple', 'best buy', 'amazon', 'computer', 'phone'],
    'General Shopping': ['amazon', 'ebay', 'shopping', 'store'],

    // Debt
    'Credit Card Payment': ['credit card payment', 'cc payment'],
    'Loan Payment': ['loan payment', 'student loan', 'personal loan'],

    // Savings
    'Transfer to Savings': ['transfer', 'savings'],
    'Investment Contribution': ['investment', '401k', 'ira', 'roth', 'vanguard', 'fidelity', 'schwab'],
};
