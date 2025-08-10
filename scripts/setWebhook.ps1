param(
  [Parameter(Mandatory=$true)][string]$Token,
  [Parameter(Mandatory=$true)][string]$BaseUrl,
  [string]$Secret
)

Write-Host "== Configurando webhook ==" -ForegroundColor Cyan
if (-not $Token) { Write-Error "Falta -Token"; exit 1 }
if (-not $BaseUrl) { Write-Error "Falta -BaseUrl"; exit 1 }

# Normalizar BaseUrl (quitar slash final)
if ($BaseUrl.EndsWith('/')) { $BaseUrl = $BaseUrl.TrimEnd('/') }

$webhook = if ($Secret) { "$BaseUrl/webhook?secret=$Secret" } else { "$BaseUrl/webhook" }

Write-Host "Webhook URL: $webhook" -ForegroundColor Yellow

$setUrl = "https://api.telegram.org/bot$Token/setWebhook?url=$($webhook)"

try {
  $resp = Invoke-RestMethod -Uri $setUrl -Method Get -ErrorAction Stop
  Write-Host "Respuesta setWebhook: $(ConvertTo-Json $resp -Depth 5)" -ForegroundColor Green
} catch {
  Write-Error "Error en setWebhook: $_"
  exit 1
}

Start-Sleep -Seconds 1

try {
  $info = Invoke-RestMethod -Uri "https://api.telegram.org/bot$Token/getWebhookInfo" -Method Get -ErrorAction Stop
  Write-Host "WebhookInfo:" -ForegroundColor Cyan
  $info | ConvertTo-Json -Depth 8
} catch {
  Write-Error "Error obteniendo getWebhookInfo: $_"
  exit 1
}

Write-Host "== Listo ==" -ForegroundColor Cyan
