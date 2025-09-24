import he from "he";

export function cleanText(str) {
  if (!str) return "";

  return he.decode(str)
    .replace(/<\/li>\s*<li>/g, ", ")   // comma between items
    .replace(/<li>/g, "")              // strip opening li if at start
    .replace(/<\/li>/g, "")            // strip leftover closing li
    .replace(/<\/?ol>/g, "")           // strip <ol> wrappers
    .replace(/<[^>]+>/g, "") // strip HTML tags
    .replace(/([\\{}#$%&_^\~])/g, "\\$1")
    .replace(/\r?\n\r?\n/g, " \n\\par\n ")
    // .replace(/,/g, "\\textcomma{} ")
    .replace(/\r?\n/g, " ");
}