import { fetchSurveys, fetchFilters } from "./qualtricsService.js";
import logger from "../utils/logger.js";

/**
 * Fetch surveys from the Qualtrics API and normalize them.
 *
 * This function delegates the API call to `fetchSurveys`, then
 * transforms the raw Qualtrics survey objects into a simplified
 * format containing only `id` and `name`. Any errors encountered
 * are logged and rethrown for the router/controller layer to handle.
 *
 * @async
 * @function getSurveys
 * @returns {Promise<Array<{ id: string, name: string }>>}
 *   A promise that resolves to an array of simplified survey objects.
 *
 * @throws {Error}
 *   Rethrows any error encountered while calling the Qualtrics API.
 *   The router is responsible for mapping these errors
 *   to appropriate HTTP responses.
 */
export async function getSurveys() {
    try {
        const surveys = await fetchSurveys();
        return surveys.map(s => ({ id: s.id, name: s.name }));
    } catch (err) {
        logger.error(`SurveyService.getSurveys failed: ${err.message}`);
        throw err;
    }
}

/**
 * Retrieves simplified survey filters for a given Qualtrics survey.
 *
 * Wraps `fetchFilters` to return only the filter ID and name,
 * making it easier for consumers to work with filter metadata
 * without parsing the full Qualtrics response.
 *
 * @async
 * @function getFilters
 * @param {string} surveyId - The Qualtrics survey ID whose filters should be retrieved.
 * @returns {Promise<{id: string, name: string}[]>} Resolves with an array of simplified filter objects.
 *
 * @throws {Error} If fetching filters from Qualtrics fails.
 */
export async function getFilters(surveyId) {
    try {
        const filters = await fetchFilters(surveyId);
        return filters.map(f => ({ id: f.filterId, name: f.filterName }));
    } catch (err) {
        logger.error(`SurveyService.getFilters failed: ${err.message}`);
        throw err;
    }
}
