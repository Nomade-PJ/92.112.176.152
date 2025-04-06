# Script PowerShell para limpar completamente o projeto PauloCell
# Uso: .\scripts\clean-project.ps1

# Obter o diretório base do projeto
$ProjectDir = (Get-Location).Path

Write-Host "=== Iniciando limpeza completa do projeto PauloCell ===" -ForegroundColor Cyan
Write-Host "Diretório do projeto: $ProjectDir"

# Criar diretório para backup temporário dos arquivos removidos
$BackupDir = Join-Path $ProjectDir ".cleanup_backup_$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
Write-Host "Backup temporário dos arquivos removidos: $BackupDir"

# Função para fazer backup antes de remover
function Backup-AndRemove {
    param(
        [string]$Path
    )
    
    if (Test-Path $Path) {
        $DestName = Split-Path $Path -Leaf
        $Dest = Join-Path $BackupDir $DestName
        
        if (Test-Path $Path -PathType Container) {
            Copy-Item -Path $Path -Destination $Dest -Recurse -Force
            Remove-Item -Path $Path -Recurse -Force
        } else {
            Copy-Item -Path $Path -Destination $Dest -Force
            Remove-Item -Path $Path -Force
        }
        
        Write-Host "✅ Removido: $Path" -ForegroundColor Green
    }
}

# ==========================================
# 1. REMOÇÃO DE ARQUIVOS DE DOCUMENTAÇÃO
# ==========================================
Write-Host "`n=== Removendo arquivos de documentação desnecessários ===" -ForegroundColor Yellow

# Manter apenas README.md principal, README-MIGRACAO.md e CHANGELOG.md
Get-ChildItem -Path $ProjectDir -Recurse -File -Filter "*.md" | 
    Where-Object { $_.Name -ne "README.md" -and $_.Name -ne "README-MIGRACAO.md" -and $_.Name -ne "CHANGELOG.md" } | 
    ForEach-Object {
        Backup-AndRemove $_.FullName
    }

# Remover todos os arquivos HTML de documentação
Get-ChildItem -Path $ProjectDir -Recurse -File -Include "guia-*.html", "*-guide.html", "*-tutorial.html" | 
    ForEach-Object {
        Backup-AndRemove $_.FullName
    }

# ==========================================
# 2. REMOÇÃO DE ARQUIVOS DE DESENVOLVIMENTO E TEMPORÁRIOS
# ==========================================
Write-Host "`n=== Removendo arquivos de desenvolvimento e temporários ===" -ForegroundColor Yellow

# Remover diretórios de IDE e configurações locais
$DevDirs = @(".vscode", ".idea", ".eclipse", ".settings", ".github", "__pycache__", ".pytest_cache", ".nyc_output", "coverage")
foreach ($dir in $DevDirs) {
    $fullPath = Join-Path $ProjectDir $dir
    if (Test-Path $fullPath) {
        Backup-AndRemove $fullPath
    }
}

# Remover arquivos de sistema operacional
Get-ChildItem -Path $ProjectDir -Recurse -File -Include ".DS_Store", "Thumbs.db", "desktop.ini", "*.swp" | 
    ForEach-Object {
        Backup-AndRemove $_.FullName
    }

# Remover arquivos de log
Get-ChildItem -Path $ProjectDir -Recurse -File -Include "*.log", "npm-debug.log*", "yarn-debug.log*", "yarn-error.log*" | 
    ForEach-Object {
        Backup-AndRemove $_.FullName
    }

# Remover arquivos temporários do Vite
Get-ChildItem -Path $ProjectDir -Recurse -File | 
    Where-Object { $_.Name -match "\.timestamp-" } | 
    ForEach-Object {
        Backup-AndRemove $_.FullName
    }

# ==========================================
# 3. REMOÇÃO DE ARQUIVOS DE CONFIGURAÇÃO REDUNDANTES
# ==========================================
Write-Host "`n=== Removendo arquivos de configuração redundantes ===" -ForegroundColor Yellow

# Remover configurações de desenvolvimento
$EnvFiles = @(".env.development", ".env.local", ".env.test")
foreach ($file in $EnvFiles) {
    $fullPath = Join-Path $ProjectDir $file
    if (Test-Path $fullPath) {
        Backup-AndRemove $fullPath
    }
}

# Scripts de desenvolvimento Windows/Mac
Get-ChildItem -Path $ProjectDir -File -Include "*.bat", "*.cmd" | 
    Where-Object { $_.FullName -notmatch "\\scripts\\" } | 
    ForEach-Object {
        Backup-AndRemove $_.FullName
    }

# ==========================================
# 4. REMOÇÃO DE ARQUIVOS DE CÓDIGO LEGADO E DESCONTINUADO
# ==========================================
Write-Host "`n=== Removendo arquivos de código legado ===" -ForegroundColor Yellow

# Firebase (manter cópia de backup)
$firebasePath = Join-Path $ProjectDir "src\lib\firebase.ts"
if (Test-Path $firebasePath) {
    Copy-Item -Path $firebasePath -Destination (Join-Path $BackupDir "firebase.ts.bak") -Force
    Remove-Item -Path $firebasePath -Force
    Write-Host "✅ Arquivo firebase.ts removido e salvo como backup" -ForegroundColor Green
}

# Outros arquivos legados ou de teste
Get-ChildItem -Path $ProjectDir -Recurse -File -Include "*-test.*", "*Test.*", "*Tester.*", "*Demo.*", "*Example.*" | 
    ForEach-Object {
        Backup-AndRemove $_.FullName
    }

# ==========================================
# 5. REMOÇÃO DE DIRETÓRIOS DESNECESSÁRIOS
# ==========================================
Write-Host "`n=== Removendo diretórios desnecessários ===" -ForegroundColor Yellow

# Diretórios de build, testes e exemplos
$UnnecessaryDirs = @("dist", "build", ".cache", "tests", "test", "__tests__", "examples", "demo", "mock", "mocks", "docs", ".firebase", "backup-scripts")
foreach ($dir in $UnnecessaryDirs) {
    $fullPath = Join-Path $ProjectDir $dir
    if (Test-Path $fullPath) {
        Backup-AndRemove $fullPath
    }
}

# Remover node_modules (pode ser reinstalado com npm install)
$nodeModulesPath = Join-Path $ProjectDir "node_modules"
if (Test-Path $nodeModulesPath) {
    Write-Host "Removendo node_modules... (pode demorar um pouco)" -ForegroundColor Yellow
    Remove-Item -Path $nodeModulesPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Diretório node_modules removido" -ForegroundColor Green
}

# ==========================================
# 6. REMOÇÃO DE ARQUIVOS DE GRANDE PORTE DESNECESSÁRIOS
# ==========================================
Write-Host "`n=== Removendo arquivos grandes desnecessários ===" -ForegroundColor Yellow

# Instaladores, executáveis, etc.
Get-ChildItem -Path $ProjectDir -Recurse -File -Include "*.exe", "*.msi", "*.dmg", "*.pkg", "*.deb", "*.rpm" | 
    ForEach-Object {
        Backup-AndRemove $_.FullName
    }

# Arquivos de mídia grandes que podem ser amostras
Get-ChildItem -Path $ProjectDir -Recurse -File | 
    Where-Object { $_.Length -gt 5MB -and $_.FullName -notmatch "\\node_modules\\" } | 
    ForEach-Object {
        $size = [math]::Round($_.Length / 1MB, 2)
        Write-Host "Arquivo grande encontrado: $($_.FullName) ($size MB)"
        $choice = Read-Host "Remover este arquivo? (s/n)"
        if ($choice -eq "s") {
            Backup-AndRemove $_.FullName
        }
    }

# ==========================================
# 7. OTIMIZAÇÃO DE CÓDIGO
# ==========================================
Write-Host "`n=== Otimizando o código ===" -ForegroundColor Yellow

# Otimizar package.json (remover scripts e dependências de desenvolvimento não essenciais)
Write-Host "Recomendado: Revisar manualmente package.json para remover dependências de desenvolvimento não essenciais"

# ==========================================
# 8. LIMPEZA FINAL
# ==========================================
Write-Host "`n=== Limpeza final ===" -ForegroundColor Yellow

# Remover diretórios vazios
$emptyDirs = 0
$dirs = Get-ChildItem -Path $ProjectDir -Directory -Recurse | Where-Object { $_.FullName -notmatch "\\.git\\" }
do {
    $startCount = $emptyDirs
    foreach ($dir in $dirs) {
        if ((Get-ChildItem -Path $dir.FullName -Force).Count -eq 0) {
            Remove-Item -Path $dir.FullName -Force
            $emptyDirs++
        }
    }
    $dirs = Get-ChildItem -Path $ProjectDir -Directory -Recurse | Where-Object { $_.FullName -notmatch "\\.git\\" }
} while ($emptyDirs -gt $startCount)

Write-Host "✅ $emptyDirs diretórios vazios removidos" -ForegroundColor Green

# ==========================================
# RESUMO E CONCLUSÃO
# ==========================================
Write-Host "`n=== Limpeza concluída! ===" -ForegroundColor Cyan

# Calcular espaço recuperado
$backupSize = (Get-ChildItem -Path $BackupDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Total de espaço recuperado: $([math]::Round($backupSize, 2)) MB"

Write-Host "`nOs arquivos removidos foram salvos em: $BackupDir" -ForegroundColor Yellow
Write-Host "Você pode excluir este diretório de backup quando tiver certeza de que tudo está funcionando corretamente:"
Write-Host "  Remove-Item -Path `"$BackupDir`" -Recurse -Force" -ForegroundColor DarkGray

Write-Host "`nPróximos passos:" -ForegroundColor Green
Write-Host "1. Instale as dependências: npm install"
Write-Host "2. Configure as variáveis de ambiente: Copy-Item .env.example .env; code .env"
Write-Host "3. Teste o projeto localmente: npm run dev"
Write-Host "4. Faça o build e deploy: npm run deploy"

Write-Host "`nO projeto está pronto para produção!" -ForegroundColor Cyan 