import logger from "../utils/logger.js";
import { unzip } from "../utils/unzip.js";

export async function qualtricsFetch(path, init = {}) {
    const response = await fetch (`https://${process.env.QUALTRICS_DC}.qualtrics.com/API/v3${path}`, {
        ...init,
        headers: {
            "X-API-TOKEN": process.env.QUALTRICS_API_TOKEN,
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
        err.status = response.status;
        logger.error(`qualtricsFetch failed: ${err.message}`, { status: response.status });
        throw err;
    }
    return response;
}

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

export async function fetchQuestions(surveyId) {
    try {
        const response = await qualtricsFetch(`/survey-definitions/${encodeURIComponent(surveyId)}/questions`);
        const data = await response.json();
        const questions = data.result?.elements ?? []
        
        logger.debug(`Qualtrics returned ${questions.length} questions`);
        return questions;
    } catch (err) {
        logger.error(`Qualtrics fetchQuestions failed: ${err.message}`, { stack: err.stack });
        throw err;
    }
}

export async function startResponseExport(surveyId, sectionId) {
    try {
        const response = await qualtricsFetch(`/surveys/${encodeURIComponent(surveyId)}/export-responses`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ format: "json", filterId: sectionId })
        });
        const data = await response.json();
        const progressId = data.result.progressId
        
        logger.debug(`startResponseExport → progressId=${progressId} (surveyId=${surveyId}, sectionId=${sectionId})`);
        return progressId;
    } catch (err) {
        logger.error(`startResponseExport failed for surveyId=${surveyId}, sectionId=${sectionId}: ${err.message}`);
        throw err;
    }
}

export async function pollResponseExport(surveyId, progressId) {
    try {
        const intervalMs = 1500;
        const maxWaitMs = 90_000;
        const deadline = Date.now() + maxWaitMs;

        let fileId = null;
        let status = "inProgress"

        while (Date.now() < deadline) {
            const response = await qualtricsFetch(`/surveys/${encodeURIComponent(surveyId)}/export-responses/${encodeURIComponent(progressId)}`);
            const data = await response.json();
            status = data.result.status
            fileId = data.result.fileId;

            logger.debug(`pollResponseExport → status=${status} (surveyId=${surveyId}, progressId=${progressId})`);


            if (status === "complete") break;
            await new Promise(r => setTimeout(r, intervalMs));
        }

        if (status !== "complete") {
            const err = new Error("Export polling timed out");
            err.status = 504;
            throw err;
        }

        logger.debug(`pollResponseExport → fileId=${fileId} (surveyId=${surveyId}, progressId=${progressId})`);
        return fileId;
    } catch (err) {
        logger.error(`pollResponseExport failed for surveyId=${surveyId}, progressId=${progressId}: ${err.message}`);
        throw err;
    }
}

export async function completeResponseExport(surveyId, fileId) {
    try {
        const response = await qualtricsFetch(`/surveys/${encodeURIComponent(surveyId)}/export-responses/${encodeURIComponent(fileId)}/file`);
        const data = await unzip(response);
        const responses = data.responses ?? [];

        logger.info(`Qualtrics returned ${responses.length} responses`);
        return responses;
    } catch (err) {
        logger.error(`completeResponseExport failed for surveyId=${surveyId}, fileId=${fileId}: ${err.message}`);
        throw err;
    }
}