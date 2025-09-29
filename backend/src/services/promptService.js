import fs from "fs/promises";
import Mustache from "mustache";
import path from "path";
import { cleanText } from "../utils/cleanText.js";

export async function fillPrompt(templateName, body = {}) {
  const templatePath = path.join(process.cwd(), "reports", "prompts", templateName);
  const template = await fs.readFile(templatePath, "utf8");
  if (Object.keys(body).length === 0) return template;
  return Mustache.render(template, body);
}

export async function makeSection(input, sectionName) { 
    const outputPath = path.join(process.cwd(), "reports/components"); 
    const outputFile = path.join(outputPath, `${sectionName}.txt`); 

    await fs.writeFile(outputFile, cleanText(input), "utf8");
}