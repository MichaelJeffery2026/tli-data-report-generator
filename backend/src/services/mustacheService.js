import fs from "fs/promises";
import Mustache from "mustache";
import path from "path";
import { cleanText } from "../utils/cleanText.js";

export async function loadPrompt(templateName) {
  const templatePath = path.join(process.cwd(), "reports", "prompts", templateName);
  console.log(templatePath);
  return fs.readFile(templatePath, "utf8");
}

export async function fillPrompt(templateName, body = {}) {
  const template = await loadPrompt(templateName);
  return Mustache.render(template, body);
}

export async function makeSection(input, sectionName) { 
    const outputPath = path.join(process.cwd(), "reports/components"); 
    const outputFile = path.join(outputPath, `${sectionName}.tex`); 

    await fs.writeFile(outputFile, cleanText(input), "utf8");
}