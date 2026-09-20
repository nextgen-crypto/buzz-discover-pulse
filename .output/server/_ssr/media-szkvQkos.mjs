//#region node_modules/.nitro/vite/services/ssr/assets/media-szkvQkos.js
var RENDITION_WIDTH = {
	thumbnail: 200,
	small: 400,
	medium: 800,
	large: 1280,
	original: 1920
};
var CDN_BASE = "https://picsum.photos/seed";
function hashKey(objectKey) {
	return encodeURIComponent(objectKey.replace(/[^a-zA-Z0-9]/g, "-"));
}
/** Resolve an image object key to a CDN URL at the requested rendition. */
function imageUrl(objectKey, rendition = "medium", aspect = 1) {
	const w = RENDITION_WIDTH[rendition];
	const h = Math.max(1, Math.round(w / aspect));
	return `${CDN_BASE}/${hashKey(objectKey)}/${w}/${h}`;
}
/** Low-cost LQIP used behind progressive image loading. */
function placeholderUrl(objectKey) {
	return `${CDN_BASE}/${hashKey(objectKey)}/20/20`;
}
/** Responsive srcset so the device picks the cheapest adequate rendition. */
function imageSrcSet(objectKey, aspect = 1) {
	return [
		"small",
		"medium",
		"large"
	].map((r) => `${imageUrl(objectKey, r, aspect)} ${RENDITION_WIDTH[r]}w`).join(", ");
}
/**
* Video delivery. Object keys resolve to compressed, CDN-hosted renditions;
* originals are never streamed to clients.
*/
function videoUrl(objectKey) {
	return objectKey.startsWith("http") ? objectKey : `https://cdn.buzz.app/${objectKey}`;
}
//#endregion
export { videoUrl as i, imageUrl as n, placeholderUrl as r, imageSrcSet as t };
