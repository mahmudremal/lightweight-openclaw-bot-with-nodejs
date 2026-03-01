#NoEnv
#SingleInstance Force
#Persistent
Menu, Tray, Icon, %A_ScriptDir%\lobster.ico

serverCmd := "romi start"
dashboardCmd := "romi dashboard"

; Start server on launch
Gosub, StartServer

; --- Tray Menu ---
Menu, Tray, NoStandard
Menu, Tray, Add, Open Status, OpenStatus
Menu, Tray, Add, Open Dashboard, OpenDashboard
Menu, Tray, Add
Menu, Tray, Add, Restart, RestartServer
Menu, Tray, Add, Quit, QuitApp
Menu, Tray, Tip, Romi Bot.
Return

; --- Functions ---
StartServer:
    Run, cmd.exe /k %serverCmd%, , Hide, serverPID
Return

OpenStatus:
    statusText := serverPID ? "Running" : "Stopped"
    statusColor := serverPID ? "4caf50" : "f44336"
    
    Gui, StatusGui:Destroy
    Gui, StatusGui:New, +AlwaysOnTop -MaximizeBox -MinimizeBox +Owner, Server Status
    Gui, StatusGui:Color, 1a1a1b, 2d2d30
    Gui, StatusGui:Font, s12 w700 q5 cffffff, Segoe UI
    Gui, StatusGui:Add, Text, x20 y20 w260 +Center, Romi Bot.
    
    Gui, StatusGui:Font, s10 w400 c9aa0a6
    Gui, StatusGui:Add, Text, x20 y+20 w70, Status:
    Gui, StatusGui:Font, s10 w600 c%statusColor%
    Gui, StatusGui:Add, Text, x+5 w180, %statusText%
    
    Gui, StatusGui:Font, s10 w400 c9aa0a6
    Gui, StatusGui:Add, Text, x20 y+10 w70, PID:
    Gui, StatusGui:Font, s10 w600 c8ab4f8
    Gui, StatusGui:Add, Text, x+5 w180, % (serverPID ? serverPID : "N/A")
    
    Gui, StatusGui:Font, s9 w400 c9aa0a6
    Gui, StatusGui:Add, Text, x20 y+15 w260, Command:
    Gui, StatusGui:Font, s8 w400 c666666
    Gui, StatusGui:Add, Text, x20 y+5 w260 r2, %serverCmd%
    
    Gui, StatusGui:Add, Button, x100 y+25 w100 h32 Default gStatusClose, Dismiss
    
    Gui, StatusGui:Show, w300 h240
Return

StatusClose:
StatusGuiGuiClose:
StatusGuiGuiEscape:
    Gui, StatusGui:Destroy
Return

OpenDashboard:
    Run, cmd.exe /c %dashboardCmd%, , Hide
Return

RestartServer:
    Process, Close, %serverPID%
    Sleep, 1000
    Gosub, StartServer
Return

QuitApp:
    Process, Close, %serverPID%
    ExitApp
