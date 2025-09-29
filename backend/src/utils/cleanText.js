import he from "he";

export function cleanText(str) {
  if (!str) return "";

  return he.decode(str)
    .replace(/<\/li>\s*<li>/g, ", ")
    .replace(/<li>/g, "")
    .replace(/<\/li>/g, "")
    .replace(/<\/?ol>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/([\\{}#$%&_^\~])/g, "\\$1")
    .replace(/\r?\n\r?\n/g, " \n\\par\n ")
    .replace(/\r?\n/g, " ");
}