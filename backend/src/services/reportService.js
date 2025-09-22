import { fetchQuestions, startResponseExport, pollResponseExport, completeResponseExport } from "./qualtricsService.js";
import logger from "../utils/logger.js";

import { compileReport, renderTemplate } from "./pdfService.js";

export async function getRawReport(surveyId, sectionId) {
    try {
        // 1. Fetch question data from qualtrics
        const questions = await fetchQuestions(surveyId);
        const shapedQuestions = await shapeQuestions(questions, surveyId, sectionId);

        // 2. Fetch response data from qualtrics
        const responses = await exportResponses(surveyId, sectionId);
        const shapedResponses = await shapeResponses(responses, surveyId, sectionId);

        // 3. Combine question and response data
        const rawData = await formatRawReportData(shapedQuestions, shapedResponses, surveyId, sectionId);

        for (const response of rawData.data) {
            await renderTemplate(response);
        }
        const pdfPath = await compileReport();
        return pdfPath;
    } catch (err) {
        logger.error(`reportService.getRawReport failed: ${err.message}`);
        throw err;
    }
}

async function shapeQuestions(questionData, surveyId, sectionId) {
    try {
        return (questionData).map(question => {
            const base = {
                id: `${question.QuestionID}`,
                text: question.QuestionText,
                type: question.QuestionType,
                responseCount: 0
            };

            switch (question.QuestionType) {
                case "MC":
                    return {
                        ...base,
                        responses: Object.entries(question.Choices ?? {}).map(([value, obj]) => {
                            return {
                                option: obj.Display ?? "",
                                choiceId: question.RecodeValues?.[value] ?? value,
                                count: 0
                            }
                        }),
                    }

                case "TE":
                    return {
                        ...base,
                        responses: []
                    }
                
                case "Matrix":
                    return {
                        ...base,
                        responses: Object.entries(question.Choices ?? {}).map(([value, obj]) => {
                            return {
                                option: obj.Display ?? "",
                                id: `${question.QuestionID}_${value}`,
                                min: Number.MAX_SAFE_INTEGER,
                                max: Number.MIN_SAFE_INTEGER,
                                mean: 0,
                                stdev: 0,
                                var: 0,
                                responses: 0,
                                sum: 0,
                                m2: 0
                            }
                        }),
                    }
                
                default:
                    logger.warn(`shapeQuestionData → unknown type=${base.type} for qid=${base.id} (surveyId=${surveyId}, sectionId=${sectionId})`);
                    return {
                        ...base,
                        questionResponses: []
                    }
            }
        });
    } catch (err) {
        logger.error(`shapeQuestionData failed for surveyId=${surveyId}, sectionId=${sectionId}: ${err.message}`);
        throw err;
    }
}

async function shapeResponses(responseData, surveyId, sectionId) {
    try {
        return (responseData ?? []).map(element => ({
        answers: Object.entries(element.values)
            .filter(([key]) => key.startsWith("QID"))
            .map(([qid, answer]) => ({ qid, answer }))
        }));
    } catch (err) {
        logger.error(`shapeResponses failed for surveyId=${surveyId}, sectionId=${sectionId}: ${err.message}`);
        throw err;
    }
}

async function exportResponses(surveyId, sectionId) {
    try {
        // 1. Kick off export
        const progressId = await startResponseExport(surveyId, sectionId);
        logger.debug(`exportResponses → started export (surveyId=${surveyId}, sectionId=${sectionId}, progressId=${progressId})`);

        // 2. Poll until complete
        const fileId = await pollResponseExport(surveyId, progressId);
        logger.debug(`exportResponses → export ready (surveyId=${surveyId}, fileId=${fileId})`);

        // 3. Download + parse responses
        const responses = await completeResponseExport(surveyId, fileId);
        
        // Success logging
        if (responses.length === 0) {
            logger.warn(`exportResponses → 0 responses returned (surveyId=${surveyId}, sectionId=${sectionId})`);
        } else {
            logger.info(`exportResponses finished (surveyId=${surveyId}, sectionId=${sectionId}) → ${responses.length} responses`);
        }

        return responses;
    } catch (err) {
        logger.error(`exportResponses failed for surveyId=${surveyId}, sectionId=${sectionId}: ${err.message}`);
        throw err;
    }
}

async function formatRawReportData(questions, responses, surveyId, sectionId) {
    try {
        let rawReport = {
            responses: responses.length,
            data: questions
        };

        responses.forEach(response => {
            const answers = response.answers;
            answers.forEach(answer => {
                const question = rawReport.data.find(question => [answer.qid, answer.qid.split("_")[0]].includes(question.id));

                if (!question) {
                    logger.warn(`formatRawReportData → no matching question for qid=${answer.qid} (surveyId=${surveyId}, sectionId=${sectionId})`);
                    return;
                }

                let selections = answer.answer;

                switch (question.type) {
                    case "MC":
                        if (!Array.isArray(selections)) selections = [selections];
                        selections.forEach(selection => {
                            const option = question.responses.find(r => r.choiceId === String(selection));

                            if (!option) {
                                logger.warn(`formatRawReportData → option ${selection} not found in question ${question.id} (surveyId=${surveyId})`);
                                return;
                            }

                            option.count += 1;
                        });
                        break;
                    
                    case "TE":
                        question.responses.push(selections);
                        break;

                    case "Matrix":
                        const option = question.responses.find(response => response.id === answer.qid);

                        if (!option) {
                            logger.warn(`formatRawReportData → matrix id=${answer.qid} not found in question ${question.id} (surveyId=${surveyId})`);
                            return;
                        }

                        const x = Number(answer.answer);
                        const n = option.responses + 1;
                        let mu = option.mean;
                        const delta1 = x - mu;
                        mu = mu + delta1 / n;
                        const delta2 = x - mu;
                        const m2 = option.m2 + delta1 * delta2;
                        option.m2 = m2;
                        option.min = Math.min(option.min, x);
                        option.max = Math.max(option.max, x);
                        option.mean = mu;
                        option.var = (m2 / n);
                        option.stdev = Math.sqrt(option.var);
                        option.responses = n;
                        option.sum += answer.answer;
                        break;
                }
                question.responseCount += 1;
            });
        });

        rawReport.data.forEach(question => {
            if (question.type === "Matrix") {
                question.responses.forEach(response => {
                    response.min = response.min.toFixed(2);
                    response.max = response.max.toFixed(2);
                    response.mean = response.mean.toFixed(2);
                    response.stdev = response.stdev.toFixed(2);
                    response.var = response.var.toFixed(2);
                    response.sum = response.sum.toFixed(2);
                    delete response.m2;
                });
                question.responseCount /= question.responses.length;
            };
            if (question.type === "MC") {
                question.responses.sort((a, b) => Number(a.choiceId) - Number(b.choiceId));
            };
        }); 

        logger.debug(`formatRawReportData → merged ${responses.length} responses into ${questions.length} questions`);
        return rawReport;
    } catch (err) {
        logger.error(`formatRawReportData failed: ${err.message}`, { stack: err.stack });
        throw err;
    }
}