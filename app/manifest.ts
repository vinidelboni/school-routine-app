import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SomaMais — Escola e família",
    short_name: "SomaMais",
    description: "Rotina, comunicação e cuidado entre escola e família.",
    start_url: "/app/family",
    display: "standalone",
    background_color: "#020f32",
    theme_color: "#0759bd",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/somamais-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/somamais-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
