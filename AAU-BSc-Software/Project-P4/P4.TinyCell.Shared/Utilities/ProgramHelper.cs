using System.Diagnostics;
using System.IO.Compression;
using System.Runtime.InteropServices;
using System.Text.Json;
using ICSharpCode.SharpZipLib.GZip;
using ICSharpCode.SharpZipLib.Tar;

namespace P4.TinyCell.Shared.Utilities;

public class ProgramHelper
{
    public void GenerateAntlr()
    {
        try
        {
            string workingDirectory = Environment.CurrentDirectory;
            string projectDirectory = new DirectoryInfo(workingDirectory).FullName;

            string jarPath = Path.Combine(projectDirectory, "P4.TinyCell.Shared", "Antlr.jar");
            string grammarPath = Path.Combine(projectDirectory, "P4.TinyCell.Shared", "TinycellAntlr", "TinyCell.g4");

            string javaCommand = "java";
            string arguments = $"-jar {jarPath} -Dlanguage=CSharp {grammarPath} -visitor -listener";

            Process process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = javaCommand,
                    Arguments = arguments,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };

            process.Start();

            string output = process.StandardOutput.ReadToEnd();
            string errors = process.StandardError.ReadToEnd();

            process.WaitForExit();

            Console.WriteLine(output);
            if (!string.IsNullOrEmpty(errors))
            {
                Console.WriteLine("Errors:");
                Console.WriteLine(errors);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("An error occurred:");
            Console.WriteLine(ex.Message);
        }
    }

    private static readonly string ArduinoCliReleasesUrl =
        "https://api.github.com/repos/arduino/arduino-cli/releases/latest";

    public static async Task<string> FetchLatestArduinoCliDownloadUrlAsync()
    {
        using (var httpClient = new HttpClient())
        {
            httpClient.DefaultRequestHeaders.Add("User-Agent", "request");
            var response = await httpClient.GetStringAsync(ArduinoCliReleasesUrl);
            var releaseData = JsonDocument.Parse(response);
            var assets = releaseData.RootElement.GetProperty("assets");
            foreach (var asset in assets.EnumerateArray())
            {
                if (IsCorrectAssetForCurrentOs(asset.GetProperty("name").GetString()))
                {
                    return asset.GetProperty("browser_download_url").GetString();
                }
            }

            throw new InvalidOperationException("Compatible Arduino CLI asset not found for the current OS.");
        }
    }

    private static bool IsCorrectAssetForCurrentOs(string fileName)
    {
        Console.WriteLine($"Current OS: {RuntimeInformation.OSDescription}");

        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) && fileName.Contains("Windows_64bit.zip"))
            return true;
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux) && fileName.Contains("Linux_64bit.tar.gz"))
            return true;
        if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX) && fileName.Contains("macOS_64bit.tar.gz"))
            return true;

        return false;
    }

    public static async Task DownloadFileAsync(string url, string outputPath)
    {
        using (var httpClient = new HttpClient())
        using (var response = await httpClient.GetAsync(url))
        {
            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException("Failed to download the file.");

            using (var fs = new FileStream(outputPath, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                await response.Content.CopyToAsync(fs);
            }
        }

        if (Path.GetExtension(outputPath).Equals(".tar.gz", StringComparison.OrdinalIgnoreCase))
            ExtractTarGz(outputPath, Path.GetDirectoryName(outputPath));
        else if (Path.GetExtension(outputPath).Equals(".zip", StringComparison.OrdinalIgnoreCase))
            ExtractZip(outputPath, Path.GetDirectoryName(outputPath));
    }

    public static string GetCliFileName()
    {
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            return "arduino-cli_latest.zip";
        else
            return "arduino-cli_latest.tar.gz";
    }

    public static void ExtractFile(string filePath, string extractTo)
    {
        string fileExtension = Path.GetExtension(filePath);

        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) && fileExtension.Contains(".zip"))
        {
            ExtractZip(filePath, extractTo);
        }
        else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux) && fileExtension.Contains(".tar.gz"))
        {
            ExtractTarGz(filePath, extractTo);
        }
        else
        {
            ExtractTarGz(filePath, extractTo);
        }
    }

    private static void ExtractZip(string zipFilePath, string extractTo)
    {
        using (var zipArchive = ZipFile.OpenRead(zipFilePath))
        {
            zipArchive.ExtractToDirectory(extractTo, overwriteFiles: true);
        }
    }

    private static void ExtractTarGz(string gzArchiveName, string destFolder)
    {
        using (Stream inStream = File.OpenRead(gzArchiveName))
        using (Stream gzipStream = new GZipInputStream(inStream))
        {
            TarArchive tarArchive = TarArchive.CreateInputTarArchive(gzipStream);
            tarArchive.ExtractContents(destFolder);
            tarArchive.Close();
        }
    }
}