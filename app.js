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
      const rowID = data.passthrough;
      const videoID = data.playback_ids[0].id;
      const { data: pendingRowData, error: pendingRowError } = await supabase
        .from("posts_pending")
        .select("*")
        .eq("id", rowID)
        .single();
      const { data: workoutData, error: workoutError } = await supabase
        .from("workouts")
        .select("*")
        .eq("post_id", rowID)
        .single();
      const newRow = pendingRowData;
      newRow.post_url = videoID;
      delete newRow.id;
      const { data: newPostRowData, error: newPostRowError } = await supabase
        .from("posts")
        .insert(newRow)
        .select()
        .single();
      if (workoutError || pendingRowError || newPostRowError) {
        console.log(workoutError);
        console.log(pendingRowError);
        console.log(newPostRowError);
      } else {
        const { error: deletePendingError } = await supabase
          .from("posts_pending")
          .delete("*")
          .eq("id", rowID);
        if (pendingRowError) {
          console.log(deletePendingError);
        }
        if (workoutData) {
          workoutData.post_id = newPostRowData.id;
          const { data: workoutPostsData, error: workoutPostsError } =
            await supabase.from("workouts").insert(workoutData);
        }
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
