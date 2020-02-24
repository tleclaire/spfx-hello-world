del d:\Projekte\spfx-hello-world\temp\deploy\*.* /Q
rem cmd /c gulp build
rem cmd /c gulp bundle --ship
rem cmd /c gulp package-solution --ship

cmd /c gulp bundle
cmd /c gulp package-solution
PowerShell.exe -ExecutionPolicy Bypass -File UploadDocuments.ps1
