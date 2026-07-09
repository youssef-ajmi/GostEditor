$mingwBin = "C:\Users\youssef\AppData\Local\Microsoft\WinGet\Packages\BrechtSanders.WinLibs.POSIX.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\mingw64\bin"
$env:Path = "$mingwBin;$env:PATH"
Set-Location D:\GostEditor\gost-editor
npx tauri dev
pause