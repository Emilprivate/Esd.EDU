using System.ComponentModel;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace P4.TinyCell.Tests.AcceptanceTests;

public class CompilerExecutionFlow
{
    [Fact]
    [Description(
        "Tests the full compilation flow from executing the TinyCell compiler to generating Arduino C that includes manual command input.")]
    public async Task FullCompilationExecution()
    {
        string workingDirectory = Environment.CurrentDirectory;
        string netDirectory = new DirectoryInfo(workingDirectory).FullName;

        Assert.True(Directory.Exists(netDirectory));

        string arduinoFolder = Path.Combine(netDirectory, "Arduino");
        string arduinoCliFolder = Path.Combine(netDirectory, "Arduino-CLI");

        string executableFileName = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? "tcc.exe" : "tcc";
        string tccExecutablePath = Path.Combine(netDirectory, executableFileName);
        string sourceFilePath = Path.Combine(netDirectory, "Test.tc");
        string expectedOutputPath = Path.Combine(netDirectory, arduinoFolder);

        File.WriteAllText(sourceFilePath, @"
        include default.tcl;
        dpin ledPin = 6;

        setup {
            set ledPin to OUTPUT;
        }

        update {
            write HIGH to ledPin;
            delay(1000);
            write LOW to ledPin;
            delay(1000);
        }
    ");

        ProcessStartInfo startInfo = new ProcessStartInfo
        {
            FileName = tccExecutablePath,
            Arguments = $"\"{sourceFilePath}\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            RedirectStandardInput = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using (Process process = new Process { StartInfo = startInfo })
        {
            process.Start();

            var outputReadTask = process.StandardOutput.ReadToEndAsync();
            var errorReadTask = process.StandardError.ReadToEndAsync();

            using (StreamWriter sw = process.StandardInput)
            {
                if (sw.BaseStream.CanWrite)
                {
                    await sw.WriteLineAsync("compile");
                }
            }

            if (!process.WaitForExit(5000))
            {
                process.Kill();
            }

            string output = await outputReadTask;
            string errors = await errorReadTask;
        }

        foreach (var process in Process.GetProcessesByName("arduino-cli"))
        {
            process.Kill();
            process.WaitForExit();
        }

        Assert.True(Directory.Exists(arduinoFolder));
        Assert.True(Directory.Exists(arduinoCliFolder));
        Assert.True(File.Exists(Path.Combine(expectedOutputPath, "Arduino.ino")));

        string outputContent = File.ReadAllText(Path.Combine(expectedOutputPath, "Arduino.ino"));
        Assert.Contains("pinMode(ledPin, OUTPUT);", outputContent);
        Assert.Contains("digitalWrite(ledPin, HIGH);", outputContent);
        Assert.Contains("digitalWrite(ledPin, LOW);", outputContent);
        Assert.Contains("delay(1000);", outputContent);

        File.Delete(sourceFilePath);
        Directory.Delete(arduinoFolder, recursive: true);
        Directory.Delete(arduinoCliFolder, recursive: true);
    }
}