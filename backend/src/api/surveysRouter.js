// Express router for survey-related endpoints.
// Routes delegate business logic to the surveyService layer.
// Uses asyncHandler for error propagation and centralized error handling.
import express from "express";
import { getSurveys, getFilters } from "../services/surveyService.js";
import logger from "../utils/logger.js";
import AppError from "../errors/appError.js";

const router = express.Router();

// Utility wrapper to catch async errors and pass them to Express error handler
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * GET /surveys
 * Fetch all surveys from the service layer.
 * - 200 OK: Returns an array of surveys (can be empty).
 * - 404 Not Found: If no surveys exist.
 * - 500 Internal Server Error: On unexpected failures.
 */
router.get("/", asyncHandler(async (_req, res) => {
    const surveys = await getSurveys();

    if (!surveys || surveys.length === 0) {
        logger.warn("GET /surveys found 0 surveys");
        throw new AppError("No surveys found", 404);
    }

    logger.info(`GET /surveys found ${surveys.length} surveys`);
    res.status(200).json(surveys);
}));

/**
 * GET /surveys/:surveyId/filters
 * Fetch all filters for a given survey from the service layer.
 * - 200 OK: Returns an array of filters (can be empty).
 * - 404 Not Found: If no filters exist for the survey.
 * - 500 Internal Server Error: On unexpected failures.
 */
router.get("/:surveyId/filters", asyncHandler(async (req, res) => {
    const { surveyId } = req.params;
    const filters = await getFilters(surveyId);

    if (!filters || filters.length === 0) {
        logger.warn(`GET /surveys/${surveyId}/filters found 0 filters`);
        throw new AppError("No filters found", 404);
    }

    logger.info(`GET /surveys/${surveyId}/filters found ${filters.length} filters`);
    res.status(200).json(filters);
}));

export default router;
