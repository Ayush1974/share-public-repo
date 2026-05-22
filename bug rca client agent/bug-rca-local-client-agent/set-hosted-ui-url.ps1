param(
  [Parameter(Mandatory = $true)]
  [string]$HostedUiBaseUrl
)

$ErrorActionPreference = "Stop"

function Normalize-BaseUrl {
  param(
    [string]$Value
  )

  $text = ""
  if (-not [string]::IsNullOrWhiteSpace($Value)) {
    $text = $Value.Trim()
  }
  if (-not $text) {
    throw "HostedUiBaseUrl cannot be empty."
  }

  if ($text -notmatch '^[a-z][a-z0-9+.-]*://') {
    $text = "http://$text"
  }

  $uri = [Uri]$text
  $builder = [System.UriBuilder]::new($uri)
  $builder.Path = ""
  $builder.Query = ""
  $builder.Fragment = ""
  return $builder.Uri.AbsoluteUri.TrimEnd("/")
}

$appDir = Split-Path -Parent $PSCommandPath
$configPath = Join-Path $appDir "ui-host-config.json"
$normalizedBaseUrl = Normalize-BaseUrl -Value $HostedUiBaseUrl

$config = @{
  uiBaseUrl = $normalizedBaseUrl
  autoOpenBrowser = $true
  pollTimeoutMs = 25000
}

Set-Content -LiteralPath $configPath -Value (($config | ConvertTo-Json -Depth 5) + [Environment]::NewLine) -Encoding UTF8

Write-Host ""
Write-Host "Updated hosted UI base URL:" -ForegroundColor Green
Write-Host "  $normalizedBaseUrl"
Write-Host ""
Write-Host "Hosted UI home:" -ForegroundColor Green
Write-Host "  $normalizedBaseUrl/home"
