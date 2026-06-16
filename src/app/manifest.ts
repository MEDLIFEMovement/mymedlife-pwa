import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "myMEDLIFE",
    short_name: "myMEDLIFE",
    description:
      "Mobile-first MEDLIFE chapter operating system for campaigns, action committees, proof, points, KPIs, and coach decisions.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#07110e",
    theme_color: "#52c7ab",
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
