# Define the project directory relative to the script location
$projectDir = "P4.TinyCell"
$config = "Release"
$outputDir = "..\publish"
$runtimes = @("win-x64", "linux-x64", "osx-x64", "osx-arm64")

# Check if the project directory exists
if (-Not (Test-Path $projectDir)) {
    Write-Host "Project directory $projectDir does not exist."
    exit 1
}

# Create the output directory if it does not exist
if (-Not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# Navigate to the project directory
Set-Location $projectDir

# Publish for each runtime
foreach ($runtime in $runtimes) {
    Write-Host "Publishing for $runtime..."
    dotnet publish -c $config -r $runtime --self-contained $false -o "$outputDir\$runtime"
    if ($?) {
        Write-Host "Successfully published for $runtime."
    } else {
        Write-Host "Failed to publish for $runtime."
        exit 1
    }
}

Write-Host "All publications completed."
