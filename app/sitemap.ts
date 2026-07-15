import type { MetadataRoute } from "next";

const siteUrl = "https://kinetica-digital-joy-lab.netlify.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
