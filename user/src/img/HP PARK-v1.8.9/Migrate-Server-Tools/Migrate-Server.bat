@ECHO OFF
rem *******************************************************************************
rem  
rem ฉ Copyright 2011 Hewlett-Packard Development Company, L.P.
rem 
rem Disclaimer Of Warranty and Support
rem THE SOFTWARE AND ANY RELATED DOCUMENTATION ARE PROVIDED "AS IS", WITHOUT 
rem WARRANTY OR SUPPORT OF ANY KIND.  THE ENTIRE RISK AS TO THE USE, RESULTS AND 
rem PERFORMANCE OF THE SOFTWARE AND DOCUMENTATION ARE ASSUMED BY YOU AND THOSE TO 
rem WHOM YOU PROVIDE THE SOFTWARE AND DOCUMENTATION.  HEWLETT-PACKARD COMPANY, 
rem HEWLETT-PACKARD DEVELOPMENT COMPANY, AND THEIR AFFILIATES AND SUBSIDIARIARIES 
rem HEREBY SPECIFICALLY DISCLAIM ANY AND ALL WARRANTIES, EXPRESS, IMPLIED OR 
rem STATUTORY, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF 
rem MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NONINFRINGEMENT.
rem 
rem Limitation Of Liability
rem IN NO EVENT SHALL HEWLETT-PACKARD COMPANY, HEWLETT-PACKARD DEVELOPMENT COMPANY 
rem OR THEIR AFFILIATES AND SUBSIDIARIARIES BE LIABLE FOR ANY CLAIM, DAMAGES 
rem (DIRECT, INDIRECT, INCIDENTAL, PUNITIVE, SPECIAL OR OTHER DAMAGES, INCLUDING 
rem WITHOUT LIMITATION, DAMAGES FOR LOSS OF BUSINESS PROFITS, BUSINESS INTERRUPTION, 
rem LOSS OF BUSINESS INFORMATION, OR OTHER PECUNIARY LOSS AND THE LIKE) OR OTHER 
rem LIABILITY WHATSOEVER, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, 
rem ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR DOCUMENTATION, EVEN 
rem IF ADVISED OF THE POSSIBILITY OF SUCH CLAIM, DAMAGES OR OTHER LIABILITY. 
rem 
rem 
rem *12-01-12 BAB******************************************************************

set DRIVERSTORE=DriverMapping.csv
set SERVER_OPTION=
If (%PROCESSOR_ARCHITECTURE%) == (x86) (
	set SCRIPT_CMD=cscript /nologo
) else (
	set SCRIPT_CMD=%windir%\SysWOW64\cscript /nologo
)	
Color 0E
if not exist Archive MKDIR Archive
set SERVER_NAME=%COMPUTERNAME%
set B_CLUSTER=0

:MENU
CLS

ECHO           ษออออออออออออออออออออออออออออออออออออออออออออออออออออออออออป
ECHO           บ Migrate-Server-Tools version 12.10.04.1                  บ
ECHO           บ                                                          บ
ECHO           บ    Select an option                                      บ
ECHO           บ                                                          บ
ECHO           ฬออออออออออออออออออออออออออออออออออออออออออออออออออออออออออน
ECHO           บ                                                          บ
ECHO           บ On source (old) server:                                  บ
ECHO           บ   0. [optional] Set Failover Cluster virtual node name   บ
ECHO           บ   1. Get information from source (old) server            บ
ECHO           บ                                                          บ
ECHO           บ On target (new) server:                                  บ
ECHO           บ   0. [optional] Set Failover Cluster virtual node name   บ
ECHO           บ   2. Validate Driver Store                               บ
ECHO           บ   3. Load driver mappings from driver store              บ
ECHO           บ   4. [optional] View printer build information           บ
ECHO           บ   5. Test setup                                          บ
ECHO           บ   6. [optional] Preload drivers and create test printers บ
ECHO           บ   7. [optional] Install additional 32 or 64 bit drivers  บ
ECHO           บ   8. Create printers on target server                    บ
ECHO           บ   9. View build result                                   บ
ECHO           บ  10. View target server final configuration              บ
ECHO           บ                                                          บ
ECHO           ฬออออออออออออออออออออออออออออออออออออออออออออออออออออออออออน
ECHO           บ                   PRESS 'Q' TO QUIT                      บ
ECHO           ศออออออออออออออออออออออออออออออออออออออออออออออออออออออออออผ 
ECHO.
ECHO Printer List: %PRINTERLIST%
ECHO Server Name : %SERVER_NAME%
ECHO.

echo Last Step: %LAST_STEP%
SET INPUT=
SET /P INPUT=Please make a selection:
@ECHO OFF
rem echo %INPUT%
set LAST_STEP=%INPUT%

IF /I "%INPUT%"=="0" GOTO CONFIGURE_CLUSTER_NODE
IF /I "%INPUT%"=="1" GOTO GET_INFORMATION
IF /I "%INPUT%"=="2" GOTO VALIDATE_DRIVER_STORE
IF /I "%INPUT%"=="3" GOTO DRIVER_STORE
IF /I "%INPUT%"=="4" GOTO EDIT_INFORMATION
IF /I "%INPUT%"=="5" GOTO TEST_SETUP
IF /I "%INPUT%"=="6" GOTO CREATE_TEST_PRINTERS
IF /I "%INPUT%"=="7" GOTO INSTALL_ALTERNATE_DRIVERS
IF /I "%INPUT%"=="8" GOTO CREATE_PRINTERS
IF /I "%INPUT%"=="9" GOTO VIEW_LOGFILE
IF /I "%INPUT%"=="10" GOTO VIEW_NEW_CONFIGURATION

IF /I "%INPUT%"=="Q" GOTO QUIT

CLS

ECHO ============ INVALID INPUT =================
ECHO --------------------------------------------
ECHO Please select a number from the Main
ECHO Menu [0-9] or select 'Q' to quit.
ECHO --------------------------------------------
ECHO ======= PRESS ANY KEY TO CONTINUE ==========

PAUSE > NUL
GOTO MENU

:CONFIGURE_CLUSTER_NODE
SET /P SERVER_NAME=Enter failover cluster virual node name:
SET SERVER_OPTION=-s %SERVER_NAME%
set B_CLUSTER=1
GOTO FINISH

:GET_INFORMATION
echo Getting current server information
if not exist EnumPrinters3.exe (
	echo ERROR: File "EnumPrinters3.exe" is missing
	pause
	goto MENU
)
EnumPrinters3.exe -names %SERVER_OPTION% -csv %SERVER_NAME%.csv
echo Printer information saved to file: %SERVER_NAME%.csv

if exist StreamEditCSV.vbs (
	echo Stream Editing %SERVER_NAME%.csv
	del /F /Q %SERVER_NAME%_temp.csv
	rename %SERVER_NAME%.csv %SERVER_NAME%_temp.csv
	%SCRIPT_CMD% StreamEditCSV.vbs %SERVER_NAME%_temp.csv > %SERVER_NAME%.csv
	del /F /Q %SERVER_NAME%_temp.csv
)
copy /Y %SERVER_NAME%.csv Archive\%SERVER_NAME%.csv

GOTO FINISH

:VALIDATE_DRIVER_STORE
echo Validate driver store
cscript ValidateDriverStore.vbs %DRIVERSTORE% > DriverStore.log
rem START DriverStore.log
%SCRIPT_CMD% ScanForErrors.vbs DriverStore.log  "Validate Driver Store"
copy /Y DriverStore.log Archive\DriverStore.log
GOTO FINISH

:DRIVER_STORE
if (%PRINTERLIST%) == () 	SET /P PRINTERLIST=Enter source printerlist file name:
echo Source printer list set to %PRINTERLIST%
if not exist %DRIVERSTORE% (
	echo ERROR: Driver store file, "%DRIVERSTORE%" is missing
	pause
	goto MENU
)
if not exist LoadFromDriverStore.vbs (
	echo ERROR: File "LoadFromDriverStore.vbs" is missing
	pause
	goto MENU
)
if not exist %PRINTERLIST% (
	echo ERROR: File "%PRINTERLIST%" is missing
	set PRINTERLIST=
	pause
	goto MENU
)
echo Merging information from driver store into "%PRINTERLIST%" 
copy /Y %PRINTERLIST% %PRINTERLIST:.csv=-temp.csv%
del /F /Q %PRINTERLIST% 
%SCRIPT_CMD% LoadFromDriverStore.vbs %DRIVERSTORE% %PRINTERLIST:.csv=-temp.csv% 0 %PRINTERLIST%

GOTO FINISH

:EDIT_INFORMATION
echo Opening web browser to display the printer and driver information
if (%PRINTERLIST%) == () 	SET /P PRINTERLIST=Enter source printerlist file name:
echo Source printer list set to %PRINTERLIST%
if not exist %PRINTERLIST% (
	echo ERROR: Printer information file "%PRINTERLIST%" is missing
	set PRINTERLIST=
	pause
	goto MENU
)

if exist %SERVER_NAME%.html del /F /Q %SERVER_NAME%.html
%SCRIPT_CMD%  CsvToHtml.vbs %PRINTERLIST% %SERVER_NAME%.html
START %SERVER_NAME%.html
rem START %PRINTERLIST%
GOTO FINISH

:TEST_SETUP
echo  Testing your setup
if (%PRINTERLIST%) == () 	SET /P PRINTERLIST=Enter source printerlist file name:
echo Source printer list set to %PRINTERLIST%
if not exist EnumPrinters3.exe (
	echo ERROR: File "EnumPrinters3.exe" is missing
	pause
	goto MENU
)
if not exist HpPrnPort.exe (
	echo ERROR: File "HpPrnPort.exe" is missing
	pause
	goto MENU
)
if not exist SetPrinter.exe (
	echo ERROR: File "SetPrinter.exe" is missing
	pause
	goto MENU
)
if not exist "%PRINTERLIST%" (
	echo ERROR: Printer information file "%PRINTERLIST%" is missing
	set PRINTERLIST=
	pause
	goto MENU
)
if not exist InstallFromCSV.vbs (
	echo ERROR: File "InstallFromCSV.vbs" is missing
	pause
	goto MENU
)

set LOGFILE=%TIME: =%
set LOGFILE=%LOGFILE:.=-%
set LOGFILE=%LOGFILE:,=-%
set LOGFILE=%LOGFILE::=-%
set LOGFILE=%SERVER_NAME%-%LOGFILE%-Test-Setup.log
%SCRIPT_CMD% InstallFromCSV.vbs -t -f "%PRINTERLIST%" -l %LOGFILE% %SERVER_OPTION%
rem START %LOGFILE%
%SCRIPT_CMD% ScanForErrors.vbs %LOGFILE%  "Test Setup"

copy /Y %LOGFILE% Archive\%LOGFILE%

GOTO FINISH

:CREATE_TEST_PRINTERS
if (%PRINTERLIST%) == () 	SET /P PRINTERLIST=Enter source printerlist file name:
echo Source printer list set to %PRINTERLIST%
if not exist "%PRINTERLIST%" (
	echo ERROR: Printer information file "%PRINTERLIST%" is missing
	set PRINTERLIST=
	pause
	goto MENU
)
if not exist CreateTestPrinters.vbs (
	echo ERROR: File "CreateTestPrinters.vbs" is missing
	pause
	goto MENU
)
%SCRIPT_CMD%  CreateTestPrinters.vbs "%PRINTERLIST%" > %PRINTERLIST:.csv=-test-printers.csv%
echo Created test printer list "%PRINTERLIST:.csv=-test-printers.csv%"

echo Opening web browser to display the printer and driver information
if exist %SERVER_NAME%.html del /F /Q %SERVER_NAME%.html
%SCRIPT_CMD%  CsvToHtml.vbs %PRINTERLIST:.csv=-test-printers.csv% %SERVER_NAME%.html
START %SERVER_NAME%.html
rem START %PRINTERLIST:.csv=-test-printers.csv%

SET /P INPUT=Press Y to continue or any other key to cancel:
IF /I NOT "%INPUT%"=="Y" GOTO MENU

copy /Y %PRINTERLIST:.csv=-test-printers.csv% Archive\%PRINTERLIST:.csv=-test-printers.csv%


set LOGFILE=%TIME: =%
set LOGFILE=%LOGFILE:.=-%
set LOGFILE=%LOGFILE:,=-%
set LOGFILE=%LOGFILE::=-%
set LOGFILE=%SERVER_NAME%-%LOGFILE%-Test-Printers.log
%SCRIPT_CMD% InstallFromCSV.vbs -f %PRINTERLIST:.csv=-test-printers.csv% -l %LOGFILE% %SERVER_OPTION%
%SCRIPT_CMD% ScanForErrors.vbs %LOGFILE%  "Create Test Printers"
copy /Y %LOGFILE% Archive\%LOGFILE%

GOTO FINISH

:CREATE_PRINTERS
if (%PRINTERLIST%) == () 	SET /P PRINTERLIST=Enter source printerlist file name:
echo Source printer list set to %PRINTERLIST%
if not exist "%PRINTERLIST%" (
	echo ERROR: Printer information file "%PRINTERLIST%" is missing
	set %PRINTERLIST%=
	pause
	goto MENU
)
copy /Y %PRINTERLIST% Archive\%PRINTERLIST%

echo Create new print queues
set BUILD_LOGFILE=%TIME: =%
set BUILD_LOGFILE=%BUILD_LOGFILE:.=-%
set BUILD_LOGFILE=%BUILD_LOGFILE:,=-%
set BUILD_LOGFILE=%BUILD_LOGFILE::=-%
set BUILD_LOGFILE=%SERVER_NAME%-%BUILD_LOGFILE%-Build.log
%SCRIPT_CMD%  InstallFromCSV.vbs -q -f %PRINTERLIST% -l %BUILD_LOGFILE% %SERVER_OPTION%
set ACL_FILE_NAME=%PRINTERLIST:.csv=.acl%
if exist %ACL_FILE_NAME% (
	copy /Y %ACL_FILE_NAME% Archive\%ACL_FILE_NAME%
	SubInAcl.exe /noverbose /playfile %ACL_FILE_NAME% >> %BUILD_LOGFILE%
)
%SCRIPT_CMD% ScanForErrors.vbs %BUILD_LOGFILE%  "Create Printers"
copy /Y %BUILD_LOGFILE% Archive\%BUILD_LOGFILE%


GOTO FINISH

:VIEW_LOGFILE
if (%BUILD_LOGFILE%) == () (
	echo Build log file not found
) else (	
	START %BUILD_LOGFILE%
)
GOTO FINISH

:VIEW_NEW_CONFIGURATION
echo Saving printer information to file: %SERVER_NAME%-Target.csv
EnumPrinters3.exe -names %SERVER_OPTION% -csv %SERVER_NAME%-Target.csv

echo Saving a copy of "%SERVER_NAME%-Target.csv" into \Archive folder
copy /Y %SERVER_NAME%-Target.csv Archive\%SERVER_NAME%-Target.csv

echo Opening web browser to display the printer and driver information
if exist %SERVER_NAME%.html del /F /Q %SERVER_NAME%.html
%SCRIPT_CMD%  CsvToHtml.vbs %SERVER_NAME%-Target.csv %SERVER_NAME%.html
START %SERVER_NAME%.html
rem START %SERVER_NAME%-Target.csv
GOTO FINISH

:INSTALL_ALTERNATE_DRIVERS
if (%PRINTERLIST%) == () 	SET /P PRINTERLIST=Enter source printerlist file name:
echo Source printer list set to %PRINTERLIST%
if not exist "%PRINTERLIST%" (
	echo ERROR: Printer information file "%PRINTERLIST%" is missing
	set PRINTERLIST=
	pause
	goto MENU
)
echo Installing alternate drivers
if not exist CreateTestPrinters.vbs (
	echo ERROR: File "CreateTestPrinters.vbs" is missing
	pause
	goto MENU
)
%SCRIPT_CMD%  CreateTestPrinters.vbs "%PRINTERLIST%" > %PRINTERLIST:.csv=-Drivers.csv%
echo Created driver list "%PRINTERLIST:.csv=-Drivers.csv%"

copy /Y %PRINTERLIST:.csv=-Drivers.csv% %PRINTERLIST:.csv=-temp.csv%
del /F /Q %PRINTERLIST:.csv=-Drivers.csv% 
%SCRIPT_CMD%  LoadFromDriverStore.vbs %DRIVERSTORE% %PRINTERLIST:.csv=-temp.csv% 1 %PRINTERLIST:.csv=-Drivers.csv%

echo Opening web browser to display the printer and driver information
if exist %SERVER_NAME%.html del /F /Q %SERVER_NAME%.html
%SCRIPT_CMD%  CsvToHtml.vbs %PRINTERLIST:.csv=-Drivers.csv% %SERVER_NAME%.html
START %SERVER_NAME%.html

rem START Drivers-%PRINTERLIST%
SET /P INPUT=Press Y to continue or any other key to cancel:
IF /I NOT "%INPUT%"=="Y" GOTO MENU

copy /Y %PRINTERLIST:.csv=-Drivers.csv% Archive\%PRINTERLIST:.csv=-Drivers.csv%

set LOGFILE=%TIME: =%
set LOGFILE=%LOGFILE:.=-%
set LOGFILE=%LOGFILE:,=-%
set LOGFILE=%LOGFILE::=-%
set LOGFILE=%SERVER_NAME%-%LOGFILE%-Drivers.log
%SCRIPT_CMD% InstallFromCSV.vbs -ia -f %PRINTERLIST:.csv=-Drivers.csv% -l %LOGFILE% %SERVER_OPTION%
%SCRIPT_CMD% ScanForErrors.vbs %LOGFILE%  "Install Alternate Drivers"
copy /Y %LOGFILE% Archive\%LOGFILE%

GOTO FINISH

:FINISH

echo End of Step %LAST_STEP%
pause
GOTO MENU

:QUIT
Color
CLS

EXIT
