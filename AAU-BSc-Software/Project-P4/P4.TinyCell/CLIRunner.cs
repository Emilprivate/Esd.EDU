using System.Diagnostics;
using Antlr4.Runtime;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree;
using P4.TinyCell.Shared.Language.CodeGen;
using P4.TinyCell.Shared.Language.Typechecking;
using P4.TinyCell.Shared.Utilities;

namespace P4.TinyCell;

public class CLIRunner
{
    public static void AddExecutePermission(string filePath)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = "/bin/bash",
            Arguments = $"-c \"chmod +x {filePath}\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        using (var process = new Process { StartInfo = startInfo })
        {
            process.Start();
            process.WaitForExit();

            if (process.ExitCode != 0)
            {
                var errorMessage = process.StandardError.ReadToEnd();
                throw new Exception($"Failed to add execute permission: {errorMessage}");
            }
        }
    }

    public void CLIEnv()
    {
        string board = "";
        string port = "";

        string command = Console.ReadLine();
        Console.WriteLine("\n");
        switch (command)
        {
            case "compile":
                CompileTC();
                Console.WriteLine(
                    "tcc>> What board would you like to target? (Unsure? Use a board that appears under the 'board list' command)\n");
                board = Console.ReadLine();
                CLIRunner.ExecuteCommand($"compile ./Arduino/Arduino.ino -b {board} --build-path ArduinoCompiled");
                Thread.Sleep(2500);
                CLIRunner.ExecuteCommand("");
                break;
            case "upload":
                CompileTC();
                Console.WriteLine(
                    "tcc>> What board would you like to target? (Unsure? Use the FQBN that appears under the 'board list' command)\n");
                board = Console.ReadLine();
                Console.WriteLine(
                    "tcc>> Which port would you like to target? (Unsure? Use one that is connected to your board)\n");
                port = Console.ReadLine();
                CLIRunner.ExecuteCommand(
                    $"upload -p {port} --fqbn {board} ./Arduino/Arduino.ino --input-dir ArduinoCompiled");
                Thread.Sleep(2500);
                CLIRunner.ExecuteCommand("");
                break;
            case "monitor":
                Console.WriteLine("tcc>> Which board (port) would you like to listen to?");
                port = Console.ReadLine();
                CLIRunner.ExecuteCommand($"monitor -p {port}");
                break;
            default:
                ExecuteCommand(command);
                break;
        }

        CLIEnv();
    }

    public void CompileTC()
    {
        string workingDirectory = Environment.CurrentDirectory;

        string fileContent = File.ReadAllText(ArgsConfiguration.SourceFile);

        var antlrInputStream = new AntlrInputStream(fileContent);

        var lexer = new TinyCellLexer(antlrInputStream);

        var tokenStream = new CommonTokenStream(lexer);

        tokenStream.Fill();

        var tokens = tokenStream.GetTokens();
#if DEBUG
        foreach (var token in tokens)
        {
            int tokenType = token.Type - 1;
            string ruleName = tokenType >= 0 && tokenType < TinyCellLexer.ruleNames.Length
                ? TinyCellLexer.ruleNames[tokenType]
                : "Unknown";
            Console.WriteLine(token + " | " + ruleName + " | " + token.Text);
        }

#endif
        var parser = new TinyCellParser(tokenStream);

        parser.AddErrorListener(new ParserHelper.NoErrorListener());

        var tree = parser.document();
#if DEBUG
        Console.WriteLine("\n=================================================\n");
        Console.WriteLine("Tokens:");

        foreach (var token in tokens)
        {
            int tokenType = token.Type - 1;
            string ruleName = tokenType >= 0 && tokenType < TinyCellLexer.ruleNames.Length
                ? TinyCellLexer.ruleNames[tokenType]
                : "Unknown";
            Console.WriteLine(token + " | " + ruleName + " | " + token.Text);
        }

        Console.WriteLine("\n=================================================\n");
        Console.WriteLine("Parse Tree:");

        ParserHelper.PrintTree(tree);
#endif
        AstBuilderVisitor astBuilderVisitor = new();
        AstNode abcd = astBuilderVisitor.Visit(tree);
#if DEBUG
        Console.WriteLine(abcd.ToString());
#endif
        var typeChecker = new TypeCheckerVisitor();
        typeChecker.Visit(abcd);

        TestAstVisitor test = new();
        test.VisitRootNode((RootNode)abcd);

        CGeneratorVisitor cGeneratorVisitor = new();
        string ccode = cGeneratorVisitor.Visit(abcd);

        try
        {
            string arduinoDir = "Arduino";
            if (!Directory.Exists(arduinoDir))
            {
                Directory.CreateDirectory(arduinoDir);
                Console.WriteLine("Created directory: Arduino");
            }

            using StreamWriter sw = File.CreateText($"Arduino/Arduino.ino");
            sw.Write(ccode);
#if DEBUG
            Console.WriteLine(ccode);
#endif
        }
        catch (Exception ex)
        {
            Console.WriteLine($"An error occurred: {ex.Message}");
        }
    }

    public static void ExecuteCommand(string command)
    {
        Console.WriteLine("\n");
        var processInfo = new ProcessStartInfo("Arduino-CLI/arduino-cli", command)
        {
            CreateNoWindow = true,
            UseShellExecute = false,
            RedirectStandardError = true,
            RedirectStandardOutput = true
        };
        //processInfo.WorkingDirectory = Environment.CurrentDirectory+"/Arduino-CLI/";
        var process = Process.Start(processInfo);

        process.OutputDataReceived += (object sender, DataReceivedEventArgs e) =>
            Console.WriteLine("tcc> " + e.Data);
        process.BeginOutputReadLine();

        process.ErrorDataReceived += (object sender, DataReceivedEventArgs e) =>
            Console.WriteLine("tcc error> " + e.Data);
        process.BeginErrorReadLine();

        process.WaitForExit();

        process.Close();
        Console.WriteLine("\n");
    }
}