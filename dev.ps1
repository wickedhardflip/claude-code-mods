# Launch Claude Code with every mod in this folder loaded (hot-reloads on save).
# Usage: .\mods\dev.ps1            -> all mods
#        .\mods\dev.ps1 first-mod  -> just the named mods
param([string[]]$Only)
$mods = Get-ChildItem -Directory $PSScriptRoot |
  Where-Object { Test-Path (Join-Path $_.FullName '.claude-plugin\plugin.json') } |
  Where-Object { -not $Only -or $Only -contains $_.Name }
$pluginArgs = $mods | ForEach-Object { '--plugin-dir'; $_.FullName }
Write-Host "Loading mods: $($mods.Name -join ', ')"
claude @pluginArgs
