// Utility functions for URL parameter handling and validation

export interface ParsedUrlParams {
    canvas_id: string | null;
    goalId: string | null;
    date: Date;
    rawParams: {
        canvas_id: string | null;
        urlGoalId: string | null;
        dateParam: string | null;
    };
}

/**
 * Validates and parses a date parameter from URL
 * @param dateParam - Raw date parameter from URL
 * @returns Valid Date object or null if invalid
 */
export const parseUrlDate = (dateParam: string | null): Date | null => {
    if (!dateParam) return null;

    try {
        const parsedDate = new Date(dateParam);
        // Check if the date is valid
        if (isNaN(parsedDate.getTime())) {
            console.warn('Invalid date parameter:', dateParam);
            return null;
        }

        // Check if date is reasonable (not too far in past/future)
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

        if (parsedDate < oneYearAgo || parsedDate > oneYearFromNow) {
            console.warn('Date parameter outside reasonable range:', dateParam);
            return null;
        }

        return parsedDate;
    } catch (error) {
        console.error('Error parsing date parameter:', error);
        return null;
    }
};

/**
 * Validates canvas ID format
 * @param canvasId - Raw canvas ID from URL
 * @returns true if valid, false otherwise
 */
export const validateCanvasId = (canvasId: string | null): boolean => {
    if (!canvasId) return false;

    // Basic validation - adjust regex based on your ID format
    // Allowing alphanumeric characters, hyphens, underscores, and common ID characters
    const isValidFormat = /^[a-zA-Z0-9_-]{1,50}$/.test(canvasId);

    if (!isValidFormat) {
        console.warn('Invalid canvas ID format:', canvasId);
        return false;
    }

    return true;
};

/**
 * Validates goal ID format
 * @param goalId - Raw goal ID from URL
 * @returns true if valid, false otherwise
 */
export const validateGoalId = (goalId: string | null): boolean => {
    if (!goalId) return false;

    // Basic validation - adjust regex based on your ID format
    const isValidFormat = /^[a-zA-Z0-9_-]{1,50}$/.test(goalId);

    if (!isValidFormat) {
        console.warn('Invalid goal ID format:', goalId);
        return false;
    }

    return true;
};

/**
 * Parses and validates URL search parameters
 * @param searchParams - URLSearchParams object
 * @returns Parsed and validated parameters
 */
export const parseUrlParams = (searchParams: URLSearchParams): ParsedUrlParams => {
    const canvas_id = searchParams.get('canvas_id');
    const urlGoalId = searchParams.get('goalId');
    const dateParam = searchParams.get('date');

    return {
        canvas_id: validateCanvasId(canvas_id) ? canvas_id : null,
        goalId: validateGoalId(urlGoalId) ? urlGoalId : null,
        date: parseUrlDate(dateParam) || new Date(),
        rawParams: { canvas_id, urlGoalId, dateParam }
    };
};

/**
 * Builds a URL with validated parameters
 * @param basePath - Base path for the URL
 * @param params - Parameters to include
 * @returns Complete URL string
 */
export const buildPlannerUrl = (
    basePath: string,
    params: {
        canvas_id?: string | null;
        goalId?: string | null;
        date?: Date;
    }
): string => {
    const searchParams = new URLSearchParams();

    if (params.canvas_id && validateCanvasId(params.canvas_id)) {
        searchParams.set('canvas_id', params.canvas_id);
    }

    if (params.goalId && validateGoalId(params.goalId)) {
        searchParams.set('goalId', params.goalId);
    }

    if (params.date) {
        searchParams.set('date', params.date.toISOString());
    }

    const queryString = searchParams.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
};

/**
 * Validates parameter consistency
 * @param params - Parsed URL parameters
 * @returns Array of validation warnings
 */
export const validateParameterConsistency = (params: ParsedUrlParams): string[] => {
    const warnings: string[] = [];

    // Canvas ID without goal ID might cause issues
    if (params.canvas_id && !params.goalId) {
        warnings.push('Canvas ID provided without Goal ID - this may cause navigation issues');
    }

    // Check for obviously invalid combinations
    if (params.rawParams.canvas_id && !params.canvas_id) {
        warnings.push(`Invalid canvas_id parameter: ${params.rawParams.canvas_id}`);
    }

    if (params.rawParams.urlGoalId && !params.goalId) {
        warnings.push(`Invalid goalId parameter: ${params.rawParams.urlGoalId}`);
    }

    if (params.rawParams.dateParam && params.date.getTime() === new Date().setHours(0, 0, 0, 0)) {
        warnings.push(`Date parameter could not be parsed, using today: ${params.rawParams.dateParam}`);
    }

    return warnings;
}; 