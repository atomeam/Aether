# PowerShell script to create icon files from SVG
# This requires ImageMagick or similar tool to be installed

Write-Host "Creating icon files..." -ForegroundColor Cyan

# Check if ImageMagick is available
try {
    $magick = Get-Command magick -ErrorAction Stop
    Write-Host "ImageMagick found: $($magick.Source)" -ForegroundColor Green
} catch {
    Write-Host "ImageMagick not found. Installing via winget..." -ForegroundColor Yellow
    winget install ImageMagick.ImageMagick -e --accept-source-agreements --accept-package-agreements
}

# Create different sized icons
$sizes = @(16, 32, 48, 64, 128, 256, 512)
$svgPath = "$PSScriptRoot\icon.svg"

foreach ($size in $sizes) {
    $outputPath = "$PSScriptRoot\icon-${size}x${size}.png"
    Write-Host "Creating ${size}x${size} icon..." -ForegroundColor Yellow
    
    if (Get-Command magick -ErrorAction SilentlyContinue) {
        magick convert -background none -size "${size}x${size}" "$svgPath" "$outputPath"
    } else {
        Write-Host "ImageMagick not available. Skipping icon generation." -ForegroundColor Red
        Write-Host "Please install ImageMagick from: https://imagemagick.org/" -ForegroundColor Yellow
        break
    }
}

# Create ICO file for Windows
if (Get-Command magick -ErrorAction SilentlyContinue) {
    Write-Host "Creating Windows ICO file..." -ForegroundColor Yellow
    magick convert icon-16x16.png icon-32x32.png icon-48x48.png icon-256x256.png icon.ico
    Write-Host "Icon files created successfully!" -ForegroundColor Green
} else {
    Write-Host "ICO file creation skipped (ImageMagick not available)" -ForegroundColor Yellow
}