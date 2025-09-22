import express, { raw } from "express";
import { getRawReport } from "../services/reportService.js"
import logger from "../utils/logger.js";
import AppError from "../errors/appError.js";

const router = express.Router();

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get("/raw/:surveyId/:sectionId", asyncHandler(async (req, res) => {
    const { surveyId, sectionId } = req.params;
    const rawReport = await getRawReport(surveyId, sectionId);

    if (!rawReport) {
        logger.warn(`GET /reports/raw/${surveyId}/${sectionId} → no raw report found`);
        throw new AppError("No raw report found", 404);
    }

    logger.info(`GET /reports/raw/${surveyId}/${sectionId} → raw report ready`);
    res.status(200).download(rawReport, `raw-report-${surveyId}-${sectionId}.pdf`);
}));

export default router;
