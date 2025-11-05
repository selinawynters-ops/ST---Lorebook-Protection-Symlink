@echo off
echo ========================================
echo Lorebook ACL Panel - Windows Installer
echo ========================================
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✓ Running with administrator privileges
) else (
    echo ⚠️  Warning: Not running as administrator
    echo   Some features may not work properly
    echo.
)

:: Get SillyTavern installation path
set /p sillytavern_path="Enter SillyTavern installation path (or press Enter for default C:\SillyTavern): "
if "%sillytavern_path%"=="" set sillytavern_path=C:\SillyTavern

:: Validate path
if not exist "%sillytavern_path%" (
    echo ❌ Error: SillyTavern directory not found at %sillytavern_path%
    echo   Please make sure SillyTavern is installed and the path is correct
    pause
    exit /b 1
)

echo ✓ Found SillyTavern at: %sillytavern_path%

:: Create extension directory
set extensions_dir=%sillytavern_path%\extensions\lorebook-acl
if not exist "%extensions_dir%" (
    echo Creating extension directory...
    mkdir "%extensions_dir%"
)

:: Copy files
echo.
echo Copying extension files...
copy "index.js" "%extensions_dir%&quot; >nul
copy "manifest.json" "%extensions_dir%&quot; >nul
copy "style.css" "%extensions_dir%&quot; >nul
copy "ui-index.js" "%extensions_dir%&quot; >nul

if errorlevel 1 (
    echo ❌ Error copying files
    pause
    exit /b 1
)

echo ✓ Extension files copied successfully

:: Create server extensions directory
set server_extensions_dir=%sillytavern_path%\server\extensions\lorebook-acl
if not exist "%server_extensions_dir%" (
    echo Creating server extension directory...
    mkdir "%server_extensions_dir%"
)

:: Copy server files
echo.
echo Copying server files...
copy "server-index.js" "%server_extensions_dir%\index.js" >nul
copy "server-manifest.json" "%server_extensions_dir%&quot; >nul

if errorlevel 1 (
    echo ❌ Error copying server files
    pause
    exit /b 1
)

echo ✓ Server files copied successfully

:: Enable Windows developer mode for symlink support
echo.
echo 📝 Note: For symlink functionality, Windows Developer Mode is recommended
echo   To enable Developer Mode:
echo   1. Open Windows Settings
echo   2. Go to Update & Security > For developers
echo   3. Select "Developer mode"
echo   4. Restart SillyTavern after enabling
echo.

:: Check if data directories exist
set data_dir=%sillytavern_path%\data
set shared_dir=%data_dir%\shared\worlds
if not exist "%shared_dir%" (
    echo Creating shared worlds directory...
    mkdir "%data_dir%\shared" >nul 2>&1
    mkdir "%data_dir%\shared\worlds" >nul 2>&1
    echo ✓ Created shared worlds directory: %shared_dir%
)

:: Create desktop shortcut
echo.
echo Creating desktop shortcut...
set desktop=%USERPROFILE%\Desktop
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%temp%\shortcut.vbs"
echo sLinkFile = "%desktop%\Lorebook ACL Panel.lnk" >> "%temp%\shortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%temp%\shortcut.vbs"
echo oLink.TargetPath = "%~dp0test-acl-panel.html" >> "%temp%\shortcut.vbs"
echo oLink.WorkingDirectory = "%~dp0" >> "%temp%\shortcut.vbs"
echo oLink.Description = "Lorebook ACL Panel Test Interface" >> "%temp%\shortcut.vbs"
echo oLink.Save >> "%temp%\shortcut.vbs"
cscript "%temp%\shortcut.vbs" >nul
del "%temp%\shortcut.vbs"

echo ✓ Desktop shortcut created

:: Final instructions
echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo 📁 Extension installed to: %extensions_dir%
echo 🖥️  Server extension installed to: %server_extensions_dir%
echo 🗂️  Desktop shortcut created for testing
echo.
echo 🚀 Next Steps:
echo 1. Restart SillyTavern
echo 2. Go to World Info tab
echo 3. Click the "🛡️ ACL Panel" button
echo 4. Or use keyboard shortcut: Ctrl+Shift+L
echo.
echo 📋 Features:
echo • Neumorphic UI with floating panel
echo • Lorebook sharing and access control
echo • Symlink creation for shared lorebooks
echo • Real-time ACL management
echo • Dark/Light theme support
echo.
echo 🧪 Test the interface:
echo • Double-click the desktop shortcut
echo • Or open test-acl-panel.html in your browser
echo.
echo ⚙️  Configuration:
echo • Extension settings are stored in SillyTavern's data directory
echo • Shared lorebooks go to: data\shared\worlds\
echo.
echo.
pause