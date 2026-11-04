# Creates test-vulnerable-repo.zip for demo purposes
$source = ".\test-vulnerable-repo"
$dest = ".\test-vulnerable-repo.zip"

if (Test-Path $dest) { Remove-Item $dest }
Compress-Archive -Path $source\* -DestinationPath $dest
Write-Host "Created $dest for demo use"
