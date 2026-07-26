"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main
          id="main-content"
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            background: "#08080d",
            color: "#f7f3ff",
            textAlign: "center",
          }}
        >
          <div>
            <p style={{ color: "#b66cff", letterSpacing: "0.18em" }}>
              ANIVERSE RECOVERY
            </p>
            <h1>This universe hit a temporary fault.</h1>
            <p>
              Your account and watch progress are safe. Try loading it again.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: "16px",
                border: 0,
                borderRadius: "8px",
                padding: "12px 18px",
                background: "#a45fff",
                color: "white",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
