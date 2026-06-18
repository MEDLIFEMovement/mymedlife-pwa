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
    background_color: "#07110e",
    theme_color: "#52c7ab",
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
