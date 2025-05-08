const { execSync } = require("child_process");
const os = require("os");
const path = require("path");

const isWindows = os.platform() === "win32";

const backend_file_name = "app.py";

try {
  if (isWindows) {
    console.log("Starting backend on Windows...");

    const activateCmd = path.join(
      __dirname,
      "..",
      "venv",
      "Scripts",
      "activate"
    );
    execSync(`"${activateCmd}" && cd backend && python app.py`, {
      stdio: "inherit",
      shell: "cmd",
    });
  } else {
    console.log("Starting backend on Linux/macOS...");

    execSync(
      "source venv/bin/activate && cd backend && PYOPENGL_PLATFORM=glx python3 app.py",
      { stdio: "inherit", shell: "/bin/bash" }
    );
  }
  console.log("✅ Backend started successfully!");
} catch (error) {
  console.error("❌ Error running backend:", error);
  process.exit(1);
}
