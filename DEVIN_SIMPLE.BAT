@ECHO OFF
ECHO Devin CLI - DOSBox Edition
ECHO Type EXIT to quit
ECHO.
:LOOP
ECHO Enter command:
SET /P CMD=
IF "%CMD%"=="EXIT" GOTO END
ECHO Processing: %CMD%
ECHO.
GOTO LOOP
:END
ECHO Devin session ended
