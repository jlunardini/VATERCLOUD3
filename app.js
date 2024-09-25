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
  const { type, data } = req.body;
  switch (type) {
    case "video.asset.created": {
      res.sendStatus(200);
      return;
    }
    case "video.asset.ready": {
      console.log(data);
      const id = data.playback_ids[0].id;
      const rowID = data.passthrough;
      const videoID = data.playback_ids[0].id;
      const { data: pendingRowData, error: pendingRowError } = await supabase
        .from("posts_pending")
        .select("*")
        .eq("id", rowID)
        .single();
      const newRowData = pendingRowData;
      newRowData.post_url = videoID;
      console.log(newRowData);
      const { error } = await supabase.from("posts").insert(newRowData);
      if (error) {
        console.log(error);
      }
      res.sendStatus(200);
      return;
    }
    default:
      console.log("some other mux event! " + type);
      res.sendStatus(200);
  }
});

const html = `<div>Hello World</div>`;

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
