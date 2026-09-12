/**
 * Cleans AI-generated responses by stripping accidental JSON syntax,
 * stray curly braces enclosing sentences or tips, and normalizes markdown.
 *
 * Example input:
 *   "{**Weigh on Neutral Ground:** Insist on weighing your paddy at a trusted, independent local *dharmakanta* (weighbridge)...}"
 * Returns:
 *   "**Weigh on Neutral Ground:** Insist on weighing your paddy at a trusted, independent local *dharmakanta* (weighbridge)..."
 */
export function cleanAiText(raw) {
  if (!raw && raw !== 0) return "";
  let text = raw;

  if (typeof text === "object") {
    text =
      text.answer ||
      text.advice ||
      text.response ||
      (Array.isArray(text.tips) ? text.tips.join("\n\n") : null) ||
      text.text ||
      JSON.stringify(text);
  }

  if (typeof text !== "string") {
    text = String(text);
  }

  text = text.trim();

  // Strip markdown code fences if wrapping json/text: ```json ... ```
  text = text.replace(/^```(?:json|markdown|text)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

  // Try parsing JSON if starts and ends with braces or brackets
  if ((text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))) {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === "string") return cleanAiText(parsed);
      if (Array.isArray(parsed)) return parsed.map(cleanAiText).filter(Boolean).join("\n\n");
      if (parsed.answer) return cleanAiText(parsed.answer);
      if (parsed.advice) return cleanAiText(parsed.advice);
      if (parsed.response) return cleanAiText(parsed.response);
      if (parsed.text) return cleanAiText(parsed.text);
      if (Array.isArray(parsed.tips)) return parsed.tips.map(cleanAiText).filter(Boolean).join("\n\n");
      if (typeof parsed === "object") {
        const values = Object.values(parsed).filter((v) => typeof v === "string");
        if (values.length > 0) return values.map(cleanAiText).join("\n\n");
      }
    } catch (_) {
      // Not valid JSON, proceed to regex cleaning
    }
  }

  // Strip enclosing braces around individual lines or bullet points (e.g. "{**Tip:** ...}" -> "**Tip:** ...")
  text = text.replace(/^\s*\{+\s*/gm, "").replace(/\s*\}+\s*$/gm, "");

  // Strip leading and trailing braces or brackets if remaining
  text = text.replace(/^\{+\s*/, "").replace(/\s*\}+$/, "");

  // Strip accidental outer quotes
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    text = text.slice(1, -1).trim();
  }

  // Clean empty bracket lines
  text = text.replace(/^\s*[{}]\s*$/gm, "");

  return text.trim();
}

export default cleanAiText;
