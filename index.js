const express = require("express");
const app = express();
const port = 8081;

app.get("/", (req, res) => {
  res.send("CMSC335 project running");
});

app.listen(port, () => {
  console.log(`App running and listening on port ${port}!`);
});
