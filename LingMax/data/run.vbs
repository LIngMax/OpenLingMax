Set objArgs = WScript.Arguments

if objArgs.Count < 3 then '����Ϊ True ʱ����ĳһ���飬����Ϊ False ʱ������һ����
  wscript.quit
end if

dim a'����һ������
dim b'����һ������

b = WScript.Arguments(0)
a = WScript.Arguments(1)

if b="1" or b="true" then '����Ϊ True ʱ����ĳһ���飬����Ϊ False ʱ������һ����
  b="runas"
else
  b="open"
end if

if a="1" or a="true" then '����Ϊ True ʱ����ĳһ���飬����Ϊ False ʱ������һ����
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