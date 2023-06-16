# Directory of project relative to this script.
$projectDir = "$PSScriptRoot/.."

# Bin directory relative to project.
$binDir = "../bin"

Invoke-Expression -Command "cd $projectDir"
Invoke-Expression -Command "./gradlew bootRun --args='--spring.profiles.active=dev,local --logging.file.path=$binDir/logs --temp.path=$binDir/temp --exporting.path=$binDir/exported'"
