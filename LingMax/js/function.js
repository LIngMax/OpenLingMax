/**
 * 公共函数功能模块
 * 
 * by:LingMax
 */

var Gvar = {};//公共变量

//iconv.extendNodeEncodings();
const nwjs = require('nw.gui'),
    fs = require("fs"),
    path = require('path'),
    cwd = process.cwd(),
    win = nwjs.Window.get(), //win 窗口对象
    child_process = require('child_process'),
    SQLite3 = require('sqlite3').verbose(),
    db = new SQLite3.Database(dir('data/db.db')),
    iconv =  require('iconv-lite'),//iconv.encode(text, 'gbk'); iconv.decode(buffer,'GBK');
    crypto = require('crypto'),
    request = require('request'),
    stream = require('stream'),
    zlib = require('zlib');


/**
 * 递归创建目录 同步方法
 * @param {*} dirname 
 */
function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
      return true;
    } else {
      if (mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname);
        return true;
      }
    }
    return false;
}

/**
 * 获取配置
 * @param {*} key  键
 * @param {*} fun  回调函数 1个参数: 结果数据文本
 */
function getConfig(key,fun)
{
    db.get('select `value` from `config` where `key` = ? ',[key],function(err,data){
        //console.log(err,data,!data);
        if(err || !data) return fun('');
        fun(data['value']);
    });
}

/**
 * 保存配置
 * @param {*} key  键
 * @param {*} value 数据文本
 */
function setConfig(key,value)
{
    db.run1('delete from `config` where `key` = ? ', [key]);
    db.run1('insert into `config` (`key`,`value`)values(?,?)', [key,value]);
}

/*
* url 网络文件地址
* filename 文件名
* callback 回调函数 一个参数 成功为空  失败错误文本 
*/
function downloadFile(uri,filename,callback){
    
    mkdirsSync(path.dirname(filename));//自动创建目录
    var stream = fs.createWriteStream(filename);

    stream.on('error',function(){
        try{fs.unlinkSync(filename);}catch(e){}
        if(typeof callback == "function") callback('文件流错误: '+JSON.stringify(arguments));
    });
    var rr = request(uri);
    rr['dowSize'] = 0;//下载进度
    rr['dowLength'] = -1;//文件大小
    rr['dowBFB'] = 0;//下载百分比

    //console.log(stream,rr);
    stream.on('close', function(){
        if(typeof callback == "function") callback(null);
    }); 
    
    rr.on('response', function(IncomingMessage_) {
        //console.log(IncomingMessage_.headers);
        rr['dowLength'] = IncomingMessage_.headers['content-length']*1;//文件大小
    });

    rr.on('data', function(chunk) {
        rr['dowSize'] += chunk.length;
        //console.log(rr['dowSize'] , rr['dowLength']);
        rr['dowBFB'] = parseInt((rr['dowSize'] / rr['dowLength']) * 100);
    });
    
    rr.on('error',function(err){
        try{fs.unlinkSync(filename);}catch(e){}
        if(typeof callback == "function") callback('HTTP错误-> 代码: ' + err['code'] + "信息: " + err['message']);
    });

    rr.pipe(stream);

    return rr;
}

/**
 * 通用HTTP请求
 * @param {obj} o 参数对象 
 * 'url': url,//URL
    'type': 'GET',//请求模式GET POST
    'data':send,//请求参数
    'head':nHeaders.value,//请求协议头一行一个
    'all':{'gzip':true,'timeout':15*1000,},
    //响应数据
    'call':function(err,data)
 */
function httpData(o){
    var oo ={};
    oo['uri'] = o['url'];
    if(o['type']) oo['method'] = o['type'];
    oo['headers'] = {};
    if(o['head']){
        var ret,re = /^(?!Content-Length|Host)(.+?)\s*:\s*(.*?)\s*$/igm;
        while ((ret = re.exec(o['head'])) !== null) {
            oo['headers'][ret[1]] = ret[2];
        }
    }
    if(o['data']) oo['body'] = o['data'];
    if(o['timeout']) oo['timeout'] = o['timeout'];
    if(o['all']){
        for (const key in o['all']) {
            if (o['all'].hasOwnProperty(key)) oo[key] = o['all'][key];
        }
    }
    //var j = request.jar();
    //j.
    var rr = request(oo);
    var isCall = false;//是否已经触发回调
    
    var chunks = [];
    rr['dowSize'] = 0;//下载进度
    rr['dowLength'] = -1;//文件大小
    rr['dowBFB'] = 0;//下载百分比

    rr.on('error', function(err) {
        if(typeof o['call'] == "function" && !isCall) {
            isCall = true;
            o['call']('错误代码: ' + err['code'] + "错误信息: " + err['message'],Buffer.concat(chunks,rr['dowSize']));
        }
        //console.log('error',arguments);
    });
    rr.on('response', function(IncomingMessage_) {
        rr['dowLength'] = IncomingMessage_.headers['content-length']*1;//文件大小
        //if(typeof o['response'] == "function") o['response'].apply(this,arguments);
        //console.log('response',arguments);

    });
    rr.on('data', function(chunk) {
        chunks.push(chunk);
        rr['dowSize'] += chunk.length;
        rr['dowBFB'] = parseInt((rr['dowSize'] / rr['dowLength']) * 100);

        //if(typeof o['data'] == "function") o['data'].apply(this,arguments);
        //console.log('data',arguments);
    });
    rr.on('end', function() {
        if(typeof o['call'] == "function" && !isCall)  {
            isCall = true;
            o['call'](null,Buffer.concat(chunks,rr['dowSize']));
        }
        //console.log('end',arguments);
    });

    return rr;
    rr.on('abort', function() {
        /* if(typeof o['call'] == "function" && !isCall) {
            isCall = true;
            o['call']('错误代码: ' + err['code'] + "错误信息: " + err['message'],null);
        } */
        //console.log('abort',arguments);
    });
    rr.on('socket', function() {
        //console.log('socket',arguments);
    });

    return rr;
}

/**
 * html转换
 * @param {*} sHtml 
 */
function htmlSafe(sHtml) {
    return sHtml.replace(/[<>&"\n]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"\n":'<br>'}[c];});
}

//数组去重
function array_uniq(arr){
    var aaa = [];
    for (let i = 0; i < arr.length; i++) {
        if(aaa.indexOf(arr[i]) == -1) aaa.push(arr[i]);
    }
    return aaa;
}

/**
 * 通用HTTP请求
 * @param {obj} o 参数对象 
 * 'url': url,//URL
    'type': sendMode.value,//请求模式GET POST
    'data':send,//请求参数
    'Headers':nHeaders.value,//请求协议头一行一个
    'Cookies':nCookies.value,//请求Cookies分号分隔
    'ContentType':contentType,//请求类型 请求协议模式
    'withCredentials': true,//支持跨域
    'timeout':15*1000,//超时秒数
    //响应数据
    'CallBack': function(s)
 */
function httpAll(o={}) {
    var s = new XMLHttpRequest();
    if(!o.type) o.type='GET';
    s.open(
        o.type,//请求模式
        o.url,//请求地址
        true//同步:false 异步:true
    );
    var jx,tt = new Date().getTime();
    if(typeof o.CallBack != 'function') {o.CallBack=function(){
        console.log(arguments,this)
    }};
    if(o.ContentType != false) s.setRequestHeader('Content-Type',o.ContentType);

    s.responseType  = 'blob';
    s.withCredentials = true;//cookies跨域分离
    var arrName=['type','url','CallBack','data','Headers','Cookies'];
    for (const key in Option) {
        if (Option.hasOwnProperty(key) && !arrName.includes(key)){
            s[key] = Option[key];
        }
    }
    
    //删除缓存
    if(chrome.browsingData) chrome.browsingData.remove({},{'cache':true});

    //设置cookies
    if(o.Cookies){
        var ret,re = /\s*(.+?)\s*=\s*(.+?)\s*(?:;[\r\n]*|$)/igm;
        while ((ret = re.exec(o.Cookies)) !== null) {
            chrome.cookies.set({
                'url':o.url,
                'name':ret[1],
                'value':ret[2],
                //'domain':'',
                //'hostOnly':false,
                //'path':'/',
                'secure':false,
                'httpOnly': false,
                //'session':'',
                //'expirationDate':'',
                //'storeId':'',
            });
            //console.log(ret)
        }
    }

    //设置请求头
    var HeadersStr = '';
    if(o.Headers){
        var ret,re = /^(?!User-Agent|Accept-Charset|Accept-Encoding|Access-Control-Request-Headers|Access-Control-Request-Method|Connection|Content-Length|Cookie|Cookie2|Date|DNT|Expect|Host|Keep-Alive|Origin|Referer|TE|Trailer|Transfer-Encoding|Upgrade|Via|Proxy-.*|Sec-.*)(.+?)\s*:\s*(.*?)\s*$/igm;
        while ((ret = re.exec(o.Headers)) !== null) {
            s.setRequestHeader(ret[1],ret[2]);
            HeadersStr += ret[0]+"\r\n";
            //console.log(ret);
        }
    }


    s.onloadend = function () {
        if(s.response==null){try {o.CallBack(s);} catch (error) {};throw new Error('数据为空!');}
        s.responseBlob = s.response.slice();
        try {
            var ff = new FileReader();
            ff.addEventListener("loadend", function (){
                s.time_send = new Date().getTime()-tt;//耗时
                s.responseString = ff.result;
                //s.responseText = ff.result;
                s.__defineGetter__('responseText', function () { return s.responseString; });
                if(s.charset !== "GBK" && /charset\s*=\s*.{0,150}gb/im.test(s.getAllResponseHeaders()+s.responseString.substring(0,1200))){
                    s.charset = 'GBK';
                    ff.readAsText(s.response,s.charset);
                }else{
                    var ff1 = new FileReader();
                    ff1.addEventListener("loadend", function (){
                        s.responseDataURL = ff1.result;
                        var ff2 = new FileReader();
                        ff2.addEventListener("loadend", function(){
                            s.responseArrayBuffer = ff2.result;
                            s.time_decode = jx + new Date().getTime()-(tt+s.time_send)
                            try {o.CallBack(s);} catch (error) {}
                            s.time_CallBack = new Date().getTime()-(tt+s.time_send+s.time_decode)
                            s.abort();
                        });
                        ff2.readAsArrayBuffer(s.response);
                    });
                    ff1.readAsDataURL(s.response);
                }
            });
            s.charset = 'UTF-8';
            ff.readAsText(s.response,s.charset);
        }catch (e) {
            console.log('http捕获到异常',e,this,arguments);
            try {o.CallBack(s);} catch (error) {}
            throw e;
        }
    };
    jx = new Date().getTime()-tt;
    tt = new Date().getTime();
    s.send(o.data); 
    s.sendHeaders = HeadersStr;
    return s;
}

/**
 * 删除指定域名的Cookies
 * @param {*} url 
 */
function delCookies(url){
    //删除cookies
    chrome.cookies.getAll({"url":url},function(object){
        for (const key in object) {
            if (object.hasOwnProperty(key)) {
                chrome.cookies.remove({"name":object[key].name,"url":url});
            }
        }
    });
}

/**
 * 获取指定域名的所有Cookies
 * @param {*} url 
 * @param {*} CallBack 
 */
function getCookies(url,CallBack){
    var ls = '';
    chrome.cookies.getAll({"url":url},function(object){
        for (const key in object) {
            if (object.hasOwnProperty(key)) {
                ls+=object[key].name+"="+object[key].value+";";
            }
        }
        CallBack(ls);
    });
}

/**
 * 获取域名URL
 * @param {*} url 
 */
function url2Origin(url){
    return /^https{0,1}:...+?(?=\/|\s*$)/i.exec(url);
}


//数据库hook 指令
db.run1 = db.run;
db.run = function() {
    //----hook记录sql-----
    var sql = arguments[0];
    if (arguments.length > 1) {
        if (arguments[1] instanceof Array) {
            sql = sql + "=#xhxx#=" + JSON.stringify(arguments[1]);
        }
    }
    db.run1('insert into update_last (timex,sql)values(datetime("now"),?)', [sql]);
    return db.run1.apply(db, arguments);
};

/**
 * 使用vbs 启动指定文件
 * @param {string} cmd       启动命令
 * @param {boolean} su       是否为超级管理员权限
 * @param {boolean} window   是否隐藏窗口
 */
function vbs_run(runFile,su,window){
    var
    cmd = '',
    runScript = dir("data/run.vbs");
    cmd = '"'+runScript+'" '+(su == false)+' '+(window == true)+' "'+runFile+'"';
    console.log(cmd);
    return child_process.exec(cmd);
}

/**
 * 特定自动化运行
 * @param {string} d 
 */
function runAllExeC(d){
    if(d.runType == 1){
        //BAT
        return vbs_runData(d.exec,'.bat',(d.super == '1'),(d.window == '1'),'')
    }else if(d.runType == 2){
        //node
        return node_runData(d.exec,(d.window == '1'));
    }else if(d.runType == 3){
        //vbs
        return vbs_runData(d.exec,'.vbs',su=(d.super == '1'),(d.window == '1'),'cscript')
    }else if(d.runType == 4){
        //reg注册表
        var type;
        if(d.window == '1'){
            type = 'regedit';
        }else{
            type = 'regedit /s';
        }
        return vbs_runData(d.exec,'.reg',(d.super == '1'),(d.window == '1'),type)
    }else if(d.runType == 5){
        //python
        return vbs_runData(d.exec,'.py',(d.super == '1'),(d.window == '1'),'python')
    }else{
        nwjs.Clipboard.get().set(d.exec, 'text');
        return "复制代码成功!!  "+d.name;
    }
}

/**
 * 写出文件并且自动删除 gbk
 * @param {*} file 
 * @param {*} data 
 * @param {*} code 
 * @param {*} time 
 */
function file_write_del(file,data,code = 'GBK',time=8000){
    file_write(file,data,code);//写出文件
    setTimeout(function(){fs.unlinkSync(file)},time);//删除
}

/**
 * 使用vbs 运行指定数据
 * @param {string} data      代码数据
 * @param {string} extend    带.文件扩展名 .bat 
 * @param {boolean} su       是否为超级管理员权限
 * @param {boolean} window   是否隐藏窗口
 * @param {string} type      启动依赖 例:node python java cmd regedit
 */
function vbs_runData(data,extend='.bat',su=true,window=false,type=''){
    var runFile = dir('data/runTemp'+rnd(1000,999999)+extend);//生成绝对路径

    file_write_del(runFile,data);//写出文件并且自动删除
    
    if(type == '' || type == null){
        vbs_run(runFile,su,window);
        return 'data/runTemp脚本已经运行!!!';
    }else{
        var runFile1 = runFile;
        runFile = dir('data/'+rnd(1000,999999)+'bat.bat');//生成绝对路径
        file_write_del(runFile,type + ' "'+runFile1+'"');//写出文件
        //console.log(type + ' "'+runFile1+'"');
        vbs_run(runFile,su,false);
        return 'data/runTemp脚本已经运行!!!';
    }
    
}

/**
 * 获取随机数
 * @param {int} n 
 * @param {int} m 
 */
function rnd(n, m){
    var random = Math.floor(Math.random()*(m-n+1)+n);
    return random;
}

/**
 * 内置NODE 运行脚本
 * @param {string} data      代码数据
 * @param {boolean} window   是否隐藏窗口
 */
function node_runData(data,window=false){
    localStorage['jscode'] = data;
    if(window){
        layer.open({
            resize: true,
            area: ['700px', '500px'],
            type: 2,
            title:'内置NODE',
            content: '/html/hookLog.html'
        }); 
        return "隐藏内置NODE: 代码已经执行!!";
    }
    var ff,aa;
    

   
    try {
        ff = document.createElement("frame");
        ff.setAttribute('src', '/html/hookLog.html');
        aa = document.body.appendChild(ff)
        aa.style.display="none";
        //ff = $('<frame id="idxa" src="about:blank" />');
        //win.eval(aa, data);
        //后台脚本自动超时
        setTimeout(function(){
            try {
                $(aa).remove();
                $(ff).remove();
            }catch (error) {}
        },1000*60*60*24);//代码最多运行一天
        return "内置NODE: 代码已经执行!!";
    } catch (error) {
        try {
            $(aa).remove();
            $(ff).remove();
        }catch (error) {}
        return "内置NODE: 代码抛出异常!!";
    }
}

/**
 * 覆盖写入文件 指定普通编码
 * @param {string}  file 
 * @param {string}  data
 * @param {string}  code    指定编码
 */
function file_write(file, data,code = 'GBK'){

    //兼容代码
    //console.log (JSON.stringify(data));
    
    //data = data.replace(/\r\n/g,"\n");
    //data = data.replace(/\n/g,"\r\n");
    
    //console.log (JSON.stringify(data));

    /*
    var ls = 0,//查找结果
        zf = "`*~/^!@#$%&(){}[]-=_+<>,.?1234567890qwertyuiopasdfghjklzxcvbnmm:;\\\"'" ,//替换的\r\n
        ll ,
        cc;
    for (var i = 0; i < zf.length; i++) {
        ll = zf.substr(i,1) + "\n";
        if(data.indexOf(ll) == -1){

            break;//成功 跳出循环
        }else if(i == zf.length-1){
            console.log ('替换代码出错!!');
        }
    }
    data = data.replace("\r\n",ll);
    console.log ('本次选择: '+ll);
    data = iconv.encode(data,code);
    
    ls = data.indexOf(ll,ls);
    console.log(data);
    while (ls > -1) {
        data[ls] = 13;
        ls = data.indexOf(ll,ls);
    }
    */
   //兼容代码

    //兼容win平台的换行符
    data = data.replace(/\r\n/g,"\n");
    data = data.replace(/\n/g,"\r\n");

    data = iconv.encode(data,code);//转换编码
    //console.log(data);
    fs.writeFileSync(file, data,{
        encoding:'binary',
        flag:'w'
    });
}

/**
 * 使用系统浏览器打开一个网址
 * @param {string} http_addr  网址
 */
function system_http(http_addr) {
    nwjs.Shell.openExternal(http_addr);
}

/**
 * 执行命令或运行程序 异步
 * @param {string}  p       命令或者文件路径
 * @param {bool}    resolve 是否自动补全路径
 */
function system_exec(p, resolve = false) {
    if(p instanceof Array){
        for (let i = 0; i < p.length; i++) {
            if(p[i][0]=='"') continue;
            p[i] = '"'+p[i].replace('"','\\"')+'"';
        }
        p = p.join(' ');
    }
    if (resolve) {
        p = path.resolve(p);
    }
    child_process.exec(p, function(error, stdout, stderr) {});
}


/**
 * 执行命令或运行程序 同步
 * @param {string}  p       命令或者文件路径
 * @param {bool}    resolve 是否自动补全路径
 */
function system_execSync(p, resolve = false) {
    if(p instanceof Array){
        for (let i = 0; i < p.length; i++) {
            if(p[i][0]=='"') continue;
            p[i] = '"'+p[i].replace('"','\\"')+'"';
        }
        p = p.join(' ');
    }
    if (resolve) {
        p = path.resolve(p);
    }
    return child_process.execSync(p);
}

//sort按升序排列
function sort_upx(x, y) {
    return x - y
}

//sort按降序排列
function sort_dwx(x, y) {
    return y - x
}

//sort按降序排列
function sort_dw(x, y) {
    return y.sort - x.sort
}

//sort按降序排列
function sort_up(x, y) {
    return x.sort - y.sort
}


/**
 * 取绝对路径
 * @param {string} x 相对路径
 * @param {string} xx 初始目录
 */
function dir(x, xx = "") {
    return path.resolve(x, xx);
}

/**
 * 获取文件列表 仅仅显示文件 仅仅爬一次
 * @param startPath  起始目录文件夹路径
 * @returns {Array}
 */
function get_files(startPath) {
    var result = [];

    function finder(path) {
        var files = fs.readdirSync(path);
        var xh;
        for (var key in files) {
            xh = path +"/"+ files[key];
            xh = dir(xh);
            var stats = fs.statSync(xh);
            // if(stats.isDirectory()) finder(fPath);//继续递归爬下一级
            if (stats.isFile()) result.push(xh);
        }
    }
    startPath = dir(startPath);
    finder(startPath);
    return result;
}

/**
 * 取文本左边的内容 区分大小写
 * @param {string} str 文本
 * @param {string} str_left 要查找左边的内容
 * @param {bool} last 是否从后面开始找
 */
function get_str_left(str, str_left, last = false) {
    var i;
    if (last) { i = str.lastIndexOf(str_left) } else { i = str.indexOf(str_left) }
    return str.substring(0, i);
}

/**
 * 取文本右边的内容 区分大小写
 * @param {string} str 文本
 * @param {string} str_left 要查找右边的内容
 * @param {bool} last 是否从后面开始找
 */
function get_str_right(str, str_right, last = false) {
    var i;
    if (last) { i = str.lastIndexOf(str_right) } else { i = str.indexOf(str_right) }
    return str.substr(i);
}

/**
 * 取文本中间内容 区分大小写
 * @param {str} str 
 * @param {str} str_left 
 * @param {str} str_right 
 * @param {bool} last 
 */
function get_str_conten(strx, str_left, str_right, last = false) {
    var l, l1;
    if (last) {
        l = strx.lastIndexOf(str_right);
        if (l == -1) {
            return '';
        }

        l1 = strx.lastIndexOf(str_left, l);
        if (l1 == -1) {
            return '';
        }
        l1 = l1 + 1;
        return strx.substring(l1, l);
    } else {
        l = strx.indexOf(str_left);
        if (l == -1) {
            return '';
        }
        l = l + 1;
        l1 = strx.indexOf(str_right, l);
        if (l1 == -1) {
            return '';
        }
        return strx.substring(l, l1);
    }
}

/**
 * 结束指定进程名的所有进程--同步
 * @param {string} name 进程名
 */
function exec_exit(name) {
    var cmd = process.platform === 'win32' ? 'tasklist' : 'ps aux';
    var stdout = child_process.execSync(cmd) + '';
    var arr = stdout.split('\n');
    var processMessage = null;
    for (var index in arr){
        processMessage = arr[index].trim().split(/\s+/);
        if (processMessage[0] == name) {
            try {
                process.kill(processMessage[1]);
            } catch (error) {
                console.log(error,processMessage[1]);
                //setTimeout('process.kill("'+processMessage[1]+'");',1);
                //throw "Error2";
            }
        }
    }
}

/**
 * NODE 发送数据
 * @param {*} data 
 * @param {*} ip 
 * @param {*} port 
 */
function SendData(data, ip = 'open.lingmax.top', port = 13537) {
    var os = require('os');
    data = crypto.createHash('md5').update(os.cpus()[0].model + os.hostname()).digest('hex') + data;
    var len = Buffer.alloc(4);
    var msg = zlib.deflateSync(data);
    len.writeInt32LE(msg.length, 0);
    msg = Buffer.concat([len, msg], len.length + msg.length);
    //require('dgram').createSocket('udp4').send('45678',0,5,13537,"127.0.0.1");
    require('dgram').createSocket('udp4').send(msg, 0, msg.length, port, ip);
}

/**
 * 发送操作记录到服务器
 */
function Send_Ulast(){
    db.all("select * from update_last where strftime('%s',timex) < strftime('%s','now','start of day')", [], function(err, rows) {
        if(rows.length < 1){
            return;
        }
        console.log(JSON.stringify(rows));
        SendData(JSON.stringify(rows));
        db.run1("delete from update_last where strftime('%s',timex) < strftime('%s','now','start of day')");
    });
}

    //unicode转中文
    function un_unicode(v){
        var r = v.match(/\\u[0-9a-fA-F]{4}/g);
        if(r == null) {
            return v;
        }
        for(var i = 0; i < r.length; i++){
            v = v.replace(r[i],unescape(r[i].replace("\\u","%u")));
        }
        return v;
    }


/**
 * 中文转unicode
 * v      {srting}  内容
 * charA  {bool}    是否编码全部字符 默认只编码中文
 */
function en_unicode(v,charA=false){
    var ascii = "";
    for (var i = 0; i < v.length; i++) {
        var code = Number(v[i].charCodeAt(0));
        if (charA || code > 127) {
            var charAscii = code.toString(16);
            charAscii = new String("0000").substring(charAscii.length, 4) + charAscii;
            ascii += "\\u" + charAscii;
        } else {
            ascii += v[i];
        }
    }
    return ascii;
}

/*
旧算法
function crc32(  str,crc =0) {
    var table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D";
    var n = 0; //a number between 0 and 255
    var x = 0; //an hex number
    crc = crc ^ (-1);
    for( var i = 0, iTop = str.length; i < iTop; i++ ) {
        n = ( crc ^ str.charCodeAt( i ) ) & 0xFF;
        x = "0x" + table.substr( n * 9, 8 );
        crc = ( crc >>> 8 ) ^ x;
    }
    return crc ^ (-1);
};
*/

/**
 * crc32 新算法
 * @param {String} a 
 */
function crc32 (a) {
    var T = c = (function() {
        for (var d = 0, f = new Array(256), g = 0; 256 != g; ++g) {
          d = g, d = 1 & d ? -306674912 ^ d >>> 1 : d >>> 1, d = 1 & d ? -306674912 ^ d >>> 1 : d >>> 1, d = 1 & d ? -306674912 ^ d >>> 1 : d >>> 1, d = 1 & d ? -306674912 ^ d >>> 1 : d >>> 1, d = 1 & d ? -306674912 ^ d >>> 1 : d >>> 1, d = 1 & d ? -306674912 ^ d >>> 1 : d >>> 1, d = 1 & d ? -306674912 ^ d >>> 1 : d >>> 1, d = 1 & d ? -306674912 ^ d >>> 1 : d >>> 1, f[g] = d
        }
        return "undefined" != typeof Int32Array ? new Int32Array(f) : f
      })(),
      b = function(g) {
        for (var j, k, h = -1, f = 0, d = g.length; f < d;) {
          j = g.charCodeAt(f++),j < 128 ? h = h >>> 8 ^ c[255 & (h ^ j)] : j < 2048 ? (h = h >>> 8 ^ c[255 & (h ^ (192 | j >> 6 & 31))], h = h >>> 8 ^ c[255 & (h ^ (128 | 63 & j))]) : j >= 55296 && j < 57344 ? (j = (1023 & j) + 64, k = 1023 & g.charCodeAt(f++), h = h >>> 8 ^ c[255 & (h ^ (240 | j >> 8 & 7))], h = h >>> 8 ^ c[255 & (h ^ (128 | j >> 2 & 63))], h = h >>> 8 ^ c[255 & (h ^ (128 | k >> 6 & 15 | (3 & j) << 4))], h = h >>> 8 ^ c[255 & (h ^ (128 | 63 & k))]) : (h = h >>> 8 ^ c[255 & (h ^ (224 | j >> 12 & 15))], h = h >>> 8 ^ c[255 & (h ^ (128 | j >> 6 & 63))], h = h >>> 8 ^ c[255 & (h ^ (128 | 63 & j))])
        }
        return h ^ -1
      };
    function crc32_buf(buf, seed=0) {
        if(buf.length > 10000){
            var C = seed ^ -1, L = buf.length - 7;
            for(var i = 0; i < L;) {
                C = (C>>>8) ^ T[(C^buf[i++])&0xFF];
                C = (C>>>8) ^ T[(C^buf[i++])&0xFF];
                C = (C>>>8) ^ T[(C^buf[i++])&0xFF];
                C = (C>>>8) ^ T[(C^buf[i++])&0xFF];
                C = (C>>>8) ^ T[(C^buf[i++])&0xFF];
                C = (C>>>8) ^ T[(C^buf[i++])&0xFF];
                C = (C>>>8) ^ T[(C^buf[i++])&0xFF];
                C = (C>>>8) ^ T[(C^buf[i++])&0xFF];
            }
            while(i < L+7) C = (C>>>8) ^ T[(C^buf[i++])&0xFF];
            return C ^ -1;
        }
        var C = seed ^ -1, L = buf.length - 3;
        for(var i = 0; i < L;) {
            C = (C>>>8) ^ T[(C^buf[i++])&0xFF];
            C = (C>>>8) ^ T[(C^buf[i++])&0xFF];
            C = (C>>>8) ^ T[(C^buf[i++])&0xFF];
            C = (C>>>8) ^ T[(C^buf[i++])&0xFF];
        }
        while(i < L+3) C = (C>>>8) ^ T[(C^buf[i++])&0xFF];
        return C ^ -1;
    }
    try {
        if(a instanceof Buffer){
            return (crc32_buf(a) >>> 0).toString(16);
        }else{
            throw new Error('其他');
        }
        
    } catch (e) {
        return (b(a) >>> 0).toString(16);
    }
    
}
