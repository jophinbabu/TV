const fs = require("fs");
const path = require("path");

const output = path.join(__dirname, "..", "dist");
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(path.join(output, "src", "Asset", "images"), { recursive: true });
fs.copyFileSync(path.join(__dirname, "..", "test_report.html"), path.join(output, "index.html"));
fs.copyFileSync(
  path.join(__dirname, "..", "src", "Asset", "images", "download.png"),
  path.join(output, "src", "Asset", "images", "download.png"),
);
