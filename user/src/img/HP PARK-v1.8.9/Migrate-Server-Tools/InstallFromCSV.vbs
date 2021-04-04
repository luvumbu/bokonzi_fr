'*******************************************************************************
' 
'© Copyright 2011 Hewlett-Packard Development Company, L.P.
'
'Disclaimer Of Warranty and Support
'THE SOFTWARE AND ANY RELATED DOCUMENTATION ARE PROVIDED "AS IS", WITHOUT 
'WARRANTY OR SUPPORT OF ANY KIND.  THE ENTIRE RISK AS TO THE USE, RESULTS AND 
'PERFORMANCE OF THE SOFTWARE AND DOCUMENTATION ARE ASSUMED BY YOU AND THOSE TO 
'WHOM YOU PROVIDE THE SOFTWARE AND DOCUMENTATION.  HEWLETT-PACKARD COMPANY, 
'HEWLETT-PACKARD DEVELOPMENT COMPANY, AND THEIR AFFILIATES AND SUBSIDIARIARIES 
'HEREBY SPECIFICALLY DISCLAIM ANY AND ALL WARRANTIES, EXPRESS, IMPLIED OR 
'STATUTORY, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF 
'MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NONINFRINGEMENT.
'
'Limitation Of Liability
'IN NO EVENT SHALL HEWLETT-PACKARD COMPANY, HEWLETT-PACKARD DEVELOPMENT COMPANY 
'OR THEIR AFFILIATES AND SUBSIDIARIARIES BE LIABLE FOR ANY CLAIM, DAMAGES 
'(DIRECT, INDIRECT, INCIDENTAL, PUNITIVE, SPECIAL OR OTHER DAMAGES, INCLUDING 
'WITHOUT LIMITATION, DAMAGES FOR LOSS OF BUSINESS PROFITS, BUSINESS INTERRUPTION, 
'LOSS OF BUSINESS INFORMATION, OR OTHER PECUNIARY LOSS AND THE LIKE) OR OTHER 
'LIABILITY WHATSOEVER, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, 
'ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR DOCUMENTATION, EVEN 
'IF ADVISED OF THE POSSIBILITY OF SUCH CLAIM, DAMAGES OR OTHER LIABILITY. 
'
'
'*12-01-26 BAB******************************************************************

option explicit
on error resume next    

dim gLogFile
dim gHostScript

const kVersionString    = "InstallFromCSV.vbs version 12.10.04.1  "

const OLD_DRIVER_NAME	= 0
const VERSION			= 1
const NEW_DRIVER_NAME	= 2
const OPTIONS			= 3
const PRINTER_NAME		= 4
const PRINTER_MODEL		= 5
const IP_ADDRESS		= 6
const PORT_NAME			= 7
const LOCATION			= 8
const COMMENT			= 9
const SHARE_NAME		= 10
const BUILD_NUMBER		= 11
const PRINT_PROCESSOR	= 12
const ATTRIBUTES        = 13
const IS_SHARED         = 14
const PUBLISHED         = 15
const ENABLE_BIDI       = 16
const COLOR				= 17
const COPIES			= 18
const SOURCE			= 19
const SOURCE_NAME		= 20
const DUPLEX			= 21
const PAPER_SIZE		= 22
const FORM_NAME			= 23
const MEDIA_TYPE		= 24
const MEDIA_NAME		= 25
const DUPLEX_HW			= 26
const ORIENTATION		= 27
const QUALITY			= 28
const CFG_FILE          = 29
const SPARE_2           = 30
const SECURITY_DESC     = 31
const SERIAL_NUMBER		= 32
const LAST_COLUMN       = 32

const ForReading        = 1
const ForAppending      = 8
const kErrorSuccess     = 0
const KErrorFailure     = 1

const kActionUnknown    = 0
const kActionTest       = 1
const kActionQuiet      = 2
const kActionWinPrint   = 4
const kActionVerbose    = 8
const kActionDriverOnly = 16
const kActionAmd64		= 64

main

sub main
    dim iAction
    dim strServerName
	dim strFileName
	dim oCsvDoc
	dim strRow
	dim oFso
	dim p	
	dim row
	dim strLogFile

	ReDim p(LAST_COLUMN+1)
	gHostScript = IsHostCscript()
	if (gHostScript = false) then
        wscript.echo("Please run this script using CScript."  & vbCRLF & _
					 "This can be achieved by" & vbCRLF & _
                     "1. Using ""CScript script.vbs arguments"" or"  & vbCRLF & _
					 "2. Changing the default Windows Scripting Host to CScript" & vbCRLF & _
                     "   using ""CScript //H:CScript //S"" and running the script " & vbCRLF &_
					 "   ""script.vbs arguments""." & vbCRLF)
        wscript.quit
    end if	
'	strFileName = "printers.csv"
	ParseCommandLine iAction, strServerName, strFileName, strLogFile

    Set oFso = CreateObject("Scripting.FileSystemObject") 
	strLogFile = oFso.GetParentFolderName(wscript.ScriptFullName) & "\" & strLogFile
    Set gLogFile = oFso.OpenTextFile(strLogFile, ForAppending, True)
    If Err <> 0 then
        wscript.echo "ERROR: Error creating log file 0x" & hex(Err.Number) & "  " & Err.Description & "" & strLogFile 
        wscript.quit
    end if
	log kVERSIONString & Date & "  " & Time
	log "Reading from file: " & strFileName 

    if (FileExists("EnumPrinters3.exe") = true) then
		Set oCsvDoc = oFso.OpenTextFile(strFileName, ForReading, False)
		If Err = 0 then
			row = 0
			Do While oCsvDoc.AtEndOfStream <> True
				strRow = oCsvDoc.ReadLine
				p = split(strRow,",")
				If (ubound(p) > 0) Then											'check to make sure the line was split into an array
					if (row > 0) AND Len(p(PRINTER_NAME)) > 0 then				'Skip the header and blank rows
						if (CallScript(iAction, "Pre-Process.vbs", strServerName, p) > 0) Then	' Run Pre-Process script if it exists
																					' Perform other actions if the Pre-Process script returns 1			
							if (iAction AND kActionDriverOnly) then					' Install only the alternate driver
								if Len(p(NEW_DRIVER_NAME)) = 0 OR Len(p(OPTIONS)) = 0 then
									log "ERROR: " & strFileName & " Row: " & row+1 & " Driver name and inf path are required parameters"
									log ""
								else 
									'if DriverExists(iAction, strServerName, p) then		'REVISIT: Skip drivers that are already there
									'	log "Driver " & p(NEW_DRIVER_NAME) & " already exists"
									'	log ""
									'else
										DisplayPrinterInformation iAction, strServerName, p
										InstallAlternateDriver iAction, strServerName, p
									'end if	
								end if
							else	
								if Len(p(PRINTER_NAME)) = 0 OR Len(p(IP_ADDRESS)) = 0 OR Len(p(NEW_DRIVER_NAME)) = 0 OR Len(p(OPTIONS)) = 0 then
									log "ERROR: " & strFileName & " Row: " & row+1 & " Printer name and IP address are required parameters"
									log "ERROR: " & strFileName & " Row: " & row+1 & " Driver name and inf path are required parameters"
									log ""
								else 
									if PrinterExists(iAction, strServerName, p) then		'Skip printers that are already there
										log "Printer " & p(PRINTER_NAME) & " already exists"
										log ""
									else
										DisplayPrinterInformation iAction, strServerName, p
										if (Len(p(NEW_DRIVER_NAME)) = 0) AND (Len(strServerName) = 0) then 	
												log "ERROR: " & strFileName & " Row: " & row+1 & " Printer: " & p(PRINTER_NAME) & " - Driver name and inf path are required parameters"
												'if (CreatePrinterUPD (iAction, strServerName, p) = kErrorSuccess) then 	'UPD install.exe installation
												'    ConfigurePrinter iAction, strServerName, p
												'end if
										else
					'Hack for 8150 discrete driver			
											if p(NEW_DRIVER_NAME) = "HP LaserJet 8150 Series PCL6" then
												p(NEW_DRIVER_NAME) = "HP LaserJet 8150 Series PCL6 "
												log "Adding space to end of HP LaserJet 8150 Series PCL6 driver name"
											end if
					'Hack for 8150 discrete driver		
											if (CreatePort (iAction, strServerName, p) = kErrorSuccess) then
												if (CreatePrinterEx (iAction, strServerName, p) = kErrorSuccess) then	'printui.dll installation
													ConfigurePrinter iAction, strServerName, p
													PostProcessPrinter iAction, strServerName, p
													CallScript iAction, "Post-Process.vbs", strServerName, p ' Run Post-Process script if it exists
												end if
											end if
										end if	'UPD install.exe or printui.dll
										log Date & "  " & Time & vbCrLf 
									end if		'printer exists
								end if			'printer name and IP address check
							end if				'install driver only
						end if					'If CallScript succeeds
					end if						'skip header row
					row = row + 1
				end if 						'if ubound(p) > 0	
			Loop
			oCsvDoc.Close
		else	
			log "ERROR: Cannot open document " & strFileName 
		end if
    else
		log "ERROR: File EnumPrintes3.exe is missing " 
	end if

    gLogFile.Close
	Set oCsvDoc  = nothing
	Set gLogFile = nothing
	set oFso = nothing
	
end sub

'******************************************************************************	
function CallScript(iAction, ScriptName, ServerName, cmdline)

	Dim objShell
	DIM objFSO
	Dim oExec
	Dim sCmd
	Dim i

	CallScript = 1					' default is success
	err.clear
	Set objFSO = CreateObject("Scripting.FileSystemObject")
	if (err.number = 0) then
		If objFSO.FileExists(ScriptName) Then
			sCmd = "cscript //nologo " & ScriptName 				' Format the script command line
			for i = 0 to LAST_COLUMN
				sCmd = sCmd & " " & chr(34) & cmdline(i) & chr(34)
			next
			sCmd = sCmd & " " & chr(34) & ServerName & chr(34) & " > process.log"
			if (iAction AND kActionVerbose) then log sCmd

			err.clear
			Set objShell = WScript.CreateObject("WScript.Shell")
			if (err.number = 0) then
				log "Running script: " & ScriptName
				if ((iAction AND kActionTest) = 0) then
					Set oExec = objShell.Exec (sCmd)					' Run the script
					Do While oExec.Status = 0							' wait for script to finish
						WScript.Sleep 100
					Loop

					CallScript = oExec.ExitCode							'Get the return code
					If Not oExec.StdOut.AtEndOfStream Then log oExec.StdOut.ReadAll	' Log any output
					If Not oExec.StdErr.AtEndOfStream Then log oExec.StdErr.ReadAll	' Log any errors
					log ScriptName & " returned: " & oExec.Exitcode

					Set oExec = Nothing
				end if	
				Set objShell = Nothing
			else
				log "ERROR: 0x" & hex(Err.Number) & "  " & Err.description & "creating shell object"
			end if
'		else
'			if ((iAction AND kActionTest) = 0) then
'				log "Script file missing: " & ScriptName
'			end if
		end if
		Set objFSO   = Nothing
	else
		log "ERROR: 0x" & hex(Err.Number) & "  " & Err.description & "creating file system object"
	end if

end function

'******************************************************************************	
Function PrinterExists(iAction, ServerName, cmdline)
    dim fso
	dim oShell
	dim sCmd
    
	Set oShell = CreateObject("WScript.Shell")
	if (Len(ServerName) > 0) then 
        sCmd = "EnumPrinters3.exe -n " & chr(34) & "\\" & ServerName & "\" & cmdline(PRINTER_NAME) & chr(34) 
    else
        sCmd = "EnumPrinters3.exe -n " & chr(34) & cmdline(PRINTER_NAME) & chr(34) 
	end if
	PrinterExists = oShell.Run (sCmd, 7, True)

	Set oShell = nothing
End Function

'******************************************************************************	
' Additonal command line switches can be placed in the options field like:
'  /gcfg etc.
' REVISIT:  Need to update when 5.3 releases with the /m and /s options
'******************************************************************************	
Function CreatePrinterUPD(iAction, ServerName, cmdline)

    on error resume next    
    dim oShell
    dim sCmd
	dim sQ

	CreatePrinterUPD = KErrorFailure
    if (FileExists("install.exe") = false) then
		Exit Function
    end if
    if (iAction AND kActionQuiet) then
		sQ = "/q"
	else
		sQ = ""
	end if
	
    set oShell = CreateObject("wscript.Shell")
    if Err.Number = 0 then                  
        log "Creating printer: " & cmdline(PRINTER_NAME) & " (install.exe)"
		sCmd = "install.exe " & sQ & " /npf /h /u /nd " & cmdline(OPTIONS) &_
	 		   " /n" & chr(34) & cmdline(PRINTER_NAME) & chr(34) &_
			   " /m" & chr(34) & "HP Universal Printing PCL 6 (v5.2)" & chr(34) &_
			   " /sm" & cmdline(IP_ADDRESS)          ' REVISIT: Need to change the /m option when 5.3 releases
'        if len(ServerName) > 0 then                 ' REVISIT: Need to uncomment when 5.3 releases
'            sCmd = sCmd & "/s" & ServerName
'        end if    
	    if (iAction AND kActionTest) then
			log sCmd
		else	
			if (iAction AND kActionVerbose) then log sCmd
			oShell.Run sCmd, 7, True
			if Err.Number = 0 then     
				CreatePrinterUPD = KErrorSuccess
			else
				log "ERROR: Create Printer: " & cmdline(PRINTER_NAME) & " Failed. 0x" & hex(Err.Number) & "  " & Err.description
			end if
		end if
		set oShell = nothing
	end if
End Function

'******************************************************************************	
Function CreatePort(iAction, ServerName, cmdline)
    dim fso
    dim oShell
    dim sCmd

	CreatePort = KErrorFailure
    if (FileExists("HpPrnPort.exe") = false) then
		Exit Function
    end if

	if Len(Trim(cmdline(PORT_NAME))) = 0 then						'Make up a port name if none is supplied
		cmdline(PORT_NAME) = "IP_" & cmdline(IP_ADDRESS)
		log "Port Name     : " & Trim(cmdline(PORT_NAME))
	end if

    set oShell = CreateObject("wscript.Shell")
    if Err.Number = 0 then     
        log "Creating port: " & cmdline(PORT_NAME)
		if len(ServerName) > 0 then
			sCmd = "HpPrnPort.exe -a" &_
				" -h " & cmdline(IP_ADDRESS) &_
				" -r " & chr(34) & cmdline(PORT_NAME) & chr(34) &_
				" -s " & chr(34) & ServerName & chr(34) 
		else
			sCmd = "HpPrnPort.exe -a" &_
				" -h " & cmdline(IP_ADDRESS) &_
				" -r " & chr(34) & cmdline(PORT_NAME) & chr(34)
		end if
		if (iAction AND kActionTest) then
			log sCmd
			CreatePort = KErrorSuccess
		else	
			if (iAction AND kActionVerbose) then log sCmd
			if (oShell.Run (sCmd, 7, True) = KErrorSuccess) then
				CreatePort = KErrorSuccess
				log "Successfully created port: " & cmdline(PORT_NAME)
			else
				log "ERROR: Create port: " & cmdline(PORT_NAME) & " failed"
			end if	
		end if
		set oShell = nothing
	end if
End Function

'**********************************************************************************************
Function ConfigurePrinter(iAction, ServerName, cmdline)

    on error resume next    

    dim oShell
    dim sCommentCmd
    dim sSharedCmd
    dim sPublishCmd
    dim sPrintProcCmd
    dim sPrinter
	dim sQ

    Err.Clear

    ConfigurePrinter = kErrorFailure
    if (iAction AND kActionQuiet) then
		sQ = "/q"
	else
		sQ = ""
	end if

    set oShell = CreateObject("wscript.Shell")
    if Err.Number = 0 then     
        log "Configuring printer: "& cmdline(PRINTER_NAME)

        if len(ServerName) > 0 then
            sPrinter = "\\" & ServerName & "\" & cmdline(PRINTER_NAME)
        else
            sPrinter = cmdline(PRINTER_NAME)
        end if    
                    
        sCommentCmd = "%comspec% /c rundll32 printui.dll,PrintUIEntry /Xs " & sQ & _
                      " /n " & chr(34) & sPrinter & chr(34) & _
                      " LOCATION " & chr(34) & cmdline(LOCATION) & chr(34) & _
                      " COMMENT "  & chr(34) & cmdline(COMMENT) & chr(34)
						   
						   
		if Len(cmdline(SHARE_NAME)) = 0 then						'Make up a share name if none is supplied
			cmdline(SHARE_NAME) = cmdline(PRINTER_NAME)
			log "Share Name    : " & cmdline(SHARE_NAME)
		end if
        sSharedCmd = "%comspec% /c rundll32 printui.dll,PrintUIEntry /Xs " & sQ & _
                     " /n " & chr(34) & sPrinter & chr(34) & _
                     " ShareName "  & chr(34) & cmdline(SHARE_NAME) & chr(34) &_ 
					 " attributes +Shared" 
						   
        sPublishCmd = "%comspec% /c rundll32 printui.dll,PrintUIEntry /Xs " & sQ & _
                     " /n " & chr(34) & sPrinter & chr(34) & _
					 " attributes " 

		if Len(trim(cmdline(PUBLISHED))) > 0 Then
			sPublishCmd = sPublishCmd & "+Published"
		else	
			sPublishCmd = sPublishCmd & "-Published"
		end if	

		 'Turning attributes on and off needs the /c option to specify server					
        'if len(ServerName) > 0 then
        '    sPublishCmd = sPublishCmd & " /c\\" & trim(ServerName)
        'end if

		if (iAction AND kActionTest) then
			log sCommentCmd
			log sSharedCmd
			log sPublishCmd
			ConfigureDevMode iAction, ServerName, cmdline 
            ConfigurePrinter = kErrorSuccess
		else
			if (iAction AND kActionVerbose) then log sCommentCmd
            oShell.Run sCommentCmd, 7, True
			if Err.Number <> kErrorSuccess then     
				log "ERROR: Add Comments Printer: " & cmdline(PRINTER_NAME) & " Failed. 0x" & hex(Err.Number) & "  " & Err.Description
            else
				if (iAction AND kActionVerbose) then log sSharedCmd
                oShell.Run sSharedCmd, 7, True
                if Err.Number <> kErrorSuccess then     
                    log "ERROR: Share Printer: " & cmdline(PRINTER_NAME) & " Failed. 0x" & hex(Err.Number) & "  " & Err.Description
                else
					if (iAction AND kActionVerbose) then log sPublishCmd
                    oShell.Run sPublishCmd, 7, True
                    if Err.Number <> kErrorSuccess then     
                        log "ERROR: Publish Printer: " & cmdline(PRINTER_NAME) & " Failed. 0x" & hex(Err.Number) & "  " & Err.Description
                    else
						if (ConfigureDevMode(iAction, ServerName, cmdline) = true) then
							ConfigurePrinter = kErrorSuccess
						end if	
                    end if
                end if
			end if
		end if
 		set oShell = nothing
    else
        log "Error: CreateObject wscript.shell Failed: " & hex(Err.Number) & " : " & Err.Description
    end if  'if Err.Number = 0 then     

    Err.Clear

end  function

'**********************************************************************************************
Function PostProcessPrinter(iAction, ServerName, cmdline)

	dim sCmd
	dim sExeName
	dim oShell
	dim sPrinterName

	if Len(cmdline(CFG_FILE)) < 2 then			'Nothing to do here, so exit.
		PostProcessPrinter = false
		exit function
	end if
	
	if (iAction AND kActionAmd64) then
		sExeName = "HpConvertTicket64.exe"
	else	
		sExeName = "HpConvertTicket.exe"
	end if

	if (FileExists(sExeName) = false) then
		log "ERROR: " & sExeName & " is missing, PostProcessPrinter disabled"
		PostProcessPrinter = false
		exit function
	end if

    if len(ServerName) > 0 then
		sPrinterName = "\\" & ServerName & "\" & cmdline(PRINTER_NAME) 	
    else
		sPrinterName = cmdline(PRINTER_NAME) 	
    end if    
	
    Err.Clear
	Set oShell = CreateObject("WScript.Shell")
	if Err.Number = 0 then    
		sCmd = "%comspec% /c " & sExeName &_
		" -p "   & chr(34) & sPrinterName & chr(34) &_
		" -cfg " & chr(34) & cmdline(CFG_FILE) & chr(34) &_
		" -put" 

		log "Calling " & sExeName & " using file: " & cmdline(CFG_FILE)
		if (iAction AND kActionTest) then
			log sCmd
		else
			if (iAction AND kActionVerbose) then log sCmd
			oShell.Run sCmd, 7, True
		end if
		Set oShell = nothing
    else
        log "Error: CreateObject wscript.shell Failed: " & hex(Err.Number) & " : " & Err.Description
    end if  'if Err.Number = 0 then     

	PostProcessPrinter = true

end Function

'**********************************************************************************************
Function ConfigureDevMode(iAction, ServerName, cmdline)

' media type constants for UPD
const Envelope    = 267
const Cardstock   = 273
const Heavy       = 275
const Colored     = 277
const Bond        = 279	
const Labels      = 280
const Prepunched  = 281
const Letterhead  = 282
const Preprinted  = 283
const Plain       = 284
const Unspecified = 285

' paper source constants for UPD
const Manual_feed = 258
const Tray_1      = 259
const Tray_2      = 260
const Tray_3      = 261
const Tray_4      = 262
const Tray_5      = 263
const Tray_6      = 264
const Tray_7      = 265
const Tray_8      = 266
const Env_feed    = 512

    dim oShell
	dim nSource
	dim nMediaType
	dim nPaperSize
	dim nColor
	dim nDuplex
	dim sCmdRoot
	dim sCmd8
	dim sSecurityDesc

	ConfigureDevMode = true

    if (FileExists("setprinter.exe") = false) then
		log "ERROR: Setprinter.exe is missing, ConfigureDevMode disabled"
		ConfigureDevMode = false
		exit function
	end if
	
' if the driver is not UPD, exit
	if (instr(LCase(cmdline(NEW_DRIVER_NAME)), "hp universal printing") = 0) then exit function
    log "Configuring printer settings: "& cmdline(PRINTER_NAME)

    if len(ServerName) > 0 then
		sCmdRoot = "setprinter " & chr(34) & "\\" & ServerName & "\" & cmdline(PRINTER_NAME) & chr(34) 	
    else
		sCmdRoot = "setprinter " & chr(34) & cmdline(PRINTER_NAME) & chr(34) 	
    end if    
	
	nMediaType = 0
	if (instr(LCase(cmdline(MEDIA_NAME)), "envelope") > 0)   then nMediaType = Envelope
	if (instr(LCase(cmdline(MEDIA_NAME)), "cardstock") > 0)  then nMediaType = Cardstock
	if (instr(LCase(cmdline(MEDIA_NAME)), "heavy") > 0)      then nMediaType = Heavy
	if (instr(LCase(cmdline(MEDIA_NAME)), "color") > 0)      then nMediaType = Colored
	if (instr(LCase(cmdline(MEDIA_NAME)), "bond") > 0)       then nMediaType = Bond 
	if (instr(LCase(cmdline(MEDIA_NAME)), "label") > 0)      then nMediaType = Labels 
	if (instr(LCase(cmdline(MEDIA_NAME)), "prepunched") > 0) then nMediaType = Prepunched 
	if (instr(LCase(cmdline(MEDIA_NAME)), "letterhead") > 0) then nMediaType = Letterhead 
	if (instr(LCase(cmdline(MEDIA_NAME)), "preprinted") > 0) then nMediaType = Preprinted
	if (instr(LCase(cmdline(MEDIA_NAME)), "plain") > 0)      then nMediaType = Plain

	nSource = 0
	if (instr(LCase(cmdline(SOURCE_NAME)), "maunal") > 0)   then nSource = Manual_feed
	if (instr(LCase(cmdline(SOURCE_NAME)), "tray 1") > 0)   then nSource = Tray_1
	if (instr(LCase(cmdline(SOURCE_NAME)), "tray 2") > 0)   then nSource = Tray_2
	if (instr(LCase(cmdline(SOURCE_NAME)), "tray 3") > 0)   then nSource = Tray_3
	if (instr(LCase(cmdline(SOURCE_NAME)), "tray 4") > 0)   then nSource = Tray_4
	if (instr(LCase(cmdline(SOURCE_NAME)), "tray 5") > 0)   then nSource = Tray_5
	if (instr(LCase(cmdline(SOURCE_NAME)), "tray 6") > 0)   then nSource = Tray_6
	if (instr(LCase(cmdline(SOURCE_NAME)), "tray 7") > 0)   then nSource = Tray_7
	if (instr(LCase(cmdline(SOURCE_NAME)), "tray 8") > 0)   then nSource = Tray_8
	if (instr(LCase(cmdline(SOURCE_NAME)), "envelope") > 0) then nSource = Env_feed
	
	if (IsNull(cmdline(PAPER_SIZE)) OR IsEmpty(cmdline(PAPER_SIZE)) OR Len(cmdline(PAPER_SIZE)) = 0) then 
		nPaperSize = 0
	else
		nPaperSize = cmdline(PAPER_SIZE)
	end if

	if (IsNull(cmdline(COLOR))  OR IsEmpty(cmdline(COLOR))  OR Len(cmdline(COLOR)) = 0) then 
		nColor = 0
	else
		nColor  = Left(cmdline(COLOR),1)
	end if
	
	if (IsNull(cmdline(DUPLEX)) OR IsEmpty(cmdline(DUPLEX)) OR Len(cmdline(DUPLEX)) = 0) then 
		nDuplex = 0
	else
		nDuplex = Left(cmdline(DUPLEX),1)
	end if

	if (IsNull(cmdline(SECURITY_DESC)) OR IsEmpty(cmdline(SECURITY_DESC)) OR Trim(Len(cmdline(SECURITY_DESC))) = 0) then 
		sSecurityDesc = ""
	else
		sSecurityDesc = trim(cmdline(SECURITY_DESC))
	end if

	
    Err.Clear
	Set oShell = CreateObject("WScript.Shell")
	if Err.Number = 0 then    

		if (nMediaType) then		'else leave it as the driver default
			sCmd8 = sCmdRoot & " 8 " & chr(34) & "pdevmode=dmMediaType=" & nMediaType & chr(34)
			if (iAction AND kActionTest) then
				log sCmd8
			else
				if (iAction AND kActionVerbose) then log sCmd8
				log "Configuring default Media type: " & nMediaType
				oShell.Run sCmd8, 7, True
			end if
		end if		

		if (nSource) then			'else leave it as the driver default
			sCmd8 = sCmdRoot & " 8 " & chr(34) & "pdevmode=dmDefaultSource=" & nSource & chr(34)
			if (iAction AND kActionTest) then
				log sCmd8
			else
				if (iAction AND kActionVerbose) then log sCmd8
				log "Configuring default Source: " & nSource
				oShell.Run sCmd8, 7, True
			end if		
		end if	

		if ((nPaperSize > 1) AND (nPaperSize < 256)) then	' No mapping table for driver specific numbers
			sCmd8 = sCmdRoot & " 8 " & chr(34) & "pdevmode=dmPaperSize=" & nPaperSize & chr(34)
			if (iAction AND kActionTest) then
				log sCmd8
			else
				if (iAction AND kActionVerbose) then log sCmd8
				log "Configuring default Paper Size: " & nPaperSize
				oShell.Run sCmd8, 7, True
			end if		
		end if

		if (nColor) then
			sCmd8 = sCmdRoot & " 8 " & chr(34) & "pdevmode=dmColor=" & nColor & chr(34)
			if (iAction AND kActionTest) then
				log sCmd8
			else
				if (iAction AND kActionVerbose) then log sCmd8
				log "Configuring Color: " & nColor
				oShell.Run sCmd8, 7, True
			end if		
		end if

		if (nDuplex) then 
			sCmd8 = sCmdRoot & " 8 " & chr(34) & "pdevmode=dmDuplex=" & nDuplex & chr(34)
			if (iAction AND kActionTest) then
				log sCmd8
			else
				if (iAction AND kActionVerbose) then log sCmd8
				log "Configuring Duplex: " & nDuplex
				oShell.Run sCmd8, 7, True
			end if
		end if
		
		if (Len(sSecurityDesc) > 0) then
			sCmd8 = sCmdRoot & " 3 " & chr(34) & "pSecurityDescriptor=" & sSecurityDesc & chr(34)
			if (iAction AND kActionTest) then
				log sCmd8
			else
				if (iAction AND kActionVerbose) then log sCmd8
				log "Configuring DACL settings:"
				oShell.Run sCmd8, 7, True
			end if
		end if		

		Set oShell = nothing
    else
        log "Error: CreateObject wscript.shell Failed: " & hex(Err.Number) & " : " & Err.Description
    end if  'if Err.Number = 0 then     
   

end Function

'**********************************************************************************************
Function CreatePrinterEx(iAction, ServerName, cmdline)

    on error resume next    

    dim oShell
    dim fso
    dim sInstallCmd
    dim sPrinter
	dim sQ

    Err.Clear

    CreatePrinterEx = kErrorFailure
    if (iAction AND kActionQuiet) then
		sQ = "/q"
	else
		sQ = ""
	end if

	if Len(cmdline(OPTIONS)) > 0 then 				' an inf file was specified
		Set fso = CreateObject("Scripting.FileSystemObject")
		if Err.Number = 0 then    
			If (fso.FileExists(cmdline(OPTIONS)) = false) Then
				log "ERROR: Inf file path is incorrect, or file is missing " & cmdline(OPTIONS)
				Exit Function
			else
				if (iAction AND kActionTest) then
					if (DriverNameExists(fso, cmdline(NEW_DRIVER_NAME), cmdline(OPTIONS)) = false) then
						log "ERROR: Inf file does not contain driver name: " & cmdline(NEW_DRIVER_NAME)
						Exit Function
					end if	
				end if	
			end if
		    set fso = nothing
		else   
            log "ERROR:1 Unable to create file system object 0x" & hex(Err.Number) & "  " & Err.Description
        end if    
	end if

    set oShell = CreateObject("wscript.Shell")
    if Err.Number = 0 then     
        log "Creating printer: "& cmdline(PRINTER_NAME)
        sInstallCmd = "%comspec% /c rundll32 printui.dll,PrintUIEntry /if /Z " & sQ & " /u " & _
                   " /b " & chr(34) & cmdline(PRINTER_NAME) & chr(34) & _
                   " /f " & chr(34) & cmdline(OPTIONS) & chr(34) & _
                   " /r " & chr(34) & cmdline(PORT_NAME) & chr(34) & _
                   " /m " & chr(34) & cmdline(NEW_DRIVER_NAME) & chr(34)

        if len(ServerName) > 0 then
            sInstallCmd = sInstallCmd & " /c\\" & trim(ServerName)
        end if

		if (iAction AND kActionTest) then
			log sInstallCmd
			CreatePrinterEx = kErrorSuccess
		else
			if (iAction AND kActionVerbose) then log sInstallCmd
			oShell.Run sInstallCmd, 7, True
			if Err.Number <> kErrorSuccess then     
				log "ERROR: Create Printer: " & cmdline(PRINTER_NAME) & " Failed. 0x" & hex(Err.Number) & "  " & Err.Description
			end if

			If PrinterExists(iAction, ServerName, cmdline) Then
				log "Successfully created printer: "& cmdline(PRINTER_NAME)
				CreatePrinterEx = kErrorSuccess
			else
				log "Error: CreatePrinterEx Failed: " & hex(Err.Number) & " : " & Err.Description
			end if
		end if

 		set oShell = nothing
    else
        log "Error: CreateObject wscript.shell Failed: " & hex(Err.Number) & " : " & Err.Description
    end if  'if Err.Number = 0 then     

    Err.Clear

end  function

'******************************************************************************	
Function FileExists(strFileName)
    dim fso
    FileExists = false

	err.clear
	Set fso = CreateObject("Scripting.FileSystemObject")
	if Err.Number = 0 then    
		If (fso.FileExists(strFileName) = false) Then
            log "ERROR: " & strFileName & " is missing "
        else
            FileExists = true
		end if
	    set fso = nothing
	else   
        log "ERROR:2 Unable to create file system object 0x" & hex(Err.Number) & "  " & Err.Description
    end if    
end function

'******************************************************************************	
function DriverNameExists(oFso, sDriverName, sInfName)
	const ForReading         =  1
	const TristateTrue       = -1 'Opens the file as Unicode 
	const TristateFalse      =  0 'Opens the file as ASCII 
	const TristateUseDefault = -2 'Use default system setting 
	dim oInfFile
	dim strLine

	DriverNameExists = false
	wscript.echo chr(34) & trim(sDriverName) & chr(34) & "  " & chr(34) & sInfName & chr(34)
	Set oInfFile = oFso.OpenTextFile(sInfName, ForReading, False, TristateUseDefault)
	If Err = 0 then
		Do While oInfFile.AtEndOfStream <> True
			strLine = oInfFile.ReadLine
			if (instr(strline, trim(sDriverName)) > 0) then
				DriverNameExists = true
			end if
		Loop
		oInfFile.Close
		set oInfFile = nothing
	else
		wscript.echo "Open file failed"
	end if
end function
    
'******************************************************************************	
Function DriverExists(iAction, ServerName, cmdline)
    dim fso
	dim oShell
	dim sCmd
    
	Set oShell = CreateObject("WScript.Shell")
	if (Len(ServerName) > 0) then 
        sCmd = "EnumPrinters3.exe -d " & chr(34) & cmdline(NEW_DRIVER_NAME) & chr(34) & " " & chr(34) & ServerName & chr(34) 
    else
        sCmd = "EnumPrinters3.exe -d " & chr(34) & cmdline(NEW_DRIVER_NAME) & chr(34) 
	end if
	DriverExists = oShell.Run (sCmd, 7, True)

	Set oShell = nothing
End Function

'******************************************************************************	
function InstallAlternateDriver (iAction, ServerName, cmdline)

    on error resume next    

    dim oShell
    dim sCmd
	dim fso
	dim arch
	dim sQ
	
    Err.Clear

	InstallAlternateDriver = false

    if (Is64Bit) Then
		arch = "Intel"		'Alternate driver is 32 bit
    else
		arch = "x64"		'Alternate driver is 64 bit
	end if

    if (iAction AND kActionQuiet) then
		sQ = "/q"
	else
		sQ = ""
	end if

	if Len(cmdline(OPTIONS)) > 0 then 				' an inf file was specified
		Set fso = CreateObject("Scripting.FileSystemObject")
		if Err.Number = 0 then    
			If (fso.FileExists(cmdline(OPTIONS)) = false) Then
				log "ERROR: Inf file path is incorrect, or file is missing " & cmdline(OPTIONS)
				Exit Function
			else
				if (iAction AND kActionTest) then
					if (DriverNameExists(fso, cmdline(NEW_DRIVER_NAME), cmdline(OPTIONS)) = false) then
						log "ERROR: Inf file does not contain driver name: " & cmdline(NEW_DRIVER_NAME)
						Exit Function
					end if	
				end if	
			end if
		    set fso = nothing
		else   
            log "ERROR:1 Unable to create file system object 0x" & hex(Err.Number) & "  " & Err.Description
        end if    
	end if

    set oShell = CreateObject("wscript.Shell")
    if Err.Number = 0 then     
'	    rundll32 printui.dll,PrintUIEntry /ia /m "AGFA-AccuSet v52.3" /h "Intel" /v "Windows 2000 or XP" /f %windir%\inf\ntprint.inf
        sCmd = "%comspec% /c rundll32 printui.dll,PrintUIEntry /ia " & _
                " /m " & chr(34) & cmdline(NEW_DRIVER_NAME) & chr(34) & _
				" /h " & chr(34) & arch & chr(34) & _
				" /v " & chr(34) & "Windows XP" & chr(34) & _
                " /f " & chr(34) & cmdline(OPTIONS) & chr(34)

        if len(ServerName) > 0 then
            sCmd = sCmd & " /c\\" & trim(ServerName)
        end if

		if (iAction AND kActionTest) then
			log sCmd
			CreatePrinterEx = kErrorSuccess
		else
			if (iAction AND kActionVerbose) then log sCmd
			log "Installing Driver: "& cmdline(NEW_DRIVER_NAME) 
			oShell.Run sCmd, 7, True
		end if
		set oShell = nothing
    else
        log "ERROR: CreateObject wscript.shell Failed: " & hex(Err.Number) & " : " & Err.Description
    end if

    Err.Clear

end function
'**********************************************************************************************

sub DisplayPrinterInformation(iAction, ServerName, cmdline)

    log "" 
    if (iAction AND kActionTest) then
        log "Test Mode"
    end if
    log "Server Name     : " & ServerName
    log "Current Driver  : " & cmdline(OLD_DRIVER_NAME)
    log "Version         : " & cmdline(VERSION)
    log "New Driver Name : " & cmdline(NEW_DRIVER_NAME)
    log "INF path        : " & cmdline(OPTIONS)
    log "Printer Name    : " & cmdline(PRINTER_NAME)
    log "Device Model    : " & cmdline(PRINTER_MODEL)
    log "IP Address      : " & cmdline(IP_ADDRESS)
    log "Port Name       : " & cmdline(PORT_NAME)
    log "Location        : " & cmdline(LOCATION)
    log "Comment         : " & cmdline(COMMENT)
	log "Is Shared       : " & cmdline(IS_SHARED)
    log "Share Name      : " & cmdline(SHARE_NAME)
	log "Is Published    : " & cmdline(PUBLISHED)
    log "Build Number    : " & cmdline(BUILD_NUMBER)
    log "Print Processor : " & cmdline(PRINT_PROCESSOR)
    log "Color           : " & cmdline(COLOR)
    log "Copies          : " & cmdline(COPIES)
    log "Paper Source    : " & cmdline(SOURCE)
    log "Source Name     : " & cmdline(SOURCE_NAME)
    log "Duplex          : " & cmdline(DUPLEX)
    log "Paper Size      : " & cmdline(PAPER_SIZE)
    log "Form Name       : " & cmdline(FORM_NAME)
    log "Media Type      : " & cmdline(MEDIA_TYPE)
    log "Media Name      : " & cmdline(MEDIA_NAME)
    log "Duplex HW       : " & cmdline(DUPLEX_HW)
    log "Orientation     : " & cmdline(ORIENTATION)
    log "Quality         : " & cmdline(QUALITY)
    log "Spare 1         : " & cmdline(CFG_FILE)
    log "Spare 2         : " & cmdline(SPARE_2)
    'log "Spare 3         : " & cmdline(SPARE_3)
    log "Serial Number   : " & cmdline(SERIAL_NUMBER)
    log "" 
end sub                

'**********************************************************************************************
function ParseCommandLine(iAction, ServerName, PrinterFileName, LogFileName)

    on error resume next    

    dim oArgs
    dim iIndex

'    Err.Clear
    ParseCommandLine = true
    
    iAction = kActionUnknown
    iIndex  = 0
    ServerName  = ""
	LogFileName = "HpInstall.log"

    set oArgs = wscript.Arguments

    while iIndex < oArgs.Count
        select case oArgs(iIndex)
            case "-t"
                iAction = iAction + kActionTest

			case "-v"
                iAction = iAction + kActionVerbose

			case "-ia"
                iAction = iAction + kActionDriverOnly
				
			case "-q"
                iAction = iAction + kActionQuiet

			case "-s"
                iIndex = iIndex + 1
                ServerName = RemoveBackslashes(oArgs(iIndex))

            case "-f"
                iIndex = iIndex + 1
                PrinterFileName = trim(oArgs(iIndex))

            case "-l"
                iIndex = iIndex + 1
                LogFileName = trim(oArgs(iIndex))

			case "-?"
                Usage(true)
                exit function

            case else						'unidentified option or parameter
                Usage(false)				'print out proper usage
				ParseCommandLine = false 	'return error       
                exit function				'stop parsing

        end select
        iIndex = iIndex + 1
    wend    
	if (Is64Bit()) Then iAction = iAction + kActionAmd64

	set oArgs = nothing
    
end  function

'**********************************************************************************************
sub Usage(bExit)

    wscript.echo "Usage: InstallFromCSV.vbs [-s <server name>] [-f <file name>] [-t] [-ia] [-v] [-?]"
    wscript.echo " "               
    wscript.echo "Arguments:"
    wscript.echo "-s     - server name (optional, default is current computer)"
    wscript.echo "-f     - CSV file name (optional, default is printers.csv)"
    wscript.echo "-t     - Test mode, output parameters only  (optional)"
    wscript.echo "-ia    - install the alternate driver, does not create any printers (optional)"
    wscript.echo "-v     - Verbose mode, include diagnostic information in log file  (optional)"
    wscript.echo "-?     - display command usage"

    if bExit then
        wscript.quit(1)
    end if

end sub

'*******************************************************************************
'
' Determines which program is being used to run this script. 
' Returns true if the script host is cscript.exe
'
function IsHostCscript()

    on error resume next
    
    dim strFullName 
    dim strCommand 
    dim i, j 
    dim bReturn
    
    bReturn     = false
    strFullName = WScript.FullName
    
    i = InStr(1, strFullName, ".exe", 1)
    if i <> 0 then
        j = InStrRev(strFullName, "\", i, 1)
        if j <> 0 then
            strCommand = Mid(strFullName, j+1, i-j-1)
            if LCase(strCommand) = "cscript" then
                bReturn = true  
            end if    
        end if
    end if
    IsHostCscript = bReturn

end function

'*******************************************************************************
function RemoveBackslashes(strServer)
    dim strRet
    strRet = strServer
    if Left(strServer, 2) = "\\" and Len(strServer) > 2 then 
        strRet = Mid(strServer, 3) 
    end if   
    RemoveBackslashes = strRet
end function

'*******************************************************************************
function Is64Bit()
	dim objShell, arch

	Set objShell = WScript.CreateObject("WScript.Shell")
	arch = objShell.RegRead("HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment\PROCESSOR_ARCHITECTURE")
	If arch = "x86" Then
		Is64Bit = false
	Else
		Is64Bit = true
	End If
	set objShell = nothing
end function

'******************************************************************************	
sub Log(string)
    gLogFile.WriteLine string
	if gHostScript then
		wscript.echo string
	end if	
end sub
'' SIG '' Begin signature block
'' SIG '' MIIZSgYJKoZIhvcNAQcCoIIZOzCCGTcCAQExCzAJBgUr
'' SIG '' DgMCGgUAMGcGCisGAQQBgjcCAQSgWTBXMDIGCisGAQQB
'' SIG '' gjcCAR4wJAIBAQQQTvApFpkntU2P5azhDxfrqwIBAAIB
'' SIG '' AAIBAAIBAAIBADAhMAkGBSsOAwIaBQAEFJO6ZAsO6jQ8
'' SIG '' GDuWKI/7jc1V8/JOoIIURDCCA+4wggNXoAMCAQICEH6T
'' SIG '' 6/t8xk5Z6kuad9QG/DswDQYJKoZIhvcNAQEFBQAwgYsx
'' SIG '' CzAJBgNVBAYTAlpBMRUwEwYDVQQIEwxXZXN0ZXJuIENh
'' SIG '' cGUxFDASBgNVBAcTC0R1cmJhbnZpbGxlMQ8wDQYDVQQK
'' SIG '' EwZUaGF3dGUxHTAbBgNVBAsTFFRoYXd0ZSBDZXJ0aWZp
'' SIG '' Y2F0aW9uMR8wHQYDVQQDExZUaGF3dGUgVGltZXN0YW1w
'' SIG '' aW5nIENBMB4XDTEyMTIyMTAwMDAwMFoXDTIwMTIzMDIz
'' SIG '' NTk1OVowXjELMAkGA1UEBhMCVVMxHTAbBgNVBAoTFFN5
'' SIG '' bWFudGVjIENvcnBvcmF0aW9uMTAwLgYDVQQDEydTeW1h
'' SIG '' bnRlYyBUaW1lIFN0YW1waW5nIFNlcnZpY2VzIENBIC0g
'' SIG '' RzIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB
'' SIG '' AQCxrLNJVEuXHBIK2CV5kSJXKm/cuCbEQ3Nrwr8uUFr7
'' SIG '' FMJ2jkMBJUO0oeJF9Oi3e8N0zCLXtJQAAvdN7b+0t0Qk
'' SIG '' a81fRTvRRM5DEnMXgotptCvLmR6schsmTXEfsTHd+1Fh
'' SIG '' AlOmqvVJLAV4RaUvic7nmef+jOJXPz3GktxK+Hsz5HkK
'' SIG '' +/B1iEGc/8UDUZmq12yfk2mHZSmDhcJgFMTIyTsU2sCB
'' SIG '' 8B8NdN6SIqvK9/t0fCfm90obf6fDni2uiuqm5qonFn1h
'' SIG '' 95hxEbziUKFL5V365Q6nLJ+qZSDT2JboyHylTkhE/xni
'' SIG '' RAeSC9dohIBdanhkRc1gRn5UwRN8xXnxycFxAgMBAAGj
'' SIG '' gfowgfcwHQYDVR0OBBYEFF+a9W5czMx0mtTdfe8/2+xM
'' SIG '' gC7dMDIGCCsGAQUFBwEBBCYwJDAiBggrBgEFBQcwAYYW
'' SIG '' aHR0cDovL29jc3AudGhhd3RlLmNvbTASBgNVHRMBAf8E
'' SIG '' CDAGAQH/AgEAMD8GA1UdHwQ4MDYwNKAyoDCGLmh0dHA6
'' SIG '' Ly9jcmwudGhhd3RlLmNvbS9UaGF3dGVUaW1lc3RhbXBp
'' SIG '' bmdDQS5jcmwwEwYDVR0lBAwwCgYIKwYBBQUHAwgwDgYD
'' SIG '' VR0PAQH/BAQDAgEGMCgGA1UdEQQhMB+kHTAbMRkwFwYD
'' SIG '' VQQDExBUaW1lU3RhbXAtMjA0OC0xMA0GCSqGSIb3DQEB
'' SIG '' BQUAA4GBAAMJm495739ZMKrvaLX64wkdu0+CBl03X6ZS
'' SIG '' nxaN6hySCURu9W3rWHww6PlpjSNzCxJvR6muORH4KrGb
'' SIG '' sBrDjutZlgCtzgxNstAxpghcKnr84nodV0yoZRjpeUBi
'' SIG '' JZZux8c3aoMhCI5B6t3ZVz8dd0mHKhYGXqY4aiISo1EZ
'' SIG '' g362MIIEozCCA4ugAwIBAgIQDs/0OMj+vzVuBNhqmBsa
'' SIG '' UDANBgkqhkiG9w0BAQUFADBeMQswCQYDVQQGEwJVUzEd
'' SIG '' MBsGA1UEChMUU3ltYW50ZWMgQ29ycG9yYXRpb24xMDAu
'' SIG '' BgNVBAMTJ1N5bWFudGVjIFRpbWUgU3RhbXBpbmcgU2Vy
'' SIG '' dmljZXMgQ0EgLSBHMjAeFw0xMjEwMTgwMDAwMDBaFw0y
'' SIG '' MDEyMjkyMzU5NTlaMGIxCzAJBgNVBAYTAlVTMR0wGwYD
'' SIG '' VQQKExRTeW1hbnRlYyBDb3Jwb3JhdGlvbjE0MDIGA1UE
'' SIG '' AxMrU3ltYW50ZWMgVGltZSBTdGFtcGluZyBTZXJ2aWNl
'' SIG '' cyBTaWduZXIgLSBHNDCCASIwDQYJKoZIhvcNAQEBBQAD
'' SIG '' ggEPADCCAQoCggEBAKJjCzlEuLsjp0RJuw7/ofBhClOT
'' SIG '' sJjbrSwPSsVu/4Y8U1UPFc4EPyv9qZaW2b5heQtbyUyG
'' SIG '' duXgQ0sile7CK0PBn9hotI5AT+6FOLkRxSPyZFjwFTJv
'' SIG '' TlehroikAtcqHs1L4d1j1ReJMluwXplaqJ0oUA4X7pbb
'' SIG '' YTtFUR3PElYLkkf8q672Zj1HrHBy55LnX80QucSDZJQZ
'' SIG '' vSWA4ejSIqXQugJ6oXeTW2XD7hd0vEGGKtwITIySjJEt
'' SIG '' nndEH2jWqHR32w5bMotWizO92WPISZ06xcXqMwvS8aMb
'' SIG '' 9Iu+2bNXizveBKd6IrIkri7HcMW+ToMmCPsLvalPmQjh
'' SIG '' EChyqs0CAwEAAaOCAVcwggFTMAwGA1UdEwEB/wQCMAAw
'' SIG '' FgYDVR0lAQH/BAwwCgYIKwYBBQUHAwgwDgYDVR0PAQH/
'' SIG '' BAQDAgeAMHMGCCsGAQUFBwEBBGcwZTAqBggrBgEFBQcw
'' SIG '' AYYeaHR0cDovL3RzLW9jc3Aud3Muc3ltYW50ZWMuY29t
'' SIG '' MDcGCCsGAQUFBzAChitodHRwOi8vdHMtYWlhLndzLnN5
'' SIG '' bWFudGVjLmNvbS90c3MtY2EtZzIuY2VyMDwGA1UdHwQ1
'' SIG '' MDMwMaAvoC2GK2h0dHA6Ly90cy1jcmwud3Muc3ltYW50
'' SIG '' ZWMuY29tL3Rzcy1jYS1nMi5jcmwwKAYDVR0RBCEwH6Qd
'' SIG '' MBsxGTAXBgNVBAMTEFRpbWVTdGFtcC0yMDQ4LTIwHQYD
'' SIG '' VR0OBBYEFEbGaaMOShQe1UzaUmMXP142vA3mMB8GA1Ud
'' SIG '' IwQYMBaAFF+a9W5czMx0mtTdfe8/2+xMgC7dMA0GCSqG
'' SIG '' SIb3DQEBBQUAA4IBAQB4O7SRKgBM8I9iMDd4o4QnB28Y
'' SIG '' st4l3KDUlAOqhk4ln5pAAxzdzuN5yyFoBtq2MrRtv/Qs
'' SIG '' JmMz5ElkbQ3mw2cO9wWkNWx8iRbG6bLfsundIMZxD82V
'' SIG '' dNy2XN69Nx9DeOZ4tc0oBCCjqvFLxIgpkQ6A0RH83Vx2
'' SIG '' bk9eDkVGQW4NsOo4mrE62glxEPwcebSAe6xp9P2ctgwW
'' SIG '' K/F/Wwk9m1viFsoTgW0ALjgNqCmPLOGy9FqpAa8VnCwv
'' SIG '' SRvbIrvD/niUUcOGsYKIXfA9tFGheTMrLnu53CAJE3Hr
'' SIG '' ahlbz+ilMFcsiUk/uc9/yb8+ImhjU5q9aXSsxR08f5Lg
'' SIG '' w7wc2AR1MIIFmTCCBIGgAwIBAgIQek15SwtA1sKF5Kuj
'' SIG '' /CAmrDANBgkqhkiG9w0BAQUFADCBtDELMAkGA1UEBhMC
'' SIG '' VVMxFzAVBgNVBAoTDlZlcmlTaWduLCBJbmMuMR8wHQYD
'' SIG '' VQQLExZWZXJpU2lnbiBUcnVzdCBOZXR3b3JrMTswOQYD
'' SIG '' VQQLEzJUZXJtcyBvZiB1c2UgYXQgaHR0cHM6Ly93d3cu
'' SIG '' dmVyaXNpZ24uY29tL3JwYSAoYykxMDEuMCwGA1UEAxMl
'' SIG '' VmVyaVNpZ24gQ2xhc3MgMyBDb2RlIFNpZ25pbmcgMjAx
'' SIG '' MCBDQTAeFw0xMTA1MTcwMDAwMDBaFw0xNDA1MTYyMzU5
'' SIG '' NTlaMIHcMQswCQYDVQQGEwJVUzEWMBQGA1UECBMNTWFz
'' SIG '' c2FjaHVzZXR0czEQMA4GA1UEBxMHQW5kb3ZlcjEgMB4G
'' SIG '' A1UEChQXSGV3bGV0dC1QYWNrYXJkIENvbXBhbnkxPjA8
'' SIG '' BgNVBAsTNURpZ2l0YWwgSUQgQ2xhc3MgMyAtIE1pY3Jv
'' SIG '' c29mdCBTb2Z0d2FyZSBWYWxpZGF0aW9uIHYyMR8wHQYD
'' SIG '' VQQLFBZQcm9kdWN0IERldmVsb3BtZW50IElUMSAwHgYD
'' SIG '' VQQDFBdIZXdsZXR0LVBhY2thcmQgQ29tcGFueTCCASIw
'' SIG '' DQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAIzhXP/p
'' SIG '' 063Ocr3wzFPp9UANDoViFY5rgfoZXMGJUIZ/b2vZB2EE
'' SIG '' rVRY83dS1EewWcdV1/UUF179CPmy1sVD+6wtiE1E4xFH
'' SIG '' O47aLykpFa1wEi7/KlXqOaabILE9c12J4Lgydk8a5XBC
'' SIG '' rcZtY3wjKlTInz+fiSCu5+SNQx7yzEa0VELkUx0noTb1
'' SIG '' nxnxxY0FYdHzUDVnFcOE6LiIA+KFBS6P6LqrunoS27bI
'' SIG '' cSQJfqI700a6okgqZZJFryIIz1ZBhbkZ+ZMtUGB1kCy9
'' SIG '' p2W9KWyt9mkKiKgiEZ4acmgb8dhStBhS4pfvdTbC5EhH
'' SIG '' 02tYRNjFUmOvbGHYISLmIkFPy+sCAwEAAaOCAXswggF3
'' SIG '' MAkGA1UdEwQCMAAwDgYDVR0PAQH/BAQDAgeAMEAGA1Ud
'' SIG '' HwQ5MDcwNaAzoDGGL2h0dHA6Ly9jc2MzLTIwMTAtY3Js
'' SIG '' LnZlcmlzaWduLmNvbS9DU0MzLTIwMTAuY3JsMEQGA1Ud
'' SIG '' IAQ9MDswOQYLYIZIAYb4RQEHFwMwKjAoBggrBgEFBQcC
'' SIG '' ARYcaHR0cHM6Ly93d3cudmVyaXNpZ24uY29tL3JwYTAT
'' SIG '' BgNVHSUEDDAKBggrBgEFBQcDAzBxBggrBgEFBQcBAQRl
'' SIG '' MGMwJAYIKwYBBQUHMAGGGGh0dHA6Ly9vY3NwLnZlcmlz
'' SIG '' aWduLmNvbTA7BggrBgEFBQcwAoYvaHR0cDovL2NzYzMt
'' SIG '' MjAxMC1haWEudmVyaXNpZ24uY29tL0NTQzMtMjAxMC5j
'' SIG '' ZXIwHwYDVR0jBBgwFoAUz5mp6nsm9EvJjo/X8AUm7+PS
'' SIG '' p50wEQYJYIZIAYb4QgEBBAQDAgQQMBYGCisGAQQBgjcC
'' SIG '' ARsECDAGAQEAAQH/MA0GCSqGSIb3DQEBBQUAA4IBAQB2
'' SIG '' cD+Z75mvL+z+4bmyxasX3jLTFruETIeDiHFHVvT01BRY
'' SIG '' TM3NhI1DAtrmYsEsF63+91ajbS5ebSoyXZhJUl/VMnrk
'' SIG '' FrAVeLAANyRyuHiLuaJK9F1jIW+H9oPKmUwxkCoIfH9f
'' SIG '' xYYwlCJX6ec3ceTCfwTbVWCxSIR0Xq9SKMS6geocAaFG
'' SIG '' uQSVLX/qAbmjvDQwvPs+GlACKrebTkspzG3lXaMBkC5K
'' SIG '' xd31zwm7S5TxV2g6y71iScH1igwxJhTFa3AoeyMf/9M2
'' SIG '' fiNWmbnTSf0Nw6XwVWSAF0m7nQOOiSlQPWAUwNKU2e3E
'' SIG '' p+eJOGBTh1fBe0tAm4C7PPaY2dVYqcATMIIGCjCCBPKg
'' SIG '' AwIBAgIQUgDlqiVW/BqG7ZbJ1EszxzANBgkqhkiG9w0B
'' SIG '' AQUFADCByjELMAkGA1UEBhMCVVMxFzAVBgNVBAoTDlZl
'' SIG '' cmlTaWduLCBJbmMuMR8wHQYDVQQLExZWZXJpU2lnbiBU
'' SIG '' cnVzdCBOZXR3b3JrMTowOAYDVQQLEzEoYykgMjAwNiBW
'' SIG '' ZXJpU2lnbiwgSW5jLiAtIEZvciBhdXRob3JpemVkIHVz
'' SIG '' ZSBvbmx5MUUwQwYDVQQDEzxWZXJpU2lnbiBDbGFzcyAz
'' SIG '' IFB1YmxpYyBQcmltYXJ5IENlcnRpZmljYXRpb24gQXV0
'' SIG '' aG9yaXR5IC0gRzUwHhcNMTAwMjA4MDAwMDAwWhcNMjAw
'' SIG '' MjA3MjM1OTU5WjCBtDELMAkGA1UEBhMCVVMxFzAVBgNV
'' SIG '' BAoTDlZlcmlTaWduLCBJbmMuMR8wHQYDVQQLExZWZXJp
'' SIG '' U2lnbiBUcnVzdCBOZXR3b3JrMTswOQYDVQQLEzJUZXJt
'' SIG '' cyBvZiB1c2UgYXQgaHR0cHM6Ly93d3cudmVyaXNpZ24u
'' SIG '' Y29tL3JwYSAoYykxMDEuMCwGA1UEAxMlVmVyaVNpZ24g
'' SIG '' Q2xhc3MgMyBDb2RlIFNpZ25pbmcgMjAxMCBDQTCCASIw
'' SIG '' DQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAPUjS16l
'' SIG '' 14q7MunUV/fv5Mcmfq0ZmP6onX2U9jZrENd1gTB/BGh/
'' SIG '' yyt1Hs0dCIzfaZSnN6Oce4DgmeHuN01fzjsU7obU0PUn
'' SIG '' NbwlCzinjGOdF6MIpauw+81qYoJM1SHaG9nx44Q7iipP
'' SIG '' hVuQAU/Jp3YQfycDfL6ufn3B3fkFvBtInGnnwKQ8PEEA
'' SIG '' Pt+W5cXklHHWVQHHACZKQDy1oSapDKdtgI6QJXvPvz8c
'' SIG '' 6y+W+uWHd8a1VrJ6O1QwUxvfYjT/HtH0WpMoheVMF05+
'' SIG '' W/2kk5l/383vpHXv7xX2R+f4GXLYLjQaprSnTH69u08M
'' SIG '' PVfxMNamNo7WgHbXGS6lzX40LYkCAwEAAaOCAf4wggH6
'' SIG '' MBIGA1UdEwEB/wQIMAYBAf8CAQAwcAYDVR0gBGkwZzBl
'' SIG '' BgtghkgBhvhFAQcXAzBWMCgGCCsGAQUFBwIBFhxodHRw
'' SIG '' czovL3d3dy52ZXJpc2lnbi5jb20vY3BzMCoGCCsGAQUF
'' SIG '' BwICMB4aHGh0dHBzOi8vd3d3LnZlcmlzaWduLmNvbS9y
'' SIG '' cGEwDgYDVR0PAQH/BAQDAgEGMG0GCCsGAQUFBwEMBGEw
'' SIG '' X6FdoFswWTBXMFUWCWltYWdlL2dpZjAhMB8wBwYFKw4D
'' SIG '' AhoEFI/l0xqGrI2Oa8PPgGrUSBgsexkuMCUWI2h0dHA6
'' SIG '' Ly9sb2dvLnZlcmlzaWduLmNvbS92c2xvZ28uZ2lmMDQG
'' SIG '' A1UdHwQtMCswKaAnoCWGI2h0dHA6Ly9jcmwudmVyaXNp
'' SIG '' Z24uY29tL3BjYTMtZzUuY3JsMDQGCCsGAQUFBwEBBCgw
'' SIG '' JjAkBggrBgEFBQcwAYYYaHR0cDovL29jc3AudmVyaXNp
'' SIG '' Z24uY29tMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEF
'' SIG '' BQcDAzAoBgNVHREEITAfpB0wGzEZMBcGA1UEAxMQVmVy
'' SIG '' aVNpZ25NUEtJLTItODAdBgNVHQ4EFgQUz5mp6nsm9EvJ
'' SIG '' jo/X8AUm7+PSp50wHwYDVR0jBBgwFoAUf9Nlp8Ld7Lvw
'' SIG '' MAnzQzn6Aq8zMTMwDQYJKoZIhvcNAQEFBQADggEBAFYi
'' SIG '' 5jSkxGHLSLkBrVaoZA/ZjJHEu8wM5a16oCJ/30c4Si1s
'' SIG '' 0X9xGnzscKmx8E/kDwxT+hVe/nSYSSSFgSYckRRHsExj
'' SIG '' jLuhNNTGRegNhSZzA9CpjGRt3HGS5kUFYBVZUTn8WBRr
'' SIG '' /tSk7XlrCAxBcuc3IgYJviPpP0SaHulhncyxkFz8PdKN
'' SIG '' rEI9ZTbUtD1AKI+bEM8jJsxLIMuQH12MTDTKPNjlN9Zv
'' SIG '' pSC9NOsm2a4N58Wa96G0IZEzb4boWLslfHQOWP51G2M/
'' SIG '' zjF8m48blp7FU3aEW5ytkfqs7ZO6XcghU8KCU2OvEg1Q
'' SIG '' hxEbPVRSloosnD2SGgiaBS7Hk6VIkdMxggRyMIIEbgIB
'' SIG '' ATCByTCBtDELMAkGA1UEBhMCVVMxFzAVBgNVBAoTDlZl
'' SIG '' cmlTaWduLCBJbmMuMR8wHQYDVQQLExZWZXJpU2lnbiBU
'' SIG '' cnVzdCBOZXR3b3JrMTswOQYDVQQLEzJUZXJtcyBvZiB1
'' SIG '' c2UgYXQgaHR0cHM6Ly93d3cudmVyaXNpZ24uY29tL3Jw
'' SIG '' YSAoYykxMDEuMCwGA1UEAxMlVmVyaVNpZ24gQ2xhc3Mg
'' SIG '' MyBDb2RlIFNpZ25pbmcgMjAxMCBDQQIQek15SwtA1sKF
'' SIG '' 5Kuj/CAmrDAJBgUrDgMCGgUAoHAwEAYKKwYBBAGCNwIB
'' SIG '' DDECMAAwGQYJKoZIhvcNAQkDMQwGCisGAQQBgjcCAQQw
'' SIG '' HAYKKwYBBAGCNwIBCzEOMAwGCisGAQQBgjcCARUwIwYJ
'' SIG '' KoZIhvcNAQkEMRYEFEgAYlapTyYOk1Jsz14AKRq7qTA4
'' SIG '' MA0GCSqGSIb3DQEBAQUABIIBAFOctXFa0WieIyc1aAvu
'' SIG '' /zt5y1UPhIzSF2OpJIY9aR9w6jj4niRvO4LgXI4BrDFQ
'' SIG '' /gJ16gWnKkOjkIztdRMrwkJjaF2W38G6DWXkYwd/9HvG
'' SIG '' DdXK2/ClMOpGLbZLw2a5rA985ShWpkWIjjiYMJd/JMYh
'' SIG '' ADQpQXhywuutXz9u0f5NslNAGJfhPw+A88GxFvmYx2yx
'' SIG '' Q9iFLYRiMBW/nUo0Fz+kRFEn0rzjTBXOoIMjcZVNWimY
'' SIG '' JUA27QGndTImYhfkZg8ILA6/yBoWrNHCHW3BSBDaZiEk
'' SIG '' dNqLmCJgZrgbfSBfUQ2CYMk/seIQSoh6FaPnN78YfUQi
'' SIG '' Hr4AmC9vsGkKFc+hggILMIICBwYJKoZIhvcNAQkGMYIB
'' SIG '' +DCCAfQCAQEwcjBeMQswCQYDVQQGEwJVUzEdMBsGA1UE
'' SIG '' ChMUU3ltYW50ZWMgQ29ycG9yYXRpb24xMDAuBgNVBAMT
'' SIG '' J1N5bWFudGVjIFRpbWUgU3RhbXBpbmcgU2VydmljZXMg
'' SIG '' Q0EgLSBHMgIQDs/0OMj+vzVuBNhqmBsaUDAJBgUrDgMC
'' SIG '' GgUAoF0wGAYJKoZIhvcNAQkDMQsGCSqGSIb3DQEHATAc
'' SIG '' BgkqhkiG9w0BCQUxDxcNMTMwMjIxMjMwNDI1WjAjBgkq
'' SIG '' hkiG9w0BCQQxFgQULOpKiV1AS7a4aPDU3UYjpMDb/Wcw
'' SIG '' DQYJKoZIhvcNAQEBBQAEggEASePlLL04vp1U/lM+zC0K
'' SIG '' hnSwknSVTBOKMSb7kA44/zyMvWFA8POkMzqgNh2ASOrX
'' SIG '' 3ipXJ0AOlBSsuV9YghRFYqWHzXDSaDWdQQGoAvGaA+Lk
'' SIG '' ySwZ+SQqpmTw6MMFwEawaqbypIAL5OAoqi0mCOAel0ad
'' SIG '' ihwXpPfG1RmWwShWIsrqxAwRHnrVcgKjwknMZ5nEOhAy
'' SIG '' WMOzRjhZxGrUGiGZfpHpT0ULzU0ALMbOr/nGMrYOotce
'' SIG '' 1PPXUS7bCVxNcO8XghpH/NZZSQF8mca8ZCC1JWVhPqQR
'' SIG '' aI0l2h5vCLbNahA8r2B10L6EWLCso/ye+JD04FResVjs
'' SIG '' I8INmZTseVH35w==
'' SIG '' End signature block
