namespace P4.TinyCell.Shared.Utilities
{
    public static class TcDirector
    {
        public static void ParseArgs(string[] args)
        {
            if (args.Length < 1)
            {
                Console.WriteLine(
                    "Too few arguments provided. Please provide a source file and an output file. Example: tcc <source file>");
                Environment.Exit(0);
            }

            string workingDirectory = Environment.CurrentDirectory;
            var sourcceFilePath = args[0];

            if (Path.IsPathRooted(sourcceFilePath))
            {
                ArgsConfiguration.SourceFile = sourcceFilePath;
            }
            else
            {
                ArgsConfiguration.SourceFile = Path.Combine(workingDirectory, sourcceFilePath);
            }
            // if (Path.IsPathRooted(outputFilePath))
            // {
            // ArgsConfiguration.OutputFile = outputFilePath;
            // }
            // else
            // {
            //     ArgsConfiguration.outputFile = outputFilePath; //Path.Combine(workingDirectory, outputFilePath);
            // }
        }
    }
}