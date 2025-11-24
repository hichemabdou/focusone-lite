// Duplicate Transaction Detection

import { Transaction, ParsedTransaction } from './types';
import crypto from 'crypto';

/**
 * Generate a hash for a transaction to detect duplicates
 * Hash is based on: date + amount + description
 */
export function generateTransactionHash(transaction: {
    date: Date | string;
    description: string;
    amount: number;
}): string {
    const date = transaction.date instanceof Date
        ? transaction.date.toISOString().split('T')[0]
        : new Date(transaction.date).toISOString().split('T')[0];

    const normalized = {
        date,
        amount: Math.abs(transaction.amount).toFixed(2),
        description: transaction.description.toLowerCase().trim(),
    };

    const hashString = JSON.stringify(normalized);
    return crypto.createHash('sha256').update(hashString).digest('hex');
}

/**
 * Check if a transaction is a duplicate
 * @param transaction Transaction to check
 * @param existingTransactions Array of existing transactions
 * @returns True if duplicate found
 */
export function isDuplicate(
    transaction: ParsedTransaction,
    existingTransactions: Transaction[]
): boolean {
    const newHash = generateTransactionHash({
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
    });

    return existingTransactions.some(existing => existing.hash === newHash);
}

/**
 * Filter out duplicate transactions from a batch
 * @param newTransactions New transactions to check
 * @param existingTransactions Existing transactions in database
 * @returns Object with unique and duplicate transactions
 */
export function filterDuplicates(
    newTransactions: ParsedTransaction[],
    existingTransactions: Transaction[]
): {
    unique: ParsedTransaction[];
    duplicates: ParsedTransaction[];
} {
    const unique: ParsedTransaction[] = [];
    const duplicates: ParsedTransaction[] = [];

    for (const transaction of newTransactions) {
        if (isDuplicate(transaction, existingTransactions)) {
            duplicates.push(transaction);
        } else {
            unique.push(transaction);
        }
    }

    return { unique, duplicates };
}

/**
 * Find potential duplicates within a batch (before comparing to DB)
 * Useful for detecting duplicates in a single uploaded file
 */
export function findInternalDuplicates(
    transactions: ParsedTransaction[]
): {
    unique: ParsedTransaction[];
    duplicates: ParsedTransaction[];
} {
    const seen = new Set<string>();
    const unique: ParsedTransaction[] = [];
    const duplicates: ParsedTransaction[] = [];

    for (const transaction of transactions) {
        const hash = generateTransactionHash({
            date: transaction.date,
            description: transaction.description,
            amount: transaction.amount,
        });

        if (seen.has(hash)) {
            duplicates.push(transaction);
        } else {
            seen.add(hash);
            unique.push(transaction);
        }
    }

    return { unique, duplicates };
}

/**
 * Check if two transactions are similar (fuzzy matching)
 * Useful for detecting near-duplicates with slight variations
 */
export function areSimilarTransactions(
    t1: { date: Date | string; description: string; amount: number },
    t2: { date: Date | string; description: string; amount: number },
    options: {
        dateTolerance?: number; // days
        amountTolerance?: number; // percentage
        descriptionSimilarity?: number; // 0-1, minimum similarity score
    } = {}
): boolean {
    const {
        dateTolerance = 1,
        amountTolerance = 0.01, // 1%
        descriptionSimilarity = 0.8,
    } = options;

    // Check date similarity
    const date1 = t1.date instanceof Date ? t1.date : new Date(t1.date);
    const date2 = t2.date instanceof Date ? t2.date : new Date(t2.date);
    const daysDiff = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff > dateTolerance) {
        return false;
    }

    // Check amount similarity
    const amountDiff = Math.abs(t1.amount - t2.amount);
    const amountAvg = (Math.abs(t1.amount) + Math.abs(t2.amount)) / 2;
    const amountDiffPercent = amountAvg > 0 ? amountDiff / amountAvg : 0;

    if (amountDiffPercent > amountTolerance) {
        return false;
    }

    // Check description similarity using Levenshtein distance
    const similarity = calculateStringSimilarity(
        t1.description.toLowerCase(),
        t2.description.toLowerCase()
    );

    return similarity >= descriptionSimilarity;
}

/**
 * Calculate string similarity using Levenshtein distance
 * Returns a value between 0 (completely different) and 1 (identical)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
        return 1.0;
    }

    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}
