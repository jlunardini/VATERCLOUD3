const express = require("express");
const app = express();
const port = process.env.PORT || 3001;
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");
const key = process.env.SUPABASE;
const supabase = createClient("https://qqkejnpaphzotjxgzknc.supabase.co", key);

app.get("/", (req, res) => res.type("html").send(html));

const server = app.listen(port, () =>
  console.log(`Example app listening on port ${port}!`)
);

app.post("/upload", async (req, res) => {
  if (!req.body || typeof req.body.postID === "undefined") {
    return res.status(400).json({ error: "postID is required" });
  }
  try {
    const up = await muxInstance.video.uploads.create({
      new_asset_settings: {
        passthrough: req.body.postID,
        playback_policy: ["public"],
        encoding_tier: "baseline",
      },
    });
    console.log(up);
    res.json(up);
  } catch (error) {
    console.error("Error creating upload:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/webhook", async (req, res) => {
  const { eventType, eventData } = req.body;
  switch (eventType) {
    case "video.asset.created": {
      res.sendStatus(200);
      return;
    }
    case "video.asset.ready": {
      console.log("Ready");
      console.log(eventData.status);
      const id = eventData.playback_ids[0].id;
      console.log(eventData.playback_ids[0].id);
      const { error } = await supabase
        .from("posts")
        .update({ post_url: id })
        .eq("id", eventData.passthrough);
      if (error) {
        console.log(error);
      }
      res.sendStatus(200);
      return;
    }
    default:
      console.log("some other mux event! " + eventType);
      res.sendStatus(200);
  }
});

const html = `<div>Hello World</div>`;

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
