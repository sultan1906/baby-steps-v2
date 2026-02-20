import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Baby Steps",
    short_name: "Baby Steps",
    description: "Capture every milestone of your baby's first year",
    start_url: "/",
    display: "standalone",
    background_color: "#FCFAF7",
    theme_color: "#f06292",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
