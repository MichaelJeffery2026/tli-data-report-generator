import logger from "../utils/logger.js";

const TOKEN = process.env.QUALTRICS_API_TOKEN;
const BASE = `https://${process.env.QUALTRICS_DC}.qualtrics.com/API/v3`

/**
 * Low-level wrapper around the Qualtrics API.
 *
 * Adds authentication headers, checks HTTP status, and logs failures.
 * Any non-2xx responses are turned into an Error with an attached
 * `status` property for the Express error handler to use.
 *
 * @async
 * @function qualtricsFetch
 * @param {string} path - API endpoint path (e.g., "/surveys").
 * @param {RequestInit} [init={}] - Optional fetch options (method, headers, body).
 * @returns {Promise<Response>} The raw fetch Response object (caller must parse JSON).
 * @throws {Error} If the response status is not ok (non-2xx).
 */
export async function qualtricsFetch(path, init = {}) {
    const response = await fetch (`${BASE}${path}`, {
        ...init,
        headers: {
            "X-API-TOKEN": TOKEN,
            ...(init.headers || {})
        }
    });
    if (!response.ok) {
        let message = "Unknown Qualtrics error";
        try {
            const json = await response.json();
            message = json?.meta?.error?.errorMessage || message;
        } catch {
            // If body isn't JSON, keep the default message
        }

        const err = new Error(message);
        err.status = response.status; // preserve Qualtrics HTTP status
        logger.error(`qualtricsFetch failed: ${err.message}`, { status: response.status });
        throw err;
    }
    return response;
}

/**
 * High-level fetch for surveys from the Qualtrics API.
 *
 * Calls the /surveys endpoint, parses the JSON payload, and extracts
 * the array of survey objects. Logs the number of surveys returned.
 *
 * @async
 * @function fetchSurveys
 * @returns {Promise<Array<Object>>} Array of survey objects as returned by Qualtrics.
 *   The raw Qualtrics objects are returned; callers are expected to normalize.
 *
 * @throws {Error} If the request to Qualtrics fails or JSON parsing fails.
 */
export async function fetchSurveys() {
    try {
        const response = await qualtricsFetch(`/surveys`);
        const data = await response.json();
        const surveys = data.result?.elements ?? []

        logger.debug(`Qualtrics returned ${surveys.length} surveys`);
        return surveys;
    } catch (err) {
        logger.error(`Qualtrics fetchSurveys failed: ${err.message}`, { stack: err.stack });
        throw err;
    }
}

/**
 * Fetches all filters associated with a given Qualtrics survey.
 *
 * This function makes a request to the Qualtrics API using `qualtricsFetch`
 * and retrieves any filter configurations defined for the specified survey.
 * 
 * @async
 * @function fetchFilters
 * @param {string} surveyId - The Qualtrics survey ID whose filters should be fetched.
 * @returns {Promise<Object[]>} Resolves with an array of filter objects, or an empty array if none exist.
 *
 * @throws {Error} If the API request fails, times out, or returns a non-OK response.
 */
export async function fetchFilters(surveyId) {
    try {
        const response = await qualtricsFetch(`/surveys/${encodeURIComponent(surveyId)}/filters`);
        const data = await response.json();
        const filters = data.result?.elements ?? [];

        logger.debug(`Qualtrics returned ${filters.length} filters`);
        return filters;
    } catch (err) {
        logger.error(`Qualtrics fetchFilters failed: ${err.message}`, { stack: err.stack });
        throw err;
    }
}