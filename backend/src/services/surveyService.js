import { fetchSurveys, fetchFilters } from "./qualtricsService.js";
import logger from "../utils/logger.js";

export async function getSurveys() {
    try {
        const surveys = await fetchSurveys();
        return surveys.map(s => ({ id: s.id, name: s.name }));
    } catch (err) {
        logger.error(`SurveyService.getSurveys failed: ${err.message}`);
        throw err;
    }
}

export async function getFilters(surveyId) {
    try {
        const filters = await fetchFilters(surveyId);
        return filters.map(f => ({ id: f.filterId, name: f.filterName }));
    } catch (err) {
        logger.error(`SurveyService.getFilters failed: ${err.message}`);
        throw err;
    }
}
