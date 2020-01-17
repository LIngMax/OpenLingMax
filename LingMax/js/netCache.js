/*
 * @Date: 2020-01-07 21:44:18
 * @Author: 	LingMax[xiaohxx@qq.com]
 * @最后编辑: 	LingMax[xiaohxx@qq.com]
 * @文件详情: 	网络优化模块  请尊重原著 借鉴本功能 请备注出处 [开发者神器库 by:LingMax]
 */
//var arr = [];for (const key in temp1) {arr.push(temp1[key].name) ;}

 var 
 dgram      = require('dgram'),
 udpServer  = dgram.createSocket('udp4'),//监听53端口
 dp         = require('dns-packet'),
 Dcache     = {},//dns缓存
 Ecache     = {},//已经优化过的 缓存
 ping       = require ("net-ping"),
 net        = require('net'),
 //fs         = require('fs'),
 arrLd      = [],//列队 限速,限制不卡
 adasdadsad;
 var ddaatt = [];//缓存
 //const ipS = new (require('maxmind')).Reader(fs.readFileSync(__dirname + '/GeoLite2-City.mmdb'));
 //console.log(lookup.get('66.6.44.4'));
var ztzt =  true;
var delCacheTime = 40*60*1000;//40分钟

setInterval(() => {
    var tt = new Date().getTime();
    for (const key in Dcache) {
        if(Dcache[key].ltime <= tt){
            //console.log(Dcache[key]);
            
            delete Ecache[Dcache[key].host];
            delete ddaatt[Dcache[key].host];
            delete Dcache[key];
        }
            
    }
}, 60*1000+50);;//一分钟 删除一次过期的

 //处理53端口请求
udpServer.on('message', function(msg, rinfo){
    try {
        var data = dp.decode(msg);
        //console.log(data.questions[0].name);
    } catch (error) {
        return;
    }
    //开始  解析114 事件处理
    var udpC = dgram.createSocket('udp4');
    setTimeout(()=>{udpC.close();},2000);//定时销毁
    udpC.on('message', (msgC,rinfoC) =>{
        var lsls;
        try {
            lsls = dp.decode(msgC);
            //console.log(lsls);
            if(!Ecache[data.questions[0].name]){
                for (const key in lsls.answers) {//遍历得到的ip
                    if (lsls.answers.hasOwnProperty(key) && lsls.answers[key].type == 'A') {
                        lsls.answers[key].ttl = 5;//修改过期时间
                    }
                } 
            }
        } catch (err) {}
        udpServer.send(dp.encode(lsls), rinfo.port, rinfo.address, (err) => {});
    });
    //结束 解析114 事件处理

    try {
        if(data.questions[0].type == 'A' && ztzt){//是不是解析 域名=>ip
            if(typeof Dcache[data.questions[0].name] == 'object'){//判断是不是有缓存
                Dcache[data.questions[0].name].id = data.id;
                var fMsg = dp.encode(Dcache[data.questions[0].name]);
                udpServer.send(fMsg, rinfo.port, rinfo.address, (err) => {});
                //console.log('触发缓存'+data.questions[0].name);
                //console.log("cache",Dcache[data.questions[0].name])
                //console.log("data",data)
                return; //不走其他
            }else{
                //创建一个新缓存
                //console.log(data,'创建缓存');
                udpC.send(msg, 53, '114.114.114.114', (err) => {});
                arrLd.push({'host':data.questions[0].name,'msg':msg});
                
            }

        }else{
            //其他解析走114解析
            udpC.send(msg, 53, '114.114.114.114', (err) => {});
        }
            
    } catch (error) {}

});
udpServer.bind(53);

setInterval(() => {
    var dd = arrLd.pop();
    if(!dd) return;
    dnsCacheFun(dd.host,function(c){
        Dcache[dd.host] = c;
    },dd.msg);
}, 200);//最多每秒处理n个 创建缓存 列队限速



var dnsServer = [
    '140.143.17.38',//华北->天津
    '218.24.31.136',//东北->辽宁
    '220.191.185.84',//华东->浙江
    '219.137.38.152',//华南->广东
    '219.144.217.102',//西北->陕西
    '218.75.136.129',//'119.39.48.24',//华中->湖南
    '58.42.243.100',//西南->贵州
    '218.195.253.4',//'120.68.41.38',//新疆
    '101.1.18.100',//香港
    '106.104.33.33',//台湾
    '13.88.181.15',//美国
    '103.74.185.73',//澳大利亚
    '101.235.68.87',//韩国
    '24.222.19.35',//加拿大
    '219.117.212.246',//日本
    '82.112.205.222',//意大利
    '78.32.229.105',//英国
    '95.97.18.67',//荷兰
    '86.208.146.211',//法国
    '62.96.226.195',//英国
    '200.5.32.1',//巴西
    '62.117.96.135',//俄罗斯
    '62.214.50.165',//德国
    '1.186.80.138',//印度
    '82.118.227.235',//保加利亚
    '101.100.181.222',//新加坡
    '62.248.0.21',//土耳其
    //'110.16.83.90',//呼和浩特
    //'219.135.182.3',//广州
    '119.29.29.29',//腾讯
    //'114.114.114.114',//保底
    '223.5.5.5',//阿里
    '180.76.76.76',//百度
    '208.67.222.222',//openDNS
];



// dnsCacheFun('www.taobao.com',function(c){
// });
/**
 * @Function: 	获取指定域名的dns缓存
 * @Author: 	LingMax[xiaohxx@qq.com]
 * @Params: 	String	host		域名
 * @Return: 	*
 */
function dnsCacheFun(host,fun,dd){
    var arr = {};
    if(Ecache[host]) return;
    Ecache[host] = true;
    //1.5秒后开始 检测结果
    setTimeout(()=>{
        //单通道模式
        var ret = Object.keys(arr).map(function(keyxx) {return arr[keyxx];});
        for (const key22 in ret) {
            if (ret.hasOwnProperty(key22)) {
                const b = ret[key22];
                if(b.tcp==9999 && b.ping!=9999){
                    ret[key22].zs = b.ping*2;
                }else if(b.tcp!=9999 && b.ping==9999){
                    ret[key22].zs = b.tcp*2;
                }else{
                    ret[key22].zs = b.tcp+b.ping;
                }
            }
        }
        var retArr = ret.sort((a,b)=>{
            return a.zs-b.zs;
        });
        ret = retArr[0];
        
        if(!ret){
            //Ecache[host] = true;
            //bigCache(0,host,retArr);
            //console.log(retArr.length+" 放弃空值 "+ host);
            return;//放弃
        }else if(ret.zs == 19998){
            //Ecache[host] = true;
            //bigCache(1,host,retArr);
            //console.log(retArr.length + " 放弃超出 " + host + " => " + ret.zs);
            //console.log(retArr);
            return;//放弃
        }else{
            //console.log("IP:"+retArr.length+" TCP80:"+ret.tcp+" Ping:"+ret.ping+"   延迟:"+ret.zs+"  优化结果:"+ret.host+"    =>  "+ret.ip);
            ret.data.retArr = retArr;
            ret.data.host = host;
            ret.data.ltime = new Date().getTime()+delCacheTime;
            fun(ret.data);
            //if(ret.zs > 700){
            //    bigCache(2,host,retArr);
            //}
        }
        return ;
    },2500);
    //结束检查结果

    //开始查询udp dns
    //var msgCC = dp.encode(dd);//生成查询数据包
    for (var key in dnsServer) {//循环dns 各地 服务器 每查到一个ip都添加进arr
        if (dnsServer.hasOwnProperty(key)) {
            (function(){//创造变量空间
                var ee = dnsServer[key];
                var udpC = dgram.createSocket('udp4');
                setTimeout(()=>{udpC.close();},2000);//定时销毁
                udpC.on('message', (msgC,rinfoC) =>{//解析结果
                    //console.log(msgC);
                    try {
                        var lsls = dp.decode(msgC);
                    } catch (error) {
                        //console.log(host,ee,msgC);
                        //throw error;
                        return;
                    }
                    
                    for (var key1 in lsls.answers) {//遍历得到的ip
                        if (lsls.answers.hasOwnProperty(key1) && lsls.answers[key1].type == 'A') {
                            var ipv4 = lsls.answers[key1].data;
                            if(arr[ipv4]|| '0.0.0.0'==ipv4||'127.0.0.1'==ipv4) continue;
                            arr[ipv4] = {
                                'ip':ipv4,
                                'host':host,
                                'dns':ee,
                                'data':lsls,
                                'ping':9999,
                                'tcp':9999,
                                'zs':9999
                            };
                            arr[ipv4].data.answers = [{
                                'class':"IN",
                                'data':ipv4,
                                'flush':false,
                                'name':host,
                                'ttl':295,
                                'type':"A"
                            }];
                            (function(){//创造变量空间
                                var tt = new Date().getTime();
                                //检测80端口
                                var socket = new net.Socket()
                                socket.setTimeout(2000);
                                socket.on('connect', function() {
                                    arr[ipv4].tcp = new Date().getTime() - tt;
                                    socket.destroy();
                                });
                                socket.on('error', function() {socket.destroy();});
                                socket.on('timeout', function() {socket.destroy();});
                                socket.connect(80, ipv4);
                                //socket.connect(443, ipv4);

                                var ttp = new Date().getTime();
                                //检测ping
                                var session = ping.createSession({'sessionId': parseInt(Math.random()*(99999999-99999+1)+99999,10)});
                                session.pingHost(ipv4,(err, target)=>{
                                    if(err === null){
                                        arr[ipv4].ping = new Date().getTime() - ttp;
                                    }
                                    session.close(); 
                                });                  
                            })();
                        }
                    }
                });
                udpC.send(dd, 53, ee, (err) => {});
            })();
        }
    }
}


/*
//万能代理 功能不好用 弃用
var allDns = [
    '103.136.40.74',
];

//https代理
var allProxy = [
    {'ip':'218.60.8.99','port':3129},
    {'ip':'51.158.99.51','port':8811},
];
//深度高级优化 网络
//* @param int       type    类型 0:空值 1:超时放弃
//* @param string    host    域名
function bigCache(type,host,retArr) {
    //写注册项 (#现行用户, “SOFTWARE\Microsoft\Windows\CurrentVersion\Internet Settings”, “https://pac.mcplay.cn/jp.pac”)
    //if(type==0) {//未查到dns 放弃
        //return;
    //}else 
   var allDnsArr    = [];
   var proxyArr     = [];

    if(type===1) {//访问异常
        //扫描端口连接 
    }else if(type===2){//延迟太高
        if(retArr[0].tcp != 9999){//是否有web服务器
            var lltt = true;
            var tt = new Date().getTime();
            var socket = new net.Socket()
            socket.setTimeout(2000);
            socket.on('connect', function() {
                socket.write(getHttpHead(host));
            });
            socket.on('error', function() {socket.destroy();});
            socket.on('timeout', function() {socket.destroy();});
            socket.on('data', (data) => {
                if (lltt) {
                    lltt = false;
                }else{
                    return;
                }
                tt = new Date().getTime() - tt;//原优化速度
                socket.destroy();
                var dd = data.toString().substr(0,800);
                var isProxy     = true;
                var isAllDns    = false;
                if(isAllDns){
                    //万能dns 优化尝试 开始
                    setTimeout(() => {
                        allDnsArr.sort((a,b)=>{
                            return a.ms-b.ms;
                        });
                        if(!allDnsArr[0])return;
                        console.log('万能dns '+host+' => '+allDnsArr[0].ip);
                        
                        //构建万能dns缓存
                        Dcache[host] = {
                            'id': 29621,
                            'type': 'response',
                            'flags': 384,
                            'flag_qr': true,
                            'opcode': 'QUERY',
                            'flag_aa': false,
                            'flag_tc': false,
                            'flag_rd': true,
                            'flag_ra': true,
                            'flag_z': false,
                            'flag_ad': false,
                            'flag_cd': false,
                            'rcode': 'NOERROR',
                            'questions': [ { 'name': host, 'type': 'A', 'class': 'IN' } ],
                            'answers': [
                                {
                                'name': host,
                                'type': 'A',
                                'ttl': 600,
                                'class': 'IN',
                                'flush': false,
                                'data': allDnsArr[0].ip
                                }
                            ],
                            'authorities': [],
                            'additionals': []
                        };
                    }, 5000);
                    for (var key45 in allDns) {
                        if (allDns.hasOwnProperty(key45)) {
                            (function (){//匿名变量域
                                var tt1 = new Date().getTime();
                                var ss = new net.Socket()
                                ss.setTimeout(2000);
                                ss.on('connect', function() {
                                    ss.write(getHttpHead(host));
                                });
                                ss.on('error', function() {ss.destroy();});
                                ss.on('timeout', function() {ss.destroy();});
                                ss.on('data', (data1) => {
                                    ss.destroy();
                                    tt1 = new Date().getTime() - tt1;//新优化速度
                                    if(tt1>=tt) return;//如果不如原优化快 就不用添加进优化列表了
                                    if(similar(dd, data1.toString().substr(0,800))<0.7)return ;//如果 结果不对 也是死路一条
                                    allDnsArr.push({
                                        'ip':allDns[key45],
                                        'ms':tt1
                                    });
                                });
                                ss.connect(80, allDns[key45]);
                            })();
                        }
                    }
                    //万能dns结束
                }
                if(isProxy){
                    //http proxy 优化尝试 开始
                    setTimeout(() => {
                        proxyArr.sort((a,b)=>{
                            return a.ms-b.ms;
                        });
                        if(!proxyArr[0])return;
                        console.log('HttpProxy '+host+' => '+proxyArr[0].ip);
                        
                        //构建万能dns缓存
                        
                    }, 8000);
                    for (let key44 in allProxy) {
                        if (allProxy.hasOwnProperty(key44)) {
                            (function (){//匿名变量域
                                var tt1x = new Date().getTime();
                                var ss = new net.Socket()
                                var key45 = key44;
                                var llttx = true;
                                ss.setTimeout(2000);
                                ss.on('connect', function() {
                                    console.log(allProxy[key45].ip,allProxy[key45].port);
                                    ss.write(getHttpProxyHead(host));
                                });
                                ss.on('error', function() {ss.destroy();});
                                ss.on('timeout', function() {ss.destroy();});
                                ss.on('data', (data1) => {
                                    if (llttx) {
                                        llttx = false;
                                    }else{
                                        return;
                                    }
                                    ss.destroy();
                                    let tt1 = new Date().getTime() - tt1x;//新优化速度
                                    var add = data1.toString();
                                    var ll = add.length;
                                    if (dd.length >= ll ) {
                                        
                                    }else{
                                        ll = dd.length;
                                    }

                                    console.log(similar(dd, add.substr(0,ll)),host,tt,tt1,add.substr(0,ll));
                                    if(tt1+200 >= tt) return;//如果不如原优化快 就不用添加进优化列表了
                                    if(similar(dd, add.substr(0,ll))<0.7)return ;//如果 结果不对 也是死路一条
                                    proxyArr.push({
                                        'ip':allProxy[key45].ip,
                                        'ms':tt1
                                    });
                                });
                                //console.log(allProxy[key45].ip,allProxy[key45].port);
                                ss.connect(allProxy[key45].port, allProxy[key45].ip);
                            })();
                        }
                    }
                //http proxy 结束  
                }
            });
            socket.connect(80, retArr[0].ip);
        }
    }
}

var 
pacArr = [],
pacFile = '';


//构造pacFile
function pacFun() {
    var pac = `function FindProxyForURL(url, host) {`;
    for (const key in pacArr) {
        if (pacArr.hasOwnProperty(key)) {
            pac += `
    if(dnsDomainIs(host, "`+pacArr[key].host+`")){
        return '`+pacArr[key].proxy+`';
    }       `;
        }
    }
    pac += `
        return 'DIRECT';
    }`;
    pacFile = pac;
}

var pacServer = net.createServer(function(socket){

    socket.on('data', function(data){
        socket.end(`HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: `+pacFile.length+`\r\n\r\n`+pacFile,'utf8',()=>{
            //socket.close();
        });

        //console.log('服务端：收到客户端数据，内容为{'+ data +'}');
        //console.log(' ');
        //console.log(data.toString());
        //console.log(' ');
        // 给客户端返回数据
        //socket.write('你好，我是服务端');
        //socket.end('你好，我是服务端');
        //socket.close()
    });
    socket.on('error', (err) => {

    });
});
pacServer.on('error', (err) => {

});
pacServer.listen(8256);


function getHttpHead(host){
    return `GET / HTTP/1.1\r\nHost: `+host+`\r\nConnection: close\r\nUser-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.41.1 Chrome/76.0.3809.146 Electron/6.1.5 Safari/537.36\r\n\r\n`;
}

function getHttpProxyHead(host){
    return `GET http://`+host+`/ HTTP/1.1\r\nHost: `+host+`\r\nUpgrade-Insecure-Requests: 1\r\nProxy-Connection: close\r\nUser-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.41.1 Chrome/76.0.3809.146 Electron/6.1.5 Safari/537.36\r\n\r\n`;
}

//计算文本相似度
//var s1 = similar('龙凤店','龙凤店')  // 1
//var s2 = similar('龙_神话与幻兽','龙凤店')  // 0.1
//@param string    s  对比文本1
//@param string    t  对比文本2
//* @param int       f  小数位数
function similar(s, t, f) {
    if (!s || !t) {
        return 0
    }
    var l = s.length > t.length ? s.length : t.length
    var n = s.length
    var m = t.length
    var d = []
    f = f || 3
    var min = function(a, b, c) {
        return a < b ? (a < c ? a : c) : (b < c ? b : c)
    }
    var i, j, si, tj, cost
    if (n === 0) return m
    if (m === 0) return n
    for (i = 0; i <= n; i++) {
        d[i] = []
        d[i][0] = i
    }
    for (j = 0; j <= m; j++) {
        d[0][j] = j
    }
    for (i = 1; i <= n; i++) {
        si = s.charAt(i - 1)
        for (j = 1; j <= m; j++) {
            tj = t.charAt(j - 1)
            if (si === tj) {
                cost = 0
            } else {
                cost = 1
            }
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
        }
    }
    let res = (1 - d[n][m] / l)
    return res.toFixed(f)
}

*/