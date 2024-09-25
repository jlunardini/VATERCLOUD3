const express = require("express");
const app = express();
const port = process.env.PORT || 3001;
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");
const key = process.env.SUPABASE;
const supabase = createClient("https://qqkejnpaphzotjxgzknc.supabase.co", key);
const Mux = require("@mux/mux-node");

app.use(express.json());

app.get("/", (req, res) => res.type("html").send(html));

const server = app.listen(port, () =>
  console.log(`Example app listening on port ${port}!`)
);

app.post("/upload", async (req, res) => {
  const mux = new Mux();
  try {
    const up = await mux.video.uploads.create({
      new_asset_settings: {
        passthrough: req.body.postID,
        playback_policy: ["public"],
        encoding_tier: "baseline",
      },
    });
    res.json(up);
  } catch (error) {
    console.error("Error creating upload:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/webhook", async (req, res) => {
  const { eventType, eventData } = req.body;
  console.log(req.body);
  switch (eventType) {
    case "video.asset.created": {
      res.sendStatus(200);
      return;
    }
    case "video.asset.ready": {
      const id = eventData.playback_ids[0].id;
      const rowID = eventData.passthrough;
      console.log(eventData.playback_ids[0].id);
      const { data: pendingRowData, error: pendingRowError } = await supabase
        .from("posts_pending")
        .select("*")
        .eq("id", rowID);
      console.log(pendingRowData);
      const { error } = await supabase
        .from("posts")
        .update({ post_url: id })
        .eq("id", rowID);
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
