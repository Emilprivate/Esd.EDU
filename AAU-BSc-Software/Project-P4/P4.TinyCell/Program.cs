using System.Runtime.InteropServices;
using P4.TinyCell;
using P4.TinyCell.Shared.Utilities;

// dotnet publish -c Release -r win-x64 --self-contained true
// dotnet publish -c Release -r linux-x64 --self-contained true
// dotnet publish -c Release -r osx-x64 --self-contained true
// dotnet publish -c Release -r osx-arm64 --self-contained true

// dotnet add package SharpZipLib --version 1.3.3

internal class Program
{
    private static async Task Main(string[] args)
    {
        try
        {
            TcDirector.ParseArgs(args);
            string arduinoCliDir = "Arduino-CLI";
            if (!Directory.Exists(arduinoCliDir))
            {
                Directory.CreateDirectory(arduinoCliDir);
                Console.WriteLine("Created directory: Arduino-CLI");
            }

            string fileName = ProgramHelper.GetCliFileName();
            string cliFilePath = Path.Combine(arduinoCliDir, fileName);
            if (!File.Exists(cliFilePath))
            {
                Console.WriteLine("Arduino CLI not found, downloading...");
                string downloadUrl = await ProgramHelper.FetchLatestArduinoCliDownloadUrlAsync();
                await ProgramHelper.DownloadFileAsync(downloadUrl, cliFilePath);
                Console.WriteLine("Arduino CLI downloaded successfully!");

                ProgramHelper.ExtractFile(cliFilePath, arduinoCliDir);
                Console.WriteLine("Arduino CLI extracted successfully!");

                if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX) ||
                    RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
                {
                    CLIRunner.AddExecutePermission("Arduino-CLI/arduino-cli");
                    Console.WriteLine("Execute permission added to Arduino CLI.");
                }
            }
            else
            {
                Console.WriteLine("Arduino CLI already exists.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"An error occurred: {ex.Message}");
        }

        CLIRunner.ExecuteCommand("");
        CLIRunner runner = new CLIRunner();
        runner.CLIEnv();
    }
}