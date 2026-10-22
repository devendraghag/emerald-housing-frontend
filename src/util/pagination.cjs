const PAGE_SIZE = 10;
function pageCount(total) { return Math.ceil(Math.max(0, total) / PAGE_SIZE); }
function clampPage(page, pages) { return Math.max(0, Math.min(Math.floor(Number(page) || 0), Math.max(0, pages - 1))); }
function pageItems(items, page) {
  const start = clampPage(page, pageCount(items.length)) * PAGE_SIZE;
  return items.slice(start, start + PAGE_SIZE);
}
module.exports = { PAGE_SIZE, pageCount, clampPage, pageItems };
