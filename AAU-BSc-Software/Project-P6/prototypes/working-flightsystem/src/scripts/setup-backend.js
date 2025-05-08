const { execSync } = require("child_process");
const os = require("os");
const path = require("path");

const isWindows = os.platform() === "win32";

try {
  if (isWindows) {
    console.log("Setting up backend on Windows...");

    const activateCmd = path.join(
      __dirname,
      "..",
      "venv",
      "Scripts",
      "activate"
    );
    execSync(
      `"${activateCmd}" && python -m pip install --upgrade pip setuptools wheel && cd backend && python -m pip install -r requirements.txt`,
      { stdio: "inherit", shell: "cmd" }
    );
  } else {
    console.log("Setting up backend on Linux/macOS...");
    execSync(
      "source venv/bin/activate && pip install --upgrade pip setuptools wheel && cd backend && pip install -r requirements.txt",
      { stdio: "inherit", shell: "/bin/bash" }
    );
  }
  console.log("✅ Backend setup completed successfully!");
} catch (error) {
  console.error("❌ Error setting up backend:", error);
  process.exit(1);
}
