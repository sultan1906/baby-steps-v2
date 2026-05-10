/**
 * Generates a JPEG poster (first-frame thumbnail) from a video File.
 *
 * Renders the video off-DOM, seeks to a tiny offset to force iOS WebKit to
 * decode and paint a frame, then captures it via canvas. Returns null if the
 * browser can't decode the video (e.g. unsupported codec); callers should
 * upload the video without a poster in that case.
 */
export async function generateVideoPoster(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.src = url;

    let settled = false;
    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
    };
    const finish = (result: Blob | null) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    // Hard timeout — some codecs hang indefinitely on unsupported devices.
    const timeout = setTimeout(() => finish(null), 10_000);

    video.addEventListener("loadedmetadata", () => {
      // Seeking to 0 doesn't always trigger a frame decode; a tiny offset does.
      video.currentTime = Math.min(0.001, (video.duration || 1) / 2);
    });

    video.addEventListener("seeked", () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        if (!canvas.width || !canvas.height) {
          clearTimeout(timeout);
          finish(null);
          return;
        }
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          clearTimeout(timeout);
          finish(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            clearTimeout(timeout);
            finish(blob ?? null);
          },
          "image/jpeg",
          0.85
        );
      } catch {
        clearTimeout(timeout);
        finish(null);
      }
    });

    video.addEventListener("error", () => {
      clearTimeout(timeout);
      finish(null);
    });
  });
}
