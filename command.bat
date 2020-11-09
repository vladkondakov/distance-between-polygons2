@echo off
set /p inputFile= Write the name of your input file (example: input.txt): 
set /p outputFile= Write the name of your output file (example: output.txt): 
call npm install
node index.js %inputFile% %outputFile%