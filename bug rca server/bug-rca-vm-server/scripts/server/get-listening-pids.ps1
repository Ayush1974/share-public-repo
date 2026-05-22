param(
  [int]$Port = 3210
)

$ErrorActionPreference = "SilentlyContinue"

$seen = @{}
$netstatOutput = & netstat -ano -p tcp 2>$null

foreach ($line in @($netstatOutput)) {
  $trimmed = [string]$line
  if ([string]::IsNullOrWhiteSpace($trimmed)) {
    continue
  }

  $parts = $trimmed.Trim() -split '\s+'
  if ($parts.Length -lt 5) {
    continue
  }

  if ($parts[0].ToUpperInvariant() -ne "TCP") {
    continue
  }

  if ($parts[3].ToUpperInvariant() -ne "LISTENING") {
    continue
  }

  $localAddress = $parts[1]
  if ($localAddress -notmatch ':(\d+)$') {
    continue
  }

  if ([int]$matches[1] -ne $Port) {
    continue
  }

  $pid = 0
  if (-not [int]::TryParse($parts[4], [ref]$pid)) {
    continue
  }

  if ($pid -le 0 -or $seen.ContainsKey($pid)) {
    continue
  }

  $seen[$pid] = $true
  Write-Output $pid
}
