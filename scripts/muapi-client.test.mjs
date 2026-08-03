import assert from "node:assert/strict";
import test from "node:test";

import { extractOutputUrl } from "./muapi-client.mjs";

test("extractOutputUrl prefers generated videos over uploaded input URLs", () => {
  const result = {
    status: "completed",
    data: {
      payload: {
        image_url: "https://cdn.example.com/input-frame.png",
      },
    },
    outputs: [
      {
        url: "https://cdn.example.com/generated-scene.mp4",
      },
    ],
  };

  assert.equal(
    extractOutputUrl(result, { kind: "video" }),
    "https://cdn.example.com/generated-scene.mp4",
  );
});

test("extractOutputUrl accepts nested video_url envelopes", () => {
  const result = {
    status: "succeeded",
    result: {
      asset: {
        video_url: "https://cdn.example.com/final.webm?token=abc",
      },
    },
  };

  assert.equal(
    extractOutputUrl(result, { kind: "video" }),
    "https://cdn.example.com/final.webm?token=abc",
  );
});
