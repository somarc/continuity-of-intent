/**
 * Turns authored two-column rows into a semantic article list.
 * @param {HTMLElement} block authored canon articles block
 */
export default function decorate(block) {
  const list = document.createElement('ol');
  list.className = 'canon-articles-list';
  list.setAttribute('aria-label', block.classList.contains('constitution')
    ? 'Articles of the Intent Constitution'
    : 'Articles of authorship');

  [...block.children].forEach((row, index) => {
    const cells = [...row.children];
    const hasDetailCell = cells.length > 1;
    const item = document.createElement('li');
    const number = document.createElement('span');
    const body = document.createElement('div');
    const sources = hasDetailCell ? cells.slice(1) : cells;

    number.className = 'canon-articles-number';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = (hasDetailCell && cells[0]?.textContent.trim())
      || String(index + 1).padStart(2, '0');

    body.className = 'canon-articles-body';
    sources.forEach((source) => {
      while (source.firstChild) body.append(source.firstChild);
    });

    item.append(number, body);
    list.append(item);
  });

  block.replaceChildren(list);
}
