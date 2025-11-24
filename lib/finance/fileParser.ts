// Financial File Parser (PDF and CSV)

import Papa from 'papaparse';
import {
    ParsedFinancialData,
    ParsedTransaction,
    ParsedAccount,
    FileType,
    AccountType,
} from './types';
import { categorizeTransaction, determineTransactionType, isLikelyRecurring } from './transactionCategorizer';

/**
 * Main entry point for parsing financial files
 */
export async function parseFinancialFile(
    file: File
): Promise<ParsedFinancialData> {
    const fileType = detectFileType(file.name);

    if (fileType === 'pdf') {
        return parsePDFFile(file);
    } else if (fileType === 'csv') {
        return parseCSVFile(file);
    } else {
        throw new Error(`Unsupported file type: ${fileType}`);
    }
}

/**
 * Detect file type from filename
 */
function detectFileType(filename: string): FileType {
    const extension = filename.split('.').pop()?.toLowerCase();

    switch (extension) {
        case 'pdf':
            return 'pdf';
        case 'csv':
            return 'csv';
        case 'xlsx':
        case 'xls':
            return 'xlsx';
        case 'ofx':
            return 'ofx';
        case 'qfx':
            return 'qfx';
        default:
            throw new Error(`Unknown file extension: ${extension}`);
    }
}

/**
 * Parse PDF file
 * Note: This requires pdf-parse which works in Node.js
 * For client-side, we'll need to send to API
 */
async function parsePDFFile(file: File): Promise<ParsedFinancialData> {
    try {
        // Convert File to Buffer for Node.js processing
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Use require for pdf-parse (works better in Next.js API routes)
        const pdfParse = require('pdf-parse');

        // Parse PDF
        const data = await pdfParse(buffer);
        const text = data.text;

        // Detect institution and format
        const institution = detectInstitution(text);
        const format = detectStatementFormat(text, institution);

        // Extract transactions based on format
        const transactions = extractTransactionsFromPDF(text, format);

        // Extract account information
        const account = extractAccountFromPDF(text, institution);

        return {
            accounts: account ? [account] : [],
            transactions,
            metadata: {
                fileType: 'pdf',
                fileName: file.name,
                parseDate: new Date(),
                institution,
            },
        };
    } catch (error) {
        console.error('PDF parsing error:', error);
        throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Parse CSV file
 */
async function parseCSVFile(file: File): Promise<ParsedFinancialData> {
    try {
        // Read file as text for server-side processing
        const text = await file.text();

        return new Promise((resolve, reject) => {
            Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                complete: (results: any) => {
                    try {
                        const data = results.data as any[];

                        // Detect CSV format
                        const format = detectCSVFormat(data[0]);

                        // Map CSV columns to our transaction format
                        const transactions = data.map((row: any) => mapCSVToTransaction(row, format));

                        // Extract account info if available
                        const account = extractAccountFromCSV(data, format);

                        resolve({
                            accounts: account ? [account] : [],
                            transactions: transactions.filter((t: any) => t !== null) as ParsedTransaction[],
                            metadata: {
                                fileType: 'csv',
                                fileName: file.name,
                                parseDate: new Date(),
                            },
                        });
                    } catch (error) {
                        reject(error);
                    }
                },
                error: (error: any) => {
                    reject(error);
                },
            });
        });
    } catch (error) {
        console.error('CSV parsing error:', error);
        throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Detect institution from PDF text
 */
function detectInstitution(text: string): string | undefined {
    const lowerText = text.toLowerCase();

    const institutions = [
        { name: 'Chase', keywords: ['chase', 'jpmorgan'] },
        { name: 'Bank of America', keywords: ['bank of america', 'bofa'] },
        { name: 'Wells Fargo', keywords: ['wells fargo'] },
        { name: 'Citi', keywords: ['citibank', 'citi'] },
        { name: 'Capital One', keywords: ['capital one'] },
        { name: 'American Express', keywords: ['american express', 'amex'] },
        { name: 'Discover', keywords: ['discover'] },
        { name: 'US Bank', keywords: ['u.s. bank', 'us bank'] },
        { name: 'TD Bank', keywords: ['td bank'] },
        { name: 'PNC', keywords: ['pnc bank'] },
    ];

    for (const institution of institutions) {
        if (institution.keywords.some(keyword => lowerText.includes(keyword))) {
            return institution.name;
        }
    }

    return undefined;
}

/**
 * Detect statement format
 */
function detectStatementFormat(text: string, institution?: string): 'bank' | 'credit_card' | 'brokerage' | 'generic' {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('credit card') || lowerText.includes('card account')) {
        return 'credit_card';
    }

    if (lowerText.includes('brokerage') || lowerText.includes('investment') || lowerText.includes('portfolio')) {
        return 'brokerage';
    }

    if (lowerText.includes('checking') || lowerText.includes('savings')) {
        return 'bank';
    }

    return 'generic';
}

/**
 * Extract transactions from PDF text
 */
function extractTransactionsFromPDF(text: string, format: string): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n');

    // Common date patterns
    const datePatterns = [
        /(\d{1,2}\/\d{1,2}\/\d{2,4})/,  // MM/DD/YYYY or M/D/YY
        /(\d{1,2}-\d{1,2}-\d{2,4})/,    // MM-DD-YYYY
        /(\d{4}-\d{1,2}-\d{1,2})/,      // YYYY-MM-DD
    ];

    // Amount pattern (handles negative amounts in parentheses)
    const amountPattern = /\$?\s*(\(?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\)?)/;

    for (const line of lines) {
        // Try to find a date in the line
        let dateMatch: RegExpMatchArray | null = null;
        let datePattern: RegExp | null = null;

        for (const pattern of datePatterns) {
            dateMatch = line.match(pattern);
            if (dateMatch) {
                datePattern = pattern;
                break;
            }
        }

        if (!dateMatch) continue;

        // Extract date
        const dateStr = dateMatch[1];
        const date = parseDate(dateStr);
        if (!date) continue;

        // Extract amount(s)
        const amounts = [...line.matchAll(new RegExp(amountPattern, 'g'))];
        if (amounts.length === 0) continue;

        // Get description (text between date and first amount)
        const dateIndex = line.indexOf(dateStr);
        const firstAmountIndex = line.indexOf(amounts[0][0]);
        let description = line.substring(dateIndex + dateStr.length, firstAmountIndex).trim();

        // Clean up description
        description = description.replace(/\s+/g, ' ').trim();
        if (!description) continue;

        // Parse amount (last amount is usually the transaction amount)
        const amountStr = amounts[amounts.length - 1][1];
        const amount = parseAmount(amountStr);

        // Create transaction
        const transaction: ParsedTransaction = {
            date,
            description,
            amount,
            category: categorizeTransaction(description, amount),
            type: determineTransactionType(description, amount),
        };

        transactions.push(transaction);
    }

    return transactions;
}

/**
 * Extract account information from PDF
 */
function extractAccountFromPDF(text: string, institution?: string): ParsedAccount | null {
    const lowerText = text.toLowerCase();

    // Try to find account number
    const accountNumberPatterns = [
        /account\s*(?:number|#)?\s*:?\s*(?:xxxx|x{4}|\*{4})?(\d{4})/i,
        /ending\s+in\s+(\d{4})/i,
    ];

    let accountNumberLast4: string | undefined;
    for (const pattern of accountNumberPatterns) {
        const match = text.match(pattern);
        if (match) {
            accountNumberLast4 = match[1];
            break;
        }
    }

    // Determine account type
    let accountType: AccountType = 'other';
    if (lowerText.includes('checking')) {
        accountType = 'checking';
    } else if (lowerText.includes('savings')) {
        accountType = 'savings';
    } else if (lowerText.includes('credit card')) {
        accountType = 'credit_card';
    } else if (lowerText.includes('investment') || lowerText.includes('brokerage')) {
        accountType = 'investment';
    }

    // Try to find account name
    const accountNamePatterns = [
        /(?:account|card)\s+name\s*:?\s*(.+)/i,
        /(checking|savings|credit card|investment)\s+account/i,
    ];

    let accountName = `${institution || 'Unknown'} ${accountType}`;
    for (const pattern of accountNamePatterns) {
        const match = text.match(pattern);
        if (match) {
            accountName = match[1].trim();
            break;
        }
    }

    return {
        name: accountName,
        type: accountType,
        institution,
        accountNumberLast4,
    };
}

/**
 * Detect CSV format based on headers
 */
function detectCSVFormat(firstRow: any): 'mint' | 'personal_capital' | 'ynab' | 'generic' {
    const headers = Object.keys(firstRow).map(h => h.toLowerCase());

    // Mint format
    if (headers.includes('date') && headers.includes('description') && headers.includes('amount') && headers.includes('transaction type')) {
        return 'mint';
    }

    // Personal Capital format
    if (headers.includes('date') && headers.includes('description') && headers.includes('amount') && headers.includes('account')) {
        return 'personal_capital';
    }

    // YNAB format
    if (headers.includes('date') && headers.includes('payee') && headers.includes('outflow') && headers.includes('inflow')) {
        return 'ynab';
    }

    return 'generic';
}

/**
 * Map CSV row to transaction
 */
function mapCSVToTransaction(row: any, format: string): ParsedTransaction | null {
    try {
        let date: Date;
        let description: string;
        let amount: number;
        let category: string | undefined;

        switch (format) {
            case 'mint':
                date = parseDate(row.Date) || new Date();
                description = row.Description || '';
                amount = parseFloat(row.Amount) || 0;
                category = row.Category;
                break;

            case 'personal_capital':
                date = parseDate(row.Date) || new Date();
                description = row.Description || '';
                amount = parseFloat(row.Amount) || 0;
                category = row.Category;
                break;

            case 'ynab':
                date = parseDate(row.Date) || new Date();
                description = row.Payee || '';
                const outflow = parseFloat(row.Outflow) || 0;
                const inflow = parseFloat(row.Inflow) || 0;
                amount = inflow - outflow;
                category = row.Category;
                break;

            default: // generic
                // Try to find date column
                const dateColumn = Object.keys(row).find(k =>
                    k.toLowerCase().includes('date')
                );
                date = dateColumn ? (parseDate(row[dateColumn]) || new Date()) : new Date();

                // Try to find description column
                const descColumn = Object.keys(row).find(k =>
                    k.toLowerCase().includes('description') ||
                    k.toLowerCase().includes('memo') ||
                    k.toLowerCase().includes('payee')
                );
                description = descColumn ? row[descColumn] : '';

                // Try to find amount column
                const amountColumn = Object.keys(row).find(k =>
                    k.toLowerCase().includes('amount')
                );
                amount = amountColumn ? (parseFloat(row[amountColumn]) || 0) : 0;

                // Try to find category column
                const categoryColumn = Object.keys(row).find(k =>
                    k.toLowerCase().includes('category')
                );
                category = categoryColumn ? row[categoryColumn] : undefined;
                break;
        }

        if (!description || amount === 0) {
            return null;
        }

        return {
            date,
            description,
            amount,
            category: category || categorizeTransaction(description, amount),
            type: determineTransactionType(description, amount),
        };
    } catch (error) {
        console.error('Error mapping CSV row:', error);
        return null;
    }
}

/**
 * Extract account from CSV
 */
function extractAccountFromCSV(data: any[], format: string): ParsedAccount | null {
    // For most CSV exports, account info isn't included
    // We can try to infer from the data

    if (data.length === 0) return null;

    const firstRow = data[0];

    // Check if there's an Account column
    if (firstRow.Account) {
        return {
            name: firstRow.Account,
            type: 'other',
        };
    }

    return null;
}

/**
 * Parse date string to Date object
 */
function parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Try different date formats
    const formats = [
        // MM/DD/YYYY
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
        // MM/DD/YY
        /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/,
        // YYYY-MM-DD
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
        // MM-DD-YYYY
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    ];

    for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
            let year: number, month: number, day: number;

            if (format === formats[0] || format === formats[1]) {
                // MM/DD/YYYY or MM/DD/YY
                month = parseInt(match[1]) - 1;
                day = parseInt(match[2]);
                year = parseInt(match[3]);
                if (year < 100) year += 2000; // Convert YY to YYYY
            } else if (format === formats[2]) {
                // YYYY-MM-DD
                year = parseInt(match[1]);
                month = parseInt(match[2]) - 1;
                day = parseInt(match[3]);
            } else {
                // MM-DD-YYYY
                month = parseInt(match[1]) - 1;
                day = parseInt(match[2]);
                year = parseInt(match[3]);
            }

            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
    }

    // Fallback: try native Date parsing
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
}

/**
 * Parse amount string to number
 */
function parseAmount(amountStr: string): number {
    // Remove currency symbols and commas
    let cleaned = amountStr.replace(/[$,]/g, '');

    // Check if amount is in parentheses (negative)
    const isNegative = cleaned.includes('(') && cleaned.includes(')');
    cleaned = cleaned.replace(/[()]/g, '');

    const amount = parseFloat(cleaned);
    return isNegative ? -amount : amount;
}
