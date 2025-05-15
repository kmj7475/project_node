const express = require("express");
const path = require("path");
const app = express();
const port = 3000;

app.use(express.static("public"));

app.get("/", function (req, res, next) {
  res.sendFile(path.join(__dirname, "./public", "index.html"));
});

app.get("/hello", (req, res) => {
  console.log(req.url);
  res.send("Hello World!");
});

app.get("/api/board", (req, res) => {
  res.send({ title: "Hello World!" });
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "./public", "index.html"));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
