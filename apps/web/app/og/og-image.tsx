import { ImageResponse } from "next/og";

export { getPageTitle } from "@/lib/page-titles";

function createOgImage(title: string) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "black",
        padding: "60px 80px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <svg width="36" height="36" viewBox="0 0 16 16" fill="white">
          <path fillRule="evenodd" clipRule="evenodd" d="M8 1L16 15H0L8 1Z" />
        </svg>
        <span
          style={{
            fontSize: 36,
            color: "#666",
            fontFamily: "sans-serif",
            fontWeight: 400,
          }}
        >
          /
        </span>
        <span
          style={{
            fontSize: 36,
            fontFamily: "monospace",
            fontWeight: 400,
            color: "white",
          }}
        >
          api-emulator
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {title.split("\n").map((line, i) => (
          <span
            key={i}
            style={{
              fontSize: 72,
              fontFamily: "sans-serif",
              fontWeight: 400,
              color: "white",
              letterSpacing: "-0.02em",
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            {line}
          </span>
        ))}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}

export async function renderOgImage(title: string) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const image = createOgImage(title);
      const body = await image.arrayBuffer();

      return new Response(body, {
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
          "Content-Type": "image/png",
        },
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}
