function isadmin {
    ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
}
If (-NOT (isadmin)) {
    Start-Process powershell.exe -ArgumentList  '-noexit', $PSScriptRoot'\Ludite_Install.ps1' -Verb RunAs
}
else {
    Set-ExecutionPolicy AllSigned
    Move-Item ~\Downloads\'ludite-win32-x64.zip' ~\Documents\'ludite-win32-x64.zip'
    Set-Location ~\Documents
    Expand-Archive -LiteralPath .\'ludite-win32-x64.zip' -DestinationPath .
    Set-Location 'ludite-win32-x64'
    New-Item -ItemType SymbolicLink -Path ludite.exe -Target ~\Desktop\Ludite
    Read-Host -Prompt "Ludite is installed press enter to exit." 
}