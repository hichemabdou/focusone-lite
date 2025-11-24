import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';
import { parseFinancialFile } from '@/lib/finance/fileParser';
import { filterDuplicates, generateTransactionHash } from '@/lib/finance/duplicateDetector';
import { batchCategorize } from '@/lib/finance/transactionCategorizer';

// POST /api/finance/upload - Upload and process financial files
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getServiceSupabase();

        // Get user ID
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', session.user.email)
            .single();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!['pdf', 'csv'].includes(fileExtension || '')) {
            return NextResponse.json(
                { error: 'Unsupported file type. Only PDF and CSV files are supported.' },
                { status: 400 }
            );
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 10MB.' },
                { status: 400 }
            );
        }

        // Create file tracking record
        const { data: uploadedFile, error: fileError } = await supabase
            .from('uploaded_financial_files')
            .insert({
                user_id: user.id,
                file_name: file.name,
                file_type: fileExtension as 'pdf' | 'csv',
                file_size: file.size,
                processing_status: 'processing',
            })
            .select()
            .single();

        if (fileError) {
            console.error('Error creating file record:', fileError);
            return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
        }

        try {
            // Parse the file
            const parsedData = await parseFinancialFile(file);

            // Get existing transactions for duplicate detection
            const { data: existingTransactions } = await supabase
                .from('transactions')
                .select('hash')
                .eq('user_id', user.id);

            // Generate hashes for parsed transactions first
            const parsedWithHashes = parsedData.transactions.map(t => ({
                ...t,
                hash: generateTransactionHash({
                    date: t.date,
                    description: t.description,
                    amount: t.amount,
                }),
            }));

            // Filter out duplicates
            const { unique: uniqueTransactions, duplicates } = filterDuplicates(
                parsedWithHashes,
                existingTransactions || []
            );

            // Categorize transactions
            const categorizedTransactions = batchCategorize(uniqueTransactions);

            // Process accounts
            let accountsCreated = 0;
            const accountMap = new Map<string, string>(); // name -> id

            for (const parsedAccount of parsedData.accounts) {
                // Check if account already exists
                const { data: existingAccount } = await supabase
                    .from('financial_accounts')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('account_name', parsedAccount.name)
                    .maybeSingle();

                if (existingAccount) {
                    accountMap.set(parsedAccount.name, existingAccount.id);
                } else {
                    // Create new account
                    const { data: newAccount, error: accountError } = await supabase
                        .from('financial_accounts')
                        .insert({
                            user_id: user.id,
                            account_name: parsedAccount.name,
                            account_type: parsedAccount.type,
                            institution: parsedAccount.institution,
                            account_number_last4: parsedAccount.accountNumberLast4,
                            is_asset: !['credit_card', 'loan', 'mortgage'].includes(parsedAccount.type),
                            current_balance: parsedAccount.balance || 0,
                        })
                        .select()
                        .single();

                    if (!accountError && newAccount) {
                        accountMap.set(parsedAccount.name, newAccount.id);
                        accountsCreated++;
                    }
                }
            }

            // Insert transactions
            let transactionsInserted = 0;
            const transactionsToInsert = categorizedTransactions.map(t => {
                // Try to find account ID
                let accountId: string | undefined;
                if (parsedData.accounts.length > 0) {
                    accountId = accountMap.get(parsedData.accounts[0].name);
                }

                return {
                    user_id: user.id,
                    account_id: accountId,
                    transaction_date: t.date.toISOString().split('T')[0],
                    description: t.description,
                    amount: t.amount,
                    category: t.category,
                    transaction_type: t.transaction_type,
                    is_recurring: t.is_recurring,
                    source_file: file.name,
                    hash: generateTransactionHash({
                        date: t.date,
                        description: t.description,
                        amount: t.amount,
                    }),
                };
            });

            if (transactionsToInsert.length > 0) {
                // Insert in batches of 100
                const batchSize = 100;
                for (let i = 0; i < transactionsToInsert.length; i += batchSize) {
                    const batch = transactionsToInsert.slice(i, i + batchSize);
                    const { error: insertError } = await supabase
                        .from('transactions')
                        .insert(batch);

                    if (!insertError) {
                        transactionsInserted += batch.length;
                    } else {
                        console.error('Error inserting transaction batch:', insertError);
                    }
                }
            }

            // Update file record with success
            await supabase
                .from('uploaded_financial_files')
                .update({
                    processing_status: 'completed',
                    transactions_extracted: transactionsInserted,
                    accounts_detected: accountsCreated,
                    duplicates_skipped: duplicates.length,
                })
                .eq('id', uploadedFile.id);

            // Create net worth snapshot
            await supabase.rpc('create_net_worth_snapshot', { p_user_id: user.id });

            // Generate insights
            await fetch(`${request.nextUrl.origin}/api/finance/insights/generate`, {
                method: 'POST',
                headers: {
                    'Cookie': request.headers.get('cookie') || '',
                },
            });

            return NextResponse.json({
                success: true,
                fileId: uploadedFile.id,
                accountsDetected: accountsCreated,
                transactionsExtracted: transactionsInserted,
                duplicatesSkipped: duplicates.length,
            }, { status: 201 });

        } catch (parseError) {
            console.error('Error parsing file:', parseError);

            // Update file record with error
            await supabase
                .from('uploaded_financial_files')
                .update({
                    processing_status: 'failed',
                    error_message: parseError instanceof Error ? parseError.message : 'Unknown error',
                })
                .eq('id', uploadedFile.id);

            return NextResponse.json({
                error: 'Failed to parse file',
                details: parseError instanceof Error ? parseError.message : 'Unknown error',
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/finance/upload - Get upload history
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getServiceSupabase();

        // Get user ID
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', session.user.email)
            .single();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch upload history
        const { data: files, error } = await supabase
            .from('uploaded_financial_files')
            .select('*')
            .eq('user_id', user.id)
            .order('upload_date', { ascending: false });

        if (error) {
            console.error('Error fetching upload history:', error);
            return NextResponse.json({ error: 'Failed to fetch upload history' }, { status: 500 });
        }

        return NextResponse.json({ files });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
