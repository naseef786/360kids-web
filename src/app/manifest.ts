import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "360 Kids Activity",
    short_name: "360 Kids",
    description: "Discover and request children's activities across Dubai.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFCF8",
    theme_color: "#F5A300",
    icons: [
      {
        src: "/brand/360-kids-logo.webp",
        sizes: "140x140",
        type: "image/webp",
      },
    ],
  };
}
