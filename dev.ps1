param([ValidateSet('run','test','build','frontend','api','demo')][string]$Action='run')
$ErrorActionPreference='Stop'
Push-Location $PSScriptRoot
try {
    if (Test-Path -LiteralPath "$PSScriptRoot/.local-tools.ps1") { . "$PSScriptRoot/.local-tools.ps1" }
    function Invoke-GoblinNpm([string[]]$NpmArguments) {
        if ($GoblinNpmCli) { & node $GoblinNpmCli @NpmArguments }
        else { & npm.cmd @NpmArguments }
        if ($LASTEXITCODE -ne 0) { throw 'The frontend command failed. See the output above.' }
    }
    if ($Action -ne 'api') {
        if (!(Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 22.12+ (includes npm). See README.md.' }
        $goblinNpmArgs=@('ci','--prefix','frontend','--cache',"$PSScriptRoot/.cache/npm",'--no-fund','--no-audit')
        if ($GoblinNpmRegistry) { $goblinNpmArgs += "--registry=$GoblinNpmRegistry" }
        Invoke-GoblinNpm $goblinNpmArgs
        if ($Action -eq 'frontend') { Invoke-GoblinNpm @('run','dev','--prefix','frontend'); return }
        if ($Action -eq 'demo') {
            $env:VITE_DEMO_MODE='true'; $env:VITE_BASE_PATH='/task-goblin-api/'
            try { Invoke-GoblinNpm @('run','build','--prefix','frontend') }
            finally { Remove-Item Env:/VITE_DEMO_MODE,Env:/VITE_BASE_PATH -ErrorAction SilentlyContinue }
            Write-Host 'Open http://127.0.0.1:4173/task-goblin-api/ — this demo saves in your browser.'
            Invoke-GoblinNpm @('run','preview','--prefix','frontend'); return
        }
        # Local full-stack builds must use the real API at the root URL.
        $goblinOldDemo=$env:VITE_DEMO_MODE; $goblinOldBase=$env:VITE_BASE_PATH
        $env:VITE_DEMO_MODE='false'; $env:VITE_BASE_PATH='/'
        try { Invoke-GoblinNpm @('run','build','--prefix','frontend') }
        finally { $env:VITE_DEMO_MODE=$goblinOldDemo; $env:VITE_BASE_PATH=$goblinOldBase }
        if ($Action -eq 'test') { Invoke-GoblinNpm @('test','--prefix','frontend') }
    }
    $goblinJava=if($env:JAVA_HOME){Join-Path $env:JAVA_HOME 'bin/java.exe'}else{'java'}
    $goblinVersion=(& $goblinJava --version 2>&1 | Out-String)
    if($LASTEXITCODE -ne 0 -or $goblinVersion -notmatch '(?:openjdk|java) 21[. ]') { throw 'Set JAVA_HOME to a Java 21 JDK. See README.md.' }
    if(!$GoblinMavenRepository){$GoblinMavenRepository=Join-Path $PSScriptRoot '.cache/repository'}
    $env:MAVEN_USER_HOME=Join-Path $PSScriptRoot '.cache/maven'
    $goblinMaven=if($GoblinMavenHome){Join-Path $GoblinMavenHome 'bin/mvn.cmd'}else{Join-Path $PSScriptRoot 'mvnw.cmd'}
    $goblinGoal=if($Action -in @('run','api')){'spring-boot:run'}else{'verify'}
    Write-Host 'Full app: http://127.0.0.1:8080 | Swagger: http://127.0.0.1:8080/swagger-ui/index.html'
    & $goblinMaven "-Dmaven.repo.local=$GoblinMavenRepository" $goblinGoal
    if($LASTEXITCODE -ne 0){throw 'The Java command failed. See the Maven output above.'}
} finally { Pop-Location }
