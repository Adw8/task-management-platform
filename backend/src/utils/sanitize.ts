import sanitizeHtml from 'sanitize-html';

export function sanitize(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
}
