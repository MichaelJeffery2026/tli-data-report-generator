import fs from "fs/promises";
import Mustache from "mustache";
import path from "path";
import { exec } from "child_process";
import { cleanText } from "../utils/cleanText.js";
import logger from "../utils/logger.js";

const nameMap = {
  "QID5": "hours",
  "QID6": "attendance",
  "QID7": "absence-reason",
  "QID8": "engaging",
  "QID9": "grade",
  "QID10": "likert",
  "QID11": "component",
  "QID12": "rationale-1",
  "QID14": "improvements",
  "QID15": "rationale-2",
  "QID16": "device",
  "QID17": "recording"
}

export async function compileReport() {
    const reportsDir = path.join(process.cwd(), "reports");

    return new Promise((resolve, reject) => {
        const cmd = `lualatex -interaction=nonstopmode rawReport.tex`;

        exec(cmd, { cwd: reportsDir }, (err) => {
            if (err) {
                logger.error(`[compileReport] LaTeX failed: ${err.message}`);
                return reject(new Error("LaTeX compilation failed"));
            }

            const pdfPath = path.join(reportsDir, "rawReport.pdf");
            resolve(pdfPath);
        });
    });
}

export async function renderTemplate(question) {
  const name = cleanText(question.text);
  let options = [];
  let counts = [];
  let responses = [];
  let totalResponses = question.responseCount;

  switch (question.type) {
    case "MC":
      options = question.responses.map(r => cleanText(r.option)).join(", ");
      counts =  question.responses.map(r => r.count).join(", ");
      break;
    
    case "TE":
      responses = question.responses.map(r => cleanText(r));
      break;

    case "Matrix":
      responses = question.responses.map(r => ({
        option: cleanText(r.option),
        min: r.min,
        max: r.max,
        mean: r.mean,
        stdev: r.stdev,
        var: r.var,
        count: r.responses,
        sum: r.sum
      }));
      break;

    default:
      return;
  }

  const templatePath = path.join(process.cwd(), `reports/templates/${question.type}.tex`);
  const template = await fs.readFile(templatePath, "utf8");

  const file = nameMap[question.id] ?? "overflow";

  const outputDir = path.join(process.cwd(), "reports/components");
  const outputPath = path.join(outputDir, `${file}.tex`);

  const rendered = Mustache.render(template, {
    name,
    options,
    counts,
    responses,
    totalResponses
  });
  await fs.writeFile(outputPath, rendered, "utf8");
}