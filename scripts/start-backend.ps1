param(
    [string]$Python = 'C:\Users\DELL\PycharmProjects\PythonProjectfyp\.venv\Scripts\python.exe',
    [int]$Port = 8001,
    [string]$Database = 'FootyJugaadLegacyDB'
)
$ErrorActionPreference = 'Stop'
$BackendRoot = Join-Path $PSScriptRoot '..\backend_jugaad'
if (!(Test-Path -LiteralPath $Python)) { throw "Python environment not found: $Python" }
if (!(Test-Path -LiteralPath (Join-Path $BackendRoot 'backend\app.py'))) { throw 'Backend folder not found.' }
$previousDatabase = $env:FOOTY_SQL_DATABASE
$previousFfmpeg = $env:FFMPEG_BINARY
$previousFfprobe = $env:FFPROBE_BINARY
Push-Location -LiteralPath $BackendRoot
try {
    $env:FOOTY_SQL_DATABASE = $Database
    if (!$env:FFMPEG_BINARY -and (Test-Path 'C:\Users\DELL\Downloads\ffmpeg\bin\ffmpeg.exe')) {
        $env:FFMPEG_BINARY = 'C:\Users\DELL\Downloads\ffmpeg\bin\ffmpeg.exe'
    }
    if (!$env:FFPROBE_BINARY -and (Test-Path 'C:\Users\DELL\Downloads\ffmpeg\bin\ffprobe.exe')) {
        $env:FFPROBE_BINARY = 'C:\Users\DELL\Downloads\ffmpeg\bin\ffprobe.exe'
    }
    & $Python -X utf8 -m uvicorn jugaad_server:app --app-dir $PSScriptRoot --host 0.0.0.0 --port $Port
} finally {
    $env:FOOTY_SQL_DATABASE = $previousDatabase
    $env:FFMPEG_BINARY = $previousFfmpeg
    $env:FFPROBE_BINARY = $previousFfprobe
    Pop-Location
}
