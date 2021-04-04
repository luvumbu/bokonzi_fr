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
'*12-08-14 BAB******************************************************************
option explicit
on error resume next    

const kErrorSuccess = 0
const OpenAsDefault = -2
const FailIfNotExist = 0
const ForReading = 1

'column numbers in DriverMapping.csv file
	const OLD_DRIVER   = 0		
	const NEW_DRIVER   = 1
	const INF_PATH_64  = 2
	const INF_PATH_32  = 3

	dim strFilePath
	dim i
	dim arrayKeys, arrayItems
	dim strNewDriver, strOldDriver, strInfPath

    dim oFso, oFile
	dim sDriverStore
    dim strLine, strResult
    dim row, errors
	dim p
	dim x
	
    Err.Clear

	if (wscript.Arguments.Count = 1) then
		sDriverStore = wscript.Arguments(0)
	else	
		sDriverStore = "DriverMapping.csv"
	end if
	
	row = 0  
	errors = 0
	Set oFSO = CreateObject("Scripting.FileSystemObject")
	Set oFile = oFSO.OpenTextFile(sDriverStore, ForReading, FailIfNotExist, OpenAsDefault)
	If Err = 0 then
		Do Until oFile.AtEndOfStream
			strLine = oFile.ReadLine
			if (row > 0) then
				p = split(strLine,",")
				If (ubound(p) > -1) Then
					Err.Clear
					x = p(NEW_DRIVER)
					if (Err.Number <> 0) Then
						wscript.echo "ERROR: Row: " & row+1 & " - New driver name missing." 
					end if
					If (oFSO.FileExists(p(INF_PATH_64)) = true) Then
						if (DriverNameExists (oFSO, p(NEW_DRIVER), p(INF_PATH_64)) = false) then
							wscript.echo p(NEW_DRIVER) 
							wscript.echo "ERROR: Row: " & row+1 & " - " & chr(34) & p(INF_PATH_64) & chr(34) & " does not contain driver name " & chr(34) & p(NEW_DRIVER) & chr(34) 
							errors = errors + 1
							wscript.echo ""
						end if	
					else
						wscript.echo p(NEW_DRIVER) 
						wscript.echo "ERROR: Row: " & row+1 & " - 64 bit inf file: " & chr(34) & p(INF_PATH_64) & chr(34) & " is missing "
						errors = errors + 1
						wscript.echo ""
					end if
					
					If (oFSO.FileExists(p(INF_PATH_32)) = true) Then
						if (DriverNameExists (oFSO, p(NEW_DRIVER), p(INF_PATH_32)) = false)  then
							wscript.echo p(NEW_DRIVER) 
							wscript.echo "ERROR: Row: " & row+1 & " - " & chr(34) & p(INF_PATH_32) & chr(34) & " does not contain driver name " & chr(34) & p(NEW_DRIVER) & chr(34) 
							errors = errors + 1
							wscript.echo ""
						end if	
					else
						wscript.echo p(NEW_DRIVER) 
						wscript.echo "ERROR: Row: " & row+1 & " - 32 bit inf file: " & chr(34) & p(INF_PATH_32) & chr(34) & " is missing "
						errors = errors + 1
						wscript.echo ""
					end if
				end if	
			end if			
			row = row + 1
		Loop
		oFile.Close
		set oFile = nothing
	else
		wscript.echo "ERROR: Open file failed, " & sDriverStore
	end if    
	set oFSO = nothing
	wscript.echo row & " rows parsed, " & errors & " errors found."

'******************************************************************************	
function DriverNameExists(oFso, sDriverName, sInfName)

on error resume next
	const ForReading = 1
	dim oInfFile
	dim strLine

	DriverNameExists = false
	Set oInfFile = oFso.OpenTextFile(sInfName, ForReading, False)
	If Err = 0 then
		Do Until oInfFile.AtEndOfStream
			strLine = oInfFile.ReadLine
			if (instr(strline, trim(sDriverName)) > 0) then
				DriverNameExists = true
			end if
		Loop
		oInfFile.Close
		set oInfFile = nothing
	else
		wscript.echo "ERROR: Open file failed : " & sInfName
	end if
end function
    
'******************************************************************************	

'' SIG '' Begin signature block
'' SIG '' MIIZSgYJKoZIhvcNAQcCoIIZOzCCGTcCAQExCzAJBgUr
'' SIG '' DgMCGgUAMGcGCisGAQQBgjcCAQSgWTBXMDIGCisGAQQB
'' SIG '' gjcCAR4wJAIBAQQQTvApFpkntU2P5azhDxfrqwIBAAIB
'' SIG '' AAIBAAIBAAIBADAhMAkGBSsOAwIaBQAEFHPUPu2fMW8k
'' SIG '' BawgQt6YxXK7x1iGoIIURDCCA+4wggNXoAMCAQICEH6T
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
'' SIG '' KoZIhvcNAQkEMRYEFNdWgpPRwrGKU2HDvL57tkFJMU7u
'' SIG '' MA0GCSqGSIb3DQEBAQUABIIBAAKoPkjg5f4nPMtT34KD
'' SIG '' NA8JTAaYbAywCjL1JX7vd9g/swjUbhBYpNEDOjG5cUjE
'' SIG '' 3PBaXFtUbeLzFNlUsyA3ltmND5E+2cStk1OwP/C3l326
'' SIG '' 3mLNmL7/La+LjiW2JHDuBEQSzA4YfBrWAbJFaJro/r7k
'' SIG '' CzmVgO+e4udXoi4tcDg/aX91+2rcgL+d8hCNVHv6+5oz
'' SIG '' 9FQ7SrHAv6EqEcP/I9l7ItbN0GxEeHXiFUWc7IKkC4TV
'' SIG '' HKAl12s82Icn1Z8R8GuqL5vCJE4Q4VRMV5bNTD3CCv0n
'' SIG '' DdA5WgpON5602DxOSOTsuOgJb5jnJiVmEKS5X82mf3e8
'' SIG '' smayxoykBclq1zGhggILMIICBwYJKoZIhvcNAQkGMYIB
'' SIG '' +DCCAfQCAQEwcjBeMQswCQYDVQQGEwJVUzEdMBsGA1UE
'' SIG '' ChMUU3ltYW50ZWMgQ29ycG9yYXRpb24xMDAuBgNVBAMT
'' SIG '' J1N5bWFudGVjIFRpbWUgU3RhbXBpbmcgU2VydmljZXMg
'' SIG '' Q0EgLSBHMgIQDs/0OMj+vzVuBNhqmBsaUDAJBgUrDgMC
'' SIG '' GgUAoF0wGAYJKoZIhvcNAQkDMQsGCSqGSIb3DQEHATAc
'' SIG '' BgkqhkiG9w0BCQUxDxcNMTMwMjIxMjMwNzE1WjAjBgkq
'' SIG '' hkiG9w0BCQQxFgQUcCAPOipn1j2cNR0l6HKx2A6GFbsw
'' SIG '' DQYJKoZIhvcNAQEBBQAEggEAh7kTc4gP/v1Xa7QNHYy3
'' SIG '' OrravLvC3Ihyjg5et9GwDOxkfRMseUMfLRcOzDtNfklL
'' SIG '' UTqW3TNv6BS1k0BfL9iF+a4j/JQXBT/oDYRay3CeosXX
'' SIG '' DqUPeaS1vCOYC6pU0EcoERdVU/1kSdSbyws+vaAWvr/U
'' SIG '' 8jy/ma1zqUzJSE97LwBBRJk6Hmhn32z1V1eParsokfof
'' SIG '' qItRN4ABTK3JHWfZ23uFcrCAylBOz9yMZd6+QS1DTca/
'' SIG '' hQPRb/EcmxtzfTdPMIDpEy3d1Lc284aYmCsZjKJX2HwN
'' SIG '' 7wEhK568ANL3uPhRS1jsS0DUNPpM04L8kB74yu8ATcqR
'' SIG '' fM+EQW6/BdWgFA==
'' SIG '' End signature block
