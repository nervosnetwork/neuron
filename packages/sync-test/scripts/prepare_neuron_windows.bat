@REM curl -O -L  http://github-test-logs.ckbapp.dev/neuron/sync/Neuron-v0.111.1-setup.exe
copy .\Neuron-*.exe Neuron-setup.exe
@echo off
REM 执行安装程序
.\Neuron-setup.exe /S /D=D:\a\neuron\neuron\packages\sync-test\neuron

REM 等待进程执行结束
:CHECK_LOOP
tasklist | find "Neuron-setup.exe" > nul
if errorlevel 1 (
    echo Neuron install succ
    mkdir ".\source\bin"
    copy ".\neuron\bin\ckb.exe" ".\source\bin\ckb.exe"
    copy ".\neuron\bin\ckb-light-client.exe" ".\source\bin\ckb-light-client.exe"
    exit /b 0
) else (
    timeout /t 5 /nobreak > nul
    goto :CHECK_LOOP
)
