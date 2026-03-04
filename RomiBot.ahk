#NoEnv
#SingleInstance Force
#Persistent
#NoTrayIcon ; We'll show it after setup
SetWorkingDir %A_ScriptDir%

; --- Configuration ---
appName := "Romi Bot"
serverCmd := "romi start"
dashboardUrl := "http://localhost:8765/health" ; Standard dashboard URL
iconPath := A_ScriptDir . "\lobster.ico"

if FileExist(iconPath)
    Menu, Tray, Icon, %iconPath%

; --- Initialize ---
Gosub, StartServer
Menu, Tray, Icon ; Show tray icon now

; --- Tray Menu ---
Menu, Tray, NoStandard
Menu, Tray, Add, %appName% Status, OpenStatus
Menu, Tray, Default, %appName% Status
Menu, Tray, Add, Open Dashboard, OpenDashboard
Menu, Tray, Add
Menu, Tray, Add, Restart Server, RestartServer
Menu, Tray, Add, Quit Romi, QuitApp
Menu, Tray, Tip, %appName% is running in background.
Return

; --- Core Logic ---
StartServer:
    if (serverPID) {
        Gosub, StopServer
    }
    ; Use /c to close cmd after execution, Hide to keep it in background
    Run, %comspec% /c %serverCmd%, %A_ScriptDir%, Hide, serverPID
    if (!serverPID) {
        MsgBox, 16, Error, Failed to start %appName% server.
    }
Return

StopServer:
    if (serverPID) {
        ; Use taskkill /F /T to kill the process and all its children (Node.js, etc.)
        Run, taskkill /F /T /PID %serverPID%, , Hide
        serverPID := 0
        Sleep, 500 ; Give it a moment to release ports
    }
Return

OpenDashboard:
    Run, %dashboardUrl%
Return

RestartServer:
    Gosub, StopServer
    Sleep, 1000
    Gosub, StartServer
    if (GuiVisible)
        Gosub, OpenStatus
Return

QuitApp:
    Gosub, StopServer
    ExitApp
Return

; --- Professional Status GUI ---
OpenStatus:
    GuiVisible := true
    statusText := serverPID ? "ACTIVE" : "OFFLINE"
    statusColor := serverPID ? "42b883" : "ff4d4d" ; Emerald vs Coral
    
    Gui, StatusGui:Destroy
    Gui, StatusGui:New, +AlwaysOnTop -MaximizeBox -MinimizeBox +Owner +LastFound, %appName% Control Center
    Gui, StatusGui:Color, 121212, 1e1e1e
    
    ; Header Area
    Gui, StatusGui:Font, s14 w700 q5 cffffff, Segoe UI
    Gui, StatusGui:Add, Text, x0 y20 w320 +Center, %appName%
    
    ; Indicator Circle (Unicode)
    Gui, StatusGui:Font, s10 w400 c%statusColor%
    Gui, StatusGui:Add, Text, x0 y45 w320 +Center, % (serverPID ? "● " : "○ ") . statusText
    
    ; Details Box
    Gui, StatusGui:Font, s9 w400 c808080
    Gui, StatusGui:Add, Text, x30 y85 w60, Process ID:
    Gui, StatusGui:Font, s9 w600 cffffff
    Gui, StatusGui:Add, Text, x+5 w200, % (serverPID ? serverPID : "None")
    
    Gui, StatusGui:Font, s9 w400 c808080
    Gui, StatusGui:Add, Text, x30 y110 w60, Directory:
    Gui, StatusGui:Font, s8 w300 c606060
    Gui, StatusGui:Add, Text, x+5 w200 r1, %A_ScriptDir%

    ; Action Buttons
    Gui, StatusGui:Font, s9 w600 cffffff
    if (serverPID) {
        Gui, StatusGui:Add, Button, x30 y150 w125 h35 gRestartServer, ↻ RESTART
        Gui, StatusGui:Add, Button, x165 y150 w125 h35 gStopServerUI, ■ STOP
    } else {
        Gui, StatusGui:Add, Button, x30 y150 w260 h35 gStartServerUI, ▶ START ENGINE
    }
    
    Gui, StatusGui:Add, Button, x30 y195 w260 h30 gOpenDashboard, 🌐 OPEN DASHBOARD
    
    Gui, StatusGui:Font, s8 w400 c404040
    Gui, StatusGui:Add, Text, x0 y245 w320 +Center, Romi Engine v2.0 - Developed by Remal Mahmud
    
    Gui, StatusGui:Show, w320 h270
Return

StartServerUI:
    Gosub, StartServer
    Gosub, OpenStatus
Return

StopServerUI:
    Gosub, StopServer
    Gosub, OpenStatus
Return

StatusGuiGuiClose:
StatusGuiGuiEscape:
    GuiVisible := false
    Gui, StatusGui:Destroy
Return
