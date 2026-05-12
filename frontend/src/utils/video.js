/**
 * Robustly extracts the YouTube Video ID from any valid YouTube URL.
 * Handles:
 * - standard: youtube.com/watch?v=ID
 * - short: youtu.be/ID
 * - embed: youtube.com/embed/ID
 * - shorts: youtube.com/shorts/ID
 * - mobile: m.youtube.com/watch?v=ID
 * @param {string} url 
 * @returns {string|null}
 */
export function extractYoutubeId(url) {
  if (!url) return null;
  
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  
  return match ? match[1] : null;
}

/**
 * Returns the embed URL for a given YouTube video URL.
 * @param {string} url 
 * @returns {string|null}
 */
export function getYoutubeEmbedUrl(url) {
  const id = extractYoutubeId(url);
  if (!id) return null;
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
}

/**
 * Returns true if the URL points to an MP4 video file.
 * @param {string} url 
 * @returns {boolean}
 */
export function isMp4Url(url) {
  if (!url) return false;
  return url.match(/\.mp4(\?|#|$)/i) !== null;
}
