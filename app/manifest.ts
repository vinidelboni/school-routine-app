import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SomaMais — Escola e família",
    short_name: "SomaMais",
    description: "Rotina, comunicação e cuidado entre escola e família.",
    start_url: "/app/family",
    display: "standalone",
    background_color: "#f7f5ef",
    theme_color: "#315645",
    orientation: "portrait",
  };
}
