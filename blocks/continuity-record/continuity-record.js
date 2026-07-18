/**
 * Renders the Then / Learned / Now amendment pattern as a semantic sequence.
 * @param {HTMLElement} block authored continuity record block
 */
export default function decorate(block) {
  const list = document.createElement('ol');
  list.className = 'continuity-record-list';
  list.setAttribute('aria-label', 'Continuity amendment sequence');

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const hasDetailCell = cells.length > 1;
    const labelText = (hasDetailCell && cells[0]?.textContent.trim()) || 'Stage';
    const item = document.createElement('li');
    const label = document.createElement('p');
    const body = document.createElement('div');
    const sources = hasDetailCell ? cells.slice(1) : cells;

    item.dataset.stage = labelText.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    label.className = 'continuity-record-label';
    label.textContent = labelText;
    body.className = 'continuity-record-body';

    sources.forEach((source) => {
      while (source.firstChild) body.append(source.firstChild);
    });

    item.append(label, body);
    list.append(item);
  });

  block.replaceChildren(list);
}
