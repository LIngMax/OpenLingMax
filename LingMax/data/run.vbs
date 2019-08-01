Set objArgs = WScript.Arguments

if objArgs.Count < 3 then '条件为 True 时运行某一语句块，条件为 False 时运行另一语句块
  wscript.quit
end if

dim a'定义一个变量
dim b'定义一个变量

b = WScript.Arguments(0)
a = WScript.Arguments(1)

if b="1" or b="true" then '条件为 True 时运行某一语句块，条件为 False 时运行另一语句块
  b="runas"
else
  b="open"
end if

if a="1" or a="true" then '条件为 True 时运行某一语句块，条件为 False 时运行另一语句块
  a=1
else
  a=0
end if



dim c
dim e
dim v
v = """"
For I = 2 to objArgs.Count - 1
   if InStr(objArgs(I)," ") > 0 then
     c = c & e & v & objArgs(I) & v
   else
     c = c & e & objArgs(I)
   end if
   e = " "
   
Next

CreateObject("Shell.Application").ShellExecute c,"","",b,a