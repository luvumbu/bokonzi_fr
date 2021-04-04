'*******************************************************************************
' 
'© Copyright 2016 Hewlett-Packard Development Company, L.P.
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
'*16-08-05 bab******************************************************************

option explicit

'
' Debugging trace flags, to enable debug output trace message
' change gDebugFlag to true.
'
const kDebugTrace = 1
const kDebugError = 2
dim   gDebugFlag

gDebugFlag = false

'
' Operation action values.
'
const kActionUnknown           = 0
const kActionLocation          = 1
const kActionReplace           = 2
const kActionExecute           = 4
const kActionVerbose           = 8

const kErrorSuccess            = 0
const KErrorFailure            = 1

const kNameSpace               = "root\cimv2"

'
' Generic strings
'
const L_Empty_Text                 = ""
const L_Space_Text                 = " "
const L_Comma_Text                 = " ,"
const L_Error_Text                 = "Error"
const L_Success_Text               = "Success"
const L_Failed_Text                = "Failed"
const L_Hex_Text                   = "0x"
const L_Printer_Text               = "Printer"
const L_Operation_Text             = "Operation"
const L_Provider_Text              = "Provider"
const L_Description_Text           = "Description"
const L_Debug_Text                 = "Debug:"

'
' Messages to be displayed if the scripting host is not cscript
'                            
const L_Help_Help_Host01_Text      = "Please run this script using CScript."  
const L_Help_Help_Host02_Text      = "This can be achieved by"
const L_Help_Help_Host03_Text      = "1. Using ""CScript script.vbs arguments"" or" 
const L_Help_Help_Host04_Text      = "2. Changing the default Windows Scripting Host to CScript"
const L_Help_Help_Host05_Text      = "   using ""CScript //H:CScript //S"" and running the script "
const L_Help_Help_Host06_Text      = "   ""script.vbs arguments""."

'
' General error messages
'                                                 
const L_Text_Error_General01_Text  = "The scripting host could not be determined."                
const L_Text_Error_General02_Text  = "Unable to parse command line." 
const L_Text_Error_General03_Text  = "Win32 error code"

'
' Miscellaneous messages
'
const L_Text_Msg_General09_Text    = "Number of printers enumerated"
const L_Text_Msg_General10_Text    = "Unable to connect to WMI server"    
const L_Text_Msg_General11_Text    = "Unable to enumarate printers"

'
' Debug messages
'
const L_Text_Dbg_Msg05_Text        = "In function ListPrinters"
const L_Text_Dbg_Msg08_Text        = "In function ParseCommandLine"

main

'
' Main execution starts here
'
sub main

    dim iAction
    dim iRetval
    
    '
    ' Abort if the host is not cscript
    '
    if not IsHostCscript() then
   
        call wscript.echo(L_Help_Help_Host01_Text & vbCRLF & L_Help_Help_Host02_Text & vbCRLF & _
                          L_Help_Help_Host03_Text & vbCRLF & L_Help_Help_Host04_Text & vbCRLF & _
                          L_Help_Help_Host05_Text & vbCRLF & L_Help_Help_Host06_Text & vbCRLF)
        
        wscript.quit
   
    end if

    ' Get command line parameters
    iRetval = ParseCommandLine(iAction)

    if iRetval = kErrorSuccess then
        iRetval = ListPrinters(iAction)
    end if

end sub

'
' List the printers
'
function ListPrinters(iAction)

'    on error resume next
    
    DebugPrint kDebugTrace, L_Text_Dbg_Msg05_Text

const HKCU = &H80000001
const HKLM = &H80000002

    dim objWMI
	dim collectionOfObjects
    dim oPrinter
    dim iTotal

    dim iResult
    dim strPort
    dim strResult 

    dim strLocation		
    dim strComment		
    dim strKeyPath
    dim strKeyRoot
    dim strValue
    dim strTemp
    dim oReg
    dim strPrinterName
    dim pos
    dim skip

    iResult = kErrorFailure

    wscript.echo "rem AddModelToComments.vbs version 16.08.05.1"

	Set objWMI = GetObject("winmgmts:\\.\root\cimv2")
    if Err.Number <> kErrorSuccess then         
        wscript.echo "ERROR: Unable to create Printmaster Object 0x" & hex(Err.Number) & "  " & Err.Description
        ListPrinters = kErrorFailure
        exit function
    end if    

    Set oReg = GetObject("winmgmts:{impersonationLevel=impersonate}!\\.\root\default:StdRegProv")

    if Err.Number <> kErrorSuccess then         
        wscript.echo "ERROR: Unable to create registry object 0x" & hex(Err.Number) & "  " & Err.Description
        ListPrinters = kErrorFailure
        exit function
    end if    

    strKeyRoot = "SYSTEM\CurrentControlSet\Control\Print\Printers\"

    iTotal = 0

                   
' Loop through all the printers
'
    strTemp = ""

	Set collectionOfObjects = objWMI.ExecQuery("SELECT * FROM Win32_Printer") 
    for each oPrinter in collectionOfObjects
    
        iTotal = iTotal + 1 
        skip   = false  

        if (iAction AND kActionVerbose) then
            wscript.echo "rem Printer Name: " & oPrinter.Name & "   Driver Name: " & oPrinter.DriverName                    
        end if

		if InStr (oPrinter.DriverName, "HP Universal Printing") then

' Read from bidicache in HKLM\...\printerdriverdata\BidiCache

'           Need to remove the servername from the printer name.
            pos = InStrRev(oPrinter.Name, "\")
            strPrinterName = mid ( oPrinter.Name, pos+1)
    	    strKeyPath = StrKeyRoot & strPrinterName & "\PrinterDriverData\BidiCache"

'            WScript.Echo "rem strKeyPath: " & strKeyPath

			oReg.GetStringValue HKLM, strKeyPath, "MODEL_NAME", strValue

' Check to see if the model name is already there.  If so, then skip

			if InStr (oPrinter.Comment, strValue) > 0 then
                skip = true
            end if

			if (iAction AND kActionLocation) AND InStr (oPrinter.Location, strValue) > 0 then
                skip = true
            end if

' Check to see if the model string is empty.
			'Server 2008 R2 with UPD 5.3 puts one space character in the registry, so len could be 1
			if len (strValue & "") < 2 then   ' hack to convert strValue to variant of type string
                skip = true
                wscript.echo "REM ERROR: Empty Model information for Printer: " & strPrinterName 
            end if

            if (skip = false) then
               if (iAction AND kActionReplace) then
				  strComment  = strValue
                  strLocation = strValue 
               else
                  strComment  = oPrinter.Comment  & " (" & strValue & ")"
       	          strLocation = oPrinter.Location & " (" & strValue & ")" 
               end if
 
' Format the printui.dll command
'//            rundll32 printui.dll,PrintUIEntry /Xs /n "printer" comment "My Cool Printer"

			   strResult = "rundll32 printui.dll,PrintUIEntry /Xs /n "
  			   strResult = strResult & chr(34) & strPrinterName & chr(34) & L_Space_Text
               if (iAction AND kActionLocation) then
                  strResult = strResult & "location " & chr(34) & strLocation & chr(34) 
                  if (iAction AND kActionExecute) then
                     oPrinter.Location = strLocation
                     oPrinter.Put_
                  end if
               else
                  strResult = strResult & "comment " & chr(34) & strComment & chr(34) 
                  if (iAction AND kActionExecute) then
                     oPrinter.Comment = strComment
                     oPrinter.Put_
                  end if
               end if
               wscript.echo strResult
		   end if
		end if
        Err.Clear
    next

    wscript.echo L_Empty_Text
    wscript.echo "rem " & L_Text_Msg_General09_Text & L_Space_Text & iTotal 
    
    ListPrinters = kErrorSuccess
end function

'******************************************************************************
' Debug display helper function
sub DebugPrint(uFlags, strString)

    if gDebugFlag = true then
        if uFlags = kDebugTrace then
            wscript.echo L_Debug_Text & L_Space_Text & strString
        end if

        if uFlags = kDebugError then
            if Err <> 0 then
                wscript.echo L_Debug_Text & L_Space_Text & strString & L_Space_Text _
                             & L_Error_Text & L_Space_Text & L_Hex_Text & hex(Err.Number) _
                             & L_Space_Text & Err.Description
            end if
        end if
    end if
end sub

'******************************************************************************
' Parse the command line into its components
function ParseCommandLine(iAction)

    on error resume next    

    DebugPrint kDebugTrace, L_Text_Dbg_Msg08_Text

    dim oArgs
    dim iIndex

    iAction = kActionUnknown
    iIndex  = 0

    set oArgs = wscript.Arguments

    while iIndex < oArgs.Count

        select case oArgs(iIndex)

            case "-l"
                iAction = iAction + kActionLocation
                
            case "-r"
                iAction = iAction + kActionReplace

            case "-v"
                iAction = iAction + kActionVerbose
            
            case "-x"
                iAction = iAction + kActionExecute
            
            case "-?"
                Usage(true)
                exit function

            case else
                Usage(true)
                exit function
        end select
        iIndex = iIndex + 1
    wend    

    if Err = kErrorSuccess then
        ParseCommandLine = kErrorSuccess
    else
        wscript.echo L_Text_Error_General02_Text & L_Space_Text & L_Error_Text & L_Space_Text _
                     & L_Hex_Text & hex(Err.Number) & L_Space_text & Err.Description
        ParseCommandLine = kErrorFailure        
    end if    
end  function

'******************************************************************************
' Display command usage.
sub Usage(bExit)

    wscript.echo "Usage: AddModelToComments [-l?] [-s server]"
    wscript.echo " "               
    wscript.echo "Arguments:"
    wscript.echo "-l     - put model in location field instead of comments field"
    wscript.echo "-r     - replace contents instead of concatenate"
    wscript.echo "-v     - verbose mode - list all printers and drivers found"
    wscript.echo "-x     - execute now instead of creating batch file"
    wscript.echo "-?     - display command usage"
    wscript.echo "Examples:"
    wscript.echo "AddModelToComments -l -r -s server_name"

    if bExit then
        wscript.quit(1)
    end if
end sub

'******************************************************************************
' Determines which program is being used to run this script. 
' Returns true if the script host is cscript.exe
function IsHostCscript()

    on error resume next
    
    dim strFullName 
    dim strCommand 
    dim i, j 
    dim bReturn
    
    bReturn = false
    
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
    
    if Err <> 0 then
        wscript.echo L_Text_Error_General01_Text & L_Space_Text & L_Error_Text & L_Space_Text _
                     & L_Hex_Text & hex(Err.Number) & L_Space_Text & Err.Description 
    end if
    IsHostCscript = bReturn
end function

'******************************************************************************
' Retrieves extended information about the last error that occured 
' during a WBEM operation. The methods that set an SWbemLastError
' object are GetObject, PutInstance, DeleteInstance
sub LastError()

    on error resume next

    dim oError

    set oError = CreateObject("WbemScripting.SWbemLastError")
    if Err = kErrorSuccess then
        wscript.echo L_Operation_Text            & L_Space_Text & oError.Operation
        wscript.echo L_Provider_Text             & L_Space_Text & oError.ProviderName
        wscript.echo L_Description_Text          & L_Space_Text & oError.Description
        wscript.echo L_Text_Error_General03_Text & L_Space_Text & oError.StatusCode
    end if                                                             
end sub

'******************************************************************************
' Remove leading "\\" from server name
function RemoveBackslashes(strServer)

    dim strRet
    
    strRet = strServer
    if Left(strServer, 2) = "\\" and Len(strServer) > 2 then 
        strRet = Mid(strServer, 3) 
    end if   
    RemoveBackslashes = strRet
end function

