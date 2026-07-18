/* eslint-env node */
/* eslint-disable no-console, global-require */

const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} = require('node:fs');
const { homedir } = require('node:os');
const { extname, join, resolve } = require('node:path');

const STAGE = resolve('.da/media-staging');
const POSTER = resolve(STAGE, 'continuity-hero-poster.webp');
const VIDEO = resolve(STAGE, 'continuity-hero-loop.mp4');
const MANIFEST = resolve(STAGE, 'manifest.json');
const POSTER_BRIEF = resolve('media/briefs/continuity-hero-poster.md');
const VIDEO_BRIEF = resolve('media/briefs/continuity-hero-video.md');
const PIPELINE = resolve('pipelines/grok-imagine-media.yaml');
const POSTER_RUN = resolve(STAGE, 'grok-poster-run.json');
const VIDEO_RUN = resolve(STAGE, 'grok-video-run.json');
const MEDIA_EXTENSIONS = new Set(['.mp4', '.webm', '.webp', '.jpg', '.jpeg', '.png']);

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8' }).trim();
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function relative(file) {
  return file.replace(`${process.cwd()}/`, '');
}

function assertCleanTrackedTree() {
  const dirty = run('git', ['status', '--porcelain', '--untracked-files=no']);
  if (dirty) throw new Error(`Tracked files changed during media generation:\n${dirty}`);
}

function findMisplacedMedia(dir = process.cwd()) {
  const found = [];
  readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    if (['.git', '.da', 'node_modules'].includes(entry.name)) return;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...findMisplacedMedia(path));
    else if (MEDIA_EXTENSIONS.has(extname(entry.name).toLowerCase())) found.push(relative(path));
  });
  return found;
}

function toolEvidence(runFile, toolName, required) {
  if (!existsSync(runFile) || statSync(runFile).size === 0) {
    if (required) throw new Error(`Missing Grok run receipt: ${relative(runFile)}`);
    return null;
  }
  const result = JSON.parse(readFileSync(runFile, 'utf8'));
  if (!result.sessionId) throw new Error(`Grok run receipt has no sessionId: ${relative(runFile)}`);
  const sessionDir = join(
    homedir(), '.grok', 'sessions', encodeURIComponent(process.cwd()), result.sessionId,
  );
  const updates = join(sessionDir, 'updates.jsonl');
  if (!existsSync(updates)) throw new Error(`Missing Grok session evidence: ${updates}`);
  const transcript = readFileSync(updates, 'utf8');
  const observed = transcript.includes(`\"name\":\"${toolName}\"`)
    || transcript.includes(`\"name\": \"${toolName}\"`);
  if (required && !observed) throw new Error(`Grok session ${result.sessionId} did not record ${toolName}`);
  return {
    receipt: relative(runFile),
    sessionId: result.sessionId,
    requiredTool: toolName,
    toolObserved: observed,
  };
}

function inspectPoster() {
  if (!existsSync(POSTER)) throw new Error(`Missing required poster: ${relative(POSTER)}`);
  const bytes = statSync(POSTER).size;
  if (bytes < 50 * 1024) throw new Error(`Poster is unexpectedly small: ${bytes} bytes`);
  if (bytes > 5 * 1024 * 1024) throw new Error(`Poster exceeds 5 MiB: ${bytes} bytes`);

  const [format, widthText, heightText] = run('magick', [
    'identify', '-format', '%m %w %h', POSTER,
  ]).split(/\s+/);
  const width = Number(widthText);
  const height = Number(heightText);
  const ratio = width / height;

  if (format.toUpperCase() !== 'WEBP') throw new Error(`Poster format is ${format}, expected WEBP`);
  if (width < 1920 || height < 1080) throw new Error(`Poster is ${width}x${height}, expected at least 1920x1080`);
  if (ratio < 1.76 || ratio > 1.79) throw new Error(`Poster aspect ratio is ${ratio.toFixed(4)}, expected 16:9`);

  return {
    path: relative(POSTER),
    route: '/media/continuity-hero-poster.webp',
    mime: 'image/webp',
    bytes,
    sha256: sha256(POSTER),
    width,
    height,
    aspectRatio: ratio,
  };
}

function topLevelMp4Atoms(buffer) {
  const atoms = [];
  let offset = 0;
  while (offset + 8 <= buffer.length) {
    let size = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    let headerSize = 8;
    if (size === 1) {
      if (offset + 16 > buffer.length) throw new Error('Truncated extended MP4 atom header');
      const extendedSize = buffer.readBigUInt64BE(offset + 8);
      if (extendedSize > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('MP4 atom exceeds safe parser size');
      size = Number(extendedSize);
      headerSize = 16;
    } else if (size === 0) {
      size = buffer.length - offset;
    }
    if (size < headerSize || offset + size > buffer.length) {
      throw new Error(`Invalid MP4 atom ${type} at byte ${offset}`);
    }
    atoms.push({ type, offset, size });
    offset += size;
  }
  return atoms;
}

function inspectVideo() {
  if (!existsSync(VIDEO)) return null;
  const bytes = statSync(VIDEO).size;
  if (bytes < 100 * 1024) throw new Error(`Video is unexpectedly small: ${bytes} bytes`);
  if (bytes > 25 * 1024 * 1024) throw new Error(`Video exceeds 25 MiB: ${bytes} bytes`);

  const probe = JSON.parse(run('ffprobe', [
    '-v', 'error', '-show_streams', '-show_format', '-of', 'json', VIDEO,
  ]));
  const videoStream = probe.streams.find((stream) => stream.codec_type === 'video');
  const audioStreams = probe.streams.filter((stream) => stream.codec_type === 'audio');
  if (!videoStream) throw new Error('MP4 has no video stream');
  if (audioStreams.length) throw new Error('Hero video must not contain an audio stream');

  const width = Number(videoStream.width);
  const height = Number(videoStream.height);
  const duration = Number(probe.format.duration);
  const ratio = width / height;
  const [rateNumerator, rateDenominator = '1'] = String(videoStream.avg_frame_rate).split('/');
  const frameRate = Number(rateNumerator) / Number(rateDenominator);
  const formatNames = String(probe.format.format_name || '').split(',');
  const atoms = topLevelMp4Atoms(readFileSync(VIDEO));
  const moovAtom = atoms.find((atom) => atom.type === 'moov');
  const mediaDataAtom = atoms.find((atom) => atom.type === 'mdat');

  if (![width, height, duration, ratio, frameRate].every(Number.isFinite)) {
    throw new Error('Video metadata contains a non-finite numeric value');
  }
  if (!formatNames.includes('mp4')) throw new Error(`Video container is ${probe.format.format_name}, expected mp4`);
  if (videoStream.codec_name !== 'h264') throw new Error(`Video codec is ${videoStream.codec_name}, expected h264`);
  if (videoStream.pix_fmt !== 'yuv420p') throw new Error(`Video pixel format is ${videoStream.pix_fmt}, expected yuv420p`);
  if (width < 1280 || height < 720) throw new Error(`Video is ${width}x${height}, expected at least 1280x720`);
  if (ratio < 1.76 || ratio > 1.79) throw new Error(`Video aspect ratio is ${ratio.toFixed(4)}, expected 16:9`);
  if (Math.min(Math.abs(duration - 6), Math.abs(duration - 10)) > 0.6) {
    throw new Error(`Video duration is ${duration.toFixed(2)}s, expected approximately 6s or 10s`);
  }
  if (frameRate < 20 || frameRate > 60) throw new Error(`Video frame rate is ${frameRate.toFixed(2)}, expected 20–60fps`);
  if (!moovAtom || !mediaDataAtom || moovAtom.offset > mediaDataAtom.offset) {
    throw new Error('MP4 is not fast-start optimized (moov atom must precede mdat)');
  }

  return {
    path: relative(VIDEO),
    route: '/media/continuity-hero-loop.mp4',
    mime: 'video/mp4',
    bytes,
    sha256: sha256(VIDEO),
    width,
    height,
    aspectRatio: ratio,
    durationSeconds: duration,
    codec: videoStream.codec_name,
    container: 'mp4',
    pixelFormat: videoStream.pix_fmt,
    frameRate,
    fastStart: true,
    audioStreams: 0,
  };
}

function promptRecord(file) {
  return { path: relative(file), sha256: sha256(file) };
}

function printPlan(video) {
  console.log('\nDA media preflight commands (no remote mutation):');
  console.log('da --org somarc --repo continuity-of-intent --branch canon content put /media/continuity-hero-poster.webp .da/media-staging/continuity-hero-poster.webp');
  if (video) {
    console.log('da --org somarc --repo continuity-of-intent --branch canon content put /media/continuity-hero-loop.mp4 .da/media-staging/continuity-hero-loop.mp4');
  }
  console.log('\nApproved mutation commands (run separately; never from the generation pipeline):');
  console.log('da --org somarc --repo continuity-of-intent --branch canon --commit content put /media/continuity-hero-poster.webp .da/media-staging/continuity-hero-poster.webp');
  if (video) {
    console.log('da --org somarc --repo continuity-of-intent --branch canon --commit content put /media/continuity-hero-loop.mp4 .da/media-staging/continuity-hero-loop.mp4');
  }
}

function main() {
  mkdirSync(STAGE, { recursive: true });
  assertCleanTrackedTree();
  const misplaced = findMisplacedMedia();
  if (misplaced.length) {
    throw new Error(`Generated media must remain under .da/media-staging:\n${misplaced.join('\n')}`);
  }
  const posterOnly = process.argv.includes('--poster-only');
  if (posterOnly && existsSync(VIDEO)) {
    throw new Error(`Poster-only validation refuses stale video: ${relative(VIDEO)}`);
  }
  const poster = inspectPoster();
  const video = posterOnly ? null : inspectVideo();
  const posterEvidence = toolEvidence(POSTER_RUN, 'image_gen', true);
  const videoEvidence = video ? toolEvidence(VIDEO_RUN, 'image_to_video', true) : null;
  const manifest = {
    schemaVersion: 'continuity-media.v1',
    generatedAt: new Date().toISOString(),
    trustBoundary: 'da-cli --riverboat-gambler / trusted local YAML',
    generator: run('/Users/mhess/.local/bin/grok', ['--version']),
    git: {
      branch: run('git', ['branch', '--show-current']),
      commit: run('git', ['rev-parse', 'HEAD']),
      dirty: false,
    },
    toolEvidence: [posterEvidence, ...(videoEvidence ? [videoEvidence] : [])],
    prompts: [promptRecord(POSTER_BRIEF), promptRecord(VIDEO_BRIEF)],
    pipeline: promptRecord(PIPELINE),
    files: [poster, ...(video ? [video] : [])],
    videoStatus: video ? 'validated' : 'not-present',
  };
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify(manifest, null, 2));
  if (process.argv.includes('--plan')) printPlan(video);
}

try {
  main();
} catch (error) {
  console.error(`Media validation failed: ${error.message}`);
  process.exitCode = 1;
}
