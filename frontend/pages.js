/** Page rendering entry point. Role renderers are loaded from feature files. */
const PageTemplates = window.PageTemplates || {};

async function getPageContent(role, page) {
  const handler = PageTemplates[role]?.[page] || PageTemplates.student[page];
  if (typeof handler === 'function') {
    try {
      return await handler();
    } catch (err) {
      console.error('Page render error:', err);
      return `<div class="error-panel"><p>Failed to load ${escapeHtml(page)}: ${escapeHtml(err.message)}</p></div>`;
    }
  }
  return PageTemplates.student.Dashboard();
}
