const SVG_NS = 'http://www.w3.org/2000/svg';
const VIDEO_PATTERN = /\.(mp4|webm|ogg)(?:[?#].*)?$/i;

function removeMediaLink(link) {
  const paragraph = link.closest('p');
  if (
    paragraph
    && paragraph.querySelectorAll('a').length === 1
    && paragraph.textContent.trim() === link.textContent.trim()
  ) {
    paragraph.remove();
  } else {
    link.remove();
  }
}

function extractMedia(block) {
  const videoLink = [...block.querySelectorAll('a[href]')]
    .find((link) => VIDEO_PATTERN.test(link.href));
  const picture = block.querySelector('picture');
  const standaloneImage = picture ? null : block.querySelector('img');
  if (!videoLink && !picture && !standaloneImage) return null;

  const media = document.createElement('div');
  media.className = 'canon-hero-media';
  media.setAttribute('aria-hidden', 'true');

  const posterImage = picture?.querySelector('img') || standaloneImage;
  if (picture || standaloneImage) {
    const poster = document.createElement('div');
    poster.className = 'canon-hero-poster';
    if (posterImage) {
      posterImage.alt = '';
      posterImage.loading = 'eager';
      posterImage.setAttribute('fetchpriority', 'high');
    }
    poster.append(picture || standaloneImage);
    media.append(poster);
    block.classList.add('has-poster');
  }

  if (videoLink) {
    const video = document.createElement('video');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = Boolean(navigator.connection?.saveData);
    video.src = videoLink.href;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'none';
    video.tabIndex = -1;
    video.setAttribute('aria-hidden', 'true');
    if (posterImage?.currentSrc || posterImage?.src) {
      video.poster = posterImage.currentSrc || posterImage.src;
    }
    if (!reducedMotion && !saveData) video.autoplay = true;
    video.addEventListener('error', () => block.classList.add('video-error'));
    media.append(video);
    removeMediaLink(videoLink);
    block.classList.add('has-video');
  }

  block.classList.add('has-media');
  return media;
}

function createSignalField() {
  const field = document.createElement('div');
  field.className = 'canon-hero-signal';
  field.setAttribute('aria-hidden', 'true');

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 1600 900');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.setAttribute('focusable', 'false');

  const paths = [
    ['canon-hero-signal-ghost', 'M-120 710 C180 710 188 196 485 196 S770 705 1058 705 1335 332 1720 332'],
    ['canon-hero-signal-thread', 'M-120 710 C180 710 188 196 485 196 S770 705 1058 705 1335 332 1720 332'],
    ['canon-hero-signal-echo', 'M-100 758 C214 758 224 252 500 252 S797 758 1078 758 1368 388 1700 388'],
  ];

  paths.forEach(([className, pathData]) => {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('class', className);
    path.setAttribute('d', pathData);
    path.setAttribute('pathLength', '1');
    svg.append(path);
  });

  [
    [485, 196],
    [1058, 705],
    [1437, 332],
  ].forEach(([cx, cy], index) => {
    const node = document.createElementNS(SVG_NS, 'circle');
    node.setAttribute('class', `canon-hero-signal-node node-${index + 1}`);
    node.setAttribute('cx', cx);
    node.setAttribute('cy', cy);
    node.setAttribute('r', '7');
    svg.append(node);
  });

  field.append(svg);
  return field;
}

function moveRowContent(row, destination) {
  if (!row) return;
  const cells = [...row.children];
  const sources = cells.length ? cells : [row];
  sources.forEach((source) => {
    while (source.firstChild) destination.append(source.firstChild);
  });
}

function getTitle(row) {
  const authoredHeading = row?.querySelector('h1, h2, h3, h4, h5, h6');
  if (authoredHeading?.tagName === 'H1') return authoredHeading;

  const title = document.createElement('h1');
  if (authoredHeading) {
    while (authoredHeading.firstChild) title.append(authoredHeading.firstChild);
    authoredHeading.remove();
  } else {
    title.textContent = row?.textContent.trim() || 'The human is the durable state.';
    row?.replaceChildren();
  }
  return title;
}

/**
 * Decorates the founding inscription.
 * @param {HTMLElement} block authored canon hero block
 */
export default function decorate(block) {
  const media = extractMedia(block);
  const rows = [...block.children].filter((row) => (
    row.textContent.trim() || row.querySelector('img, picture, video')
  ));
  const content = document.createElement('div');
  content.className = 'canon-hero-content';

  const label = rows[0]?.querySelector('p') || document.createElement('p');
  if (!label.textContent.trim()) label.textContent = 'Continuity of Intent';
  label.className = 'canon-hero-label';

  const title = getTitle(rows[1]);
  if (!title.textContent.trim()) title.textContent = 'The human is the durable state.';
  title.classList.add('canon-hero-title');

  const deck = document.createElement('div');
  deck.className = 'canon-hero-deck';
  moveRowContent(rows[2], deck);

  const actions = document.createElement('div');
  actions.className = 'canon-hero-actions';
  moveRowContent(rows[3], actions);

  const extras = document.createElement('div');
  extras.className = 'canon-hero-extras';
  moveRowContent(rows[0], extras);
  moveRowContent(rows[1], extras);
  rows.slice(4).forEach((row) => moveRowContent(row, extras));

  const edition = document.createElement('p');
  edition.className = 'canon-hero-edition';
  edition.textContent = 'Founding edition · Public and amendable';

  content.append(label, title, deck);
  if (extras.hasChildNodes()) content.append(extras);
  content.append(actions, edition);

  const continuation = document.createElement('a');
  continuation.className = 'canon-hero-continuation';
  continuation.href = '#canon';
  continuation.textContent = 'Continue the argument';

  block.replaceChildren(...(media ? [media] : []), createSignalField(), content, continuation);
  window.requestAnimationFrame(() => block.classList.add('is-ready'));
}
