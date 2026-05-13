// ============================================================
// Types for Bulk Import feature
// ============================================================

export type ImportSessionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL_FAILED' | 'FAILED';

export interface ImportSession {
    id: string;
    fileName: string;
    totalRows: number;
    successRows: number;
    failedRows: number;
    status: ImportSessionStatus;
    createdAt: string;
    completedAt: string | null;
}

export interface ImportRowError {
    id: string;
    sessionId: string;
    rowNumber: number;
    field: string;
    value: string | null;
    errorMessage: string;
    createdAt: string;
}

export interface ImportSessionDetail extends ImportSession {
    rowErrors: ImportRowError[];
}

export interface EligibilityResult {
    eligible: boolean;
    reasons: string[];
    stats: {
        activePropertyCount: number;
        kycStatus: string;
        accountAgeDays: number;
    };
}
