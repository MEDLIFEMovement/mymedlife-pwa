import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "myMEDLIFE",
    short_name: "myMEDLIFE",
    description:
      "Mobile-first MEDLIFE chapter operating system for campaigns, action committees, proof, points, KPIs, and coach decisions.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fbff",
    theme_color: "#2563eb",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icons/my-medlife-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
