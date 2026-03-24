@echo off
echo Installing dependencies...
call npm config set interactive false
call npm install exceljs file-saver
call npm install -D @types/file-saver
echo Done!
