/**
 * Renders controlled claim states as a semantic definition ledger.
 * @param {HTMLElement} block authored claim ledger block
 */
export default function decorate(block) {
  const ledger = document.createElement('dl');
  ledger.className = 'claim-ledger-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const hasDetailCell = cells.length > 1;
    const labelText = (hasDetailCell && cells[0]?.textContent.trim()) || 'Claim';
    const entry = document.createElement('div');
    const term = document.createElement('dt');
    const detail = document.createElement('dd');
    const sources = hasDetailCell ? cells.slice(1) : cells;

    entry.className = 'claim-ledger-entry';
    entry.dataset.claim = labelText.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    term.textContent = labelText;
    sources.forEach((source) => {
      while (source.firstChild) detail.append(source.firstChild);
    });

    entry.append(term, detail);
    ledger.append(entry);
  });

  block.replaceChildren(ledger);
}
