function UploadDocuments(){
Param(
        [ValidateScript({If(Test-Path $_){$true}else{Throw "Invalid path given: $_"}})] 
        $LocalFolderLocation,
        [String] 
        $siteUrl,
        [String]
        $documentLibraryName
)
Process{
       
        $path = $LocalFolderLocation.TrimEnd('\')

        Write-Host "Provided Site :"$siteUrl -ForegroundColor Green
        Write-Host "Provided Path :"$path -ForegroundColor Green
        Write-Host "Provided Document Library name :"$documentLibraryName -ForegroundColor Green

          try{
                
				$encpassword = convertto-securestring -String "DJremix01?" -AsPlainText -Force
				$cred = new-object -typename System.Management.Automation.PSCredential -argumentlist "tleclaire@tleclaire66.onmicrosoft.com", $encpassword
				#$credentials = Get-Credential
  
                Connect-PnPOnline -Url $siteUrl -CreateDrive -Credentials $cred

                $file = Get-ChildItem -Path $path -Recurse
                $i = 0;
                Write-Host "Uploading documents to Site.." -ForegroundColor Cyan
                (dir $path -Recurse) | %{
                    try{
                        $i++
                        if($_.GetType().Name -eq "FileInfo"){
                          $SPFolderName =  $documentLibraryName; # + $_.DirectoryName.Substring($path.Length);
                          $status = "Uploading Files :'" + $_.Name + "' to Location :" + $SPFolderName
                          Write-Progress -activity "Uploading Documents.." -status $status -PercentComplete (($i / $file.length)  * 100)
                          $te = Add-PnPFile -Path $_.FullName -Folder $SPFolderName
                         }          
                        }
                    catch{
                    }
                 }
				 Add-PnPApp -Path "sharepoint\solution\spfx-hello-world.sppkg" -Scope Tenant -Publish -Overwrite
            }
            catch{
             Write-Host $_.Exception.Message -ForegroundColor Red
            }

  }
}

UploadDocuments -LocalFolderLocation "temp\deploy\" -siteUrl "https://tleclaire66.sharepoint.com/sites/Develop" -documentLibraryName "SPFxDeploy"


