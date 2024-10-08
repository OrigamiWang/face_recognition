!macro customInstall
  ExecWait '"taskkill" /F /IM "Face Recognition.exe"'
  ExecWait '"taskkill" /F /IM "Face Recognition.exe"'
  Sleep 2000
!macroend

!macro customUnInstall
  ExecWait '"taskkill" /F /IM "Face Recognition.exe"'
  ExecWait '"taskkill" /F /IM "Face Recognition.exe"'
  Sleep 2000
!macroend