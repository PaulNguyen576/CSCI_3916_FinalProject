const { spawn } = require("node:child_process");

const port = process.env.PORT || "3000";
const nextBin = require.resolve("next/dist/bin/next");

const child = spawn(process.execPath, [nextBin, "start", "-H", "0.0.0.0", "-p", port], {
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});