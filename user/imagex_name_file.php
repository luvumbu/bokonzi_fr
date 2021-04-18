<?php
session_start();

$_SESSION["file_name"]=  sha1( sha1( rand(1, 9876543210)));
echo $_SESSION["file_name"] ;

?>