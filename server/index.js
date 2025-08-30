const express = require("express");
const app = express();
const PORT = 5000;
const cors = require("cors");
app.use(cors());
app.get("/", (req, res) => {
  res.send("Hello from backend!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
