const { execSync } = require("child_process");
const os = require("os");

const pythonVersion = "3.10.13";

const isWindows = os.platform() === "win32";

try {
  if (isWindows) {
    execSync(`pyenv local ${pythonVersion} && python -m venv venv`, {
      stdio: "inherit",
      shell: "cmd",
    });
  } else {
    execSync(
      `pyenv local ${pythonVersion} && $(pyenv which python) -m venv venv`,
      {
        stdio: "inherit",
        shell: "/bin/bash",
      }
    );
  }
  console.log("Virtual environment created successfully!");
} catch (error) {
  console.error("Error creating virtual environment:", error);
  process.exit(1);
}
