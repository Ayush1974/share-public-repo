param(
  [string]$Target = "gbujira",
  [string]$EnvFile = ".env",
  [string]$CurrentTokenExpiresAt = "",
  [string]$Token = ""
)

$ErrorActionPreference = "Stop"

function Resolve-AbsolutePath {
  param(
    [string]$BaseDir,
    [string]$CandidatePath
  )

  if ([System.IO.Path]::IsPathRooted($CandidatePath)) {
    return $CandidatePath
  }

  return Join-Path $BaseDir $CandidatePath
}

function Resolve-TargetEnvVarName {
  param([string]$TargetName)

  switch (([string]$TargetName).Trim().ToLowerInvariant()) {
    "gbu" { return "GBUJIRA_PERSONAL_TOKEN" }
    "gbujira" { return "GBUJIRA_PERSONAL_TOKEN" }
    "central" { return "JIRA_CENTRAL_PERSONAL_TOKEN" }
    "oci" { return "JIRA_OCI_PERSONAL_TOKEN" }
    default { throw "Unsupported Jira target: $TargetName" }
  }
}

function ConvertTo-PlainText {
  param([Security.SecureString]$SecureValue)

  if ($null -eq $SecureValue) {
    return ""
  }

  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

function Escape-RegExp {
  param([string]$Value)

  return [Regex]::Escape([string]$Value)
}

function Update-EnvFileValue {
  param(
    [string]$Path,
    [string]$Key,
    [string]$Value
  )

  $existingContent = ""
  if (Test-Path -LiteralPath $Path) {
    $existingContent = [System.IO.File]::ReadAllText($Path)
  }

  $normalized = $existingContent -replace "`r`n", "`n"
  $lines = if ($normalized.Length -gt 0) { $normalized -split "`n", 0, "SimpleMatch" } else { @() }
  $pattern = "^\s*(?:export\s+)?{0}\s*=.*$" -f (Escape-RegExp -Value $Key)
  $replaced = $false
  $nextLines = New-Object System.Collections.Generic.List[string]

  foreach ($line in $lines) {
    if (-not $replaced -and -not $line.TrimStart().StartsWith("#") -and $line -match $pattern) {
      $nextLines.Add(("{0}={1}" -f $Key, $Value))
      $replaced = $true
      continue
    }

    $nextLines.Add($line)
  }

  if (-not $replaced) {
    while ($nextLines.Count -gt 0 -and $nextLines[$nextLines.Count - 1] -eq "") {
      $nextLines.RemoveAt($nextLines.Count - 1)
    }

    $nextLines.Add(("{0}={1}" -f $Key, $Value))
  }

  [System.IO.File]::WriteAllText($Path, ($nextLines -join "`n") + "`n")
}

function Read-ExpiryTimestamp {
  param([string]$CurrentValue)

  if (-not [string]::IsNullOrWhiteSpace($CurrentValue)) {
    [DateTimeOffset]::Parse($CurrentValue) | Out-Null
    return $CurrentValue
  }

  $prompt = "Enter the new PAT expiry in ISO-8601 format (example: 2026-05-14T23:44:52-07:00)"
  $enteredValue = Read-Host $prompt
  if ([string]::IsNullOrWhiteSpace($enteredValue)) {
    throw "PAT expiry is required."
  }

  [DateTimeOffset]::Parse($enteredValue) | Out-Null
  return $enteredValue
}

$appDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$envFilePath = Resolve-AbsolutePath -BaseDir $appDir -CandidatePath $EnvFile
$envVarName = Resolve-TargetEnvVarName -TargetName $Target
$expiryTimestamp = Read-ExpiryTimestamp -CurrentValue $CurrentTokenExpiresAt

if ([string]::IsNullOrWhiteSpace($Token)) {
  $Token = ConvertTo-PlainText -SecureValue (Read-Host "Paste the new Jira PAT" -AsSecureString)
}

if ([string]::IsNullOrWhiteSpace($Token)) {
  throw "A non-empty Jira PAT is required."
}

Update-EnvFileValue -Path $envFilePath -Key $envVarName -Value $Token
Write-Host ("Updated {0} in {1}." -f $envVarName, $envFilePath) -ForegroundColor Green

$updaterPath = Join-Path $PSScriptRoot "update-jira-pat.ps1"
& $updaterPath -Target $Target -EnvFile $EnvFile -CurrentTokenExpiresAt $expiryTimestamp

Remove-Variable Token -ErrorAction SilentlyContinue
