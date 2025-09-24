import fs from "fs/promises";
import Mustache from "mustache";
import path from "path";
import fsSync from "fs";
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

        exec(cmd, { cwd: reportsDir }, async (err) => {
            if (err) {
                logger.error(`[compileReport] LaTeX failed: ${err.message}`);
                return reject(new Error("LaTeX compilation failed"));
            }

            const junkExts = [".aux", ".out", ".toc"];
            for (const ext of junkExts) {
              const junkFile = path.join(reportsDir, `rawReport${ext}`);
              try {
                await fs.unlink(junkFile);
              } catch {} // ignore if file doesn’t exist
            }

            const pdfPath = path.join(reportsDir, "rawReport.pdf");
            resolve(pdfPath);
        });
    });
}

export async function compileFullReport() {
  const reportsDir = path.join(process.cwd(), "reports"); 

  return new Promise(async (resolve, reject) => {
    const texPath = path.join(reportsDir, "fullReport.md");
    const docxPath = path.join(reportsDir, "fullReport.docx");
    const referencePath = path.join(reportsDir, "reference.docx");

    const template = await fs.readFile(texPath, "utf8");
    const likert = await fs.readFile(path.join(reportsDir, "components/likert-markdown.md"), "utf8");

    const rendered = Mustache.render(template, {
      likert
    });

    const expandedPath = path.join(reportsDir, "expandedReport.md");
    await fs.writeFile(expandedPath, rendered, "utf8");
    
    const cmd = `pandoc ${expandedPath} -o "${docxPath}" --reference-doc="${referencePath}"`;
    exec(cmd, { cwd: reportsDir }, (err, stderr, stdout) => {
      if (err) {
        console.error("Pandoc error:", stderr);
        return reject(new Error(`DOCX conversion failed: ${stderr}`));
      }
      resolve(docxPath);
    });
  });
}

export async function renderTemplate(question) {
  let options = [];
  let counts = [];
  let responses = [];
  let totalResponses = question.responseCount;

  switch (question.type) {
    case "MC":
      options = question.responses.map(r => cleanText(r.option).replace(/,/g, "\\textcomma{} ")).join(", ");
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

  let templatePath = path.join(process.cwd(), `reports/templates/${question.type}.tex`);
  let template = await fs.readFile(templatePath, "utf8");

  const file = nameMap[question.id] ?? "overflow";

  let outputDir = path.join(process.cwd(), "reports/components");
  let outputPath = path.join(outputDir, `${file}.tex`);

  let rendered = Mustache.render(template, {
    options,
    counts,
    responses,
    totalResponses
  });
  await fs.writeFile(outputPath, rendered, "utf8");

  if (question.type === "MC") {
    try {
      const pdfPath = await makeChart(outputPath);
      logger.info(`[renderTemplate] ${file} compiled`);
    } catch (err) {
      logger.error(`[renderTemplate] Chart compilation failed for ${file}: ${err.message}`);
    }
  }
  if (question.type === "Matrix") {
    templatePath = path.join(process.cwd(), `reports/templates/MatrixMarkdown.tex`);
    template = await fs.readFile(templatePath, "utf8");
    outputPath = path.join(outputDir, `${file}-markdown.md`);
    rendered = Mustache.render(template, { responses });
    await fs.writeFile(outputPath, rendered, "utf8");
  }
}

export async function makeChart(texFile) {
  const fullPath = path.resolve(texFile);
  const dir = path.dirname(fullPath);
  const baseName = path.basename(texFile, ".tex");
  const pdfPath = path.join(dir, `${baseName}.pdf`);
  const jpgPath = path.join(dir, `${baseName}.jpg`);

  return new Promise((resolve, reject) => {
    const cmd = `lualatex -interaction=nonstopmode -output-directory="${dir}" "${fullPath}"`;

    exec(cmd, { cwd: dir }, async (err, stdout, stderr) => {
      if (err) {
        console.error("LaTeX compilation failed:", stderr || stdout);
        return reject(new Error(`LaTeX compile failed for ${texFile}`));
      }

      if (!fsSync.existsSync(pdfPath)) {
        return reject(new Error(`Expected PDF not found: ${pdfPath}`));
      }

      // Convert PDF → PNG using ImageMagick
      const convertCmd = `magick -density 300 "${pdfPath}" -quality 100 "${jpgPath}"`;
      exec(convertCmd, { cwd: dir }, async (convErr, convStdout, convStderr) => {
        if (convErr) {
          console.error("ImageMagick conversion failed:", convStderr || convStdout);
          // still resolve with PDF, even if PNG fails
          return resolve(pdfPath);
        }

        // Clean junk files
        const junkExts = [".aux", ".log", ".out", ".toc", ".tex", ".pdf"];
        for (const ext of junkExts) {
          const junkFile = path.join(dir, `${baseName}${ext}`);
          try {
            await fs.unlink(junkFile);
          } catch {}
        }

        // Resolve with both paths
        resolve({ pdfPath, jpgPath });
      });
    });
  });
}