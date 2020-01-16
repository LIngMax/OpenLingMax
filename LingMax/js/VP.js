/*
 * @Date: 2019-04-12 20:35:28
 * @Author: 	LingMax
 * @最后编辑: 	LingMax
 * @文件详情: 	原创JS公开变量遍历功能封装
 */


var aa,start;
/*
//性能测试
start = new Date().getTime();
for (let index = 0; index < 1000000; index++) {
    aa = {}; 
    aa.su = window;
    aa.key= index;
}
start = new Date().getTime() - start;
console.log(start);

start = new Date().getTime();
for (let index = 0; index < 1000000; index++) {
    aa = {"su":window,"key":index}; 
}
start = new Date().getTime() - start;
console.log(start);
*/

//搜索内存变量 
var VP = new function (){

//this.T_djc = 99;//最高获取几层变量
//this.T_dsg = 10000;//限制只扫描属性小于多少个 排除大数据
//this.T_pcc = [];//要排除的变量 必须存在
this.T_jg   = {};//结果
this.T_ls   = [];//历史搜索结果

/**
 * 精准搜索
 * @param {string} all      要搜索的文本
 */
function SweepStr(all){
    let arr = {};
    arr = this.T_jg.all;
    
    if(typeof all== 'string'){
        all = all.replace(/([\^\!\$\*\(\)\+\=\|\\\[\]\{\}\.\?])/gi,"\\$1")
        all = new RegExp('.*'+all+'.*',"ig");
    }

    let key,array = Object.keys(arr),jg=[];
    for (let index = 0; index < array.length; index++) {
        key = array[index];
        if(arr[key]==all){
            jg[key] = arr[key];
        }
    }
    
    this.T_ls.push(this.T_jg.all);
    this.T_jg.all = jg;
    return jg;
}

/**
 * 搜索地址   
 * @param {string} all      要扫描的变量地址 文本 | 正则new RegExp("\\w+","ig");
 */
function SweepAddr(all){
    let arr={};
    arr =  this.T_jg.all;

    if(typeof all== 'string'){
        all = all.replace(/([\^\!\$\*\(\)\+\=\|\\\[\]\{\}\.\?])/gi,"\\$1")
        all = new RegExp('.*'+all+'.*',"ig");
    }

    let key,array = Object.keys(arr),jg=[];
    for (let index = 0; index < array.length; index++) {
        key = array[index];
        if(key.search(all) > -1){
            jg[key] = arr[key];
        }
    }
    
    this.T_ls.push(this.T_jg.all);
    this.T_jg.all = jg;
    return jg;
}

/**
 * 搜索全部--循环搜索
 * @param {string} all      要扫描的变量地址 文本 | 正则new RegExp("\\w+","ig");
 * @param {string} isAddr   是否扫描地址
 */
function SweepAllFor(all,isAddr=false){
    let arr={};
    arr =  this.T_jg.all;
    
    if(typeof all== 'string'){
        all = all.replace(/([\^\!\$\*\(\)\+\=\|\\\[\]\{\}\.\?])/gi,"\\$1")
        all = new RegExp('.*'+all+'.*',"ig");
    }

    let key,array = Object.keys(arr),jg={};
    for (let index = 0; index < array.length; index++) {
        key = array[index];
        if((arr[key].su[arr[key].key]+'').search(all) > -1 || (isAddr==false && key.search(all) > -1)){
            jg[key] = arr[key];
        }
    }

    this.T_ls.push(this.T_jg.all);
    this.T_jg.all = jg;
    return jg;
}

/**
 * 搜索汇总--文本搜索
 * @param {string} all      要搜索的文本
 * @param {string} isAddr   是否扫描地址
 */
function SweepAllStr(all,isAddr=false){
    let arr={};
    arr =  this.T_jg.all;

    let ll= '',key,array = Object.keys(arr),jg={},ls;
    for (let index = 0; index < array.length; index++) {
        key = array[index];
        ll += arr[key].su[arr[key].key] + ":#=xhxx=#:" + key +"\r\n";
        //ll += arr[key].jg + ":#=xhxx=#:" + key +"\r\n";
    }
    if(typeof all== 'string'){
        all = all.replace(/([\^\!\$\*\(\)\+\=\|\\\[\]\{\}\.\?])/gi,"\\$1")
        if(isAddr){
            all = new RegExp('(?:.*|.*'+all+'.*):#=xhxx=#:(.*'+all+'.*)',"ig");
        }else{
            all = new RegExp('.*'+all+'.*:#=xhxx=#:(.*)',"ig");
        }
        
    }
    while ((ls = all.exec(ll)) != null)  {
        key = ls[1];
        jg[key] = arr[key];//arr[key].su[arr[key].key];
    }

    this.T_ls.push(this.T_jg.all);
    this.T_jg.all = jg;
    return jg;
}


/**
 * 开始扫描
 * @param {string}  ksVal    要扫描的变量地址 'window'字符串表达式
 * @param {boolean} sf       是否扫描html元素
 * @param {array}   pcc      要排除的变量 必须存在  文本数组
 * @param {int}     djc      最高获取几层变量
 * @param {int}     dsg      限制只扫描属性小于多少个 排除大数据
 * By:LingMax
 */
function SweepStart(ksVal,sf=false,pcc=[],djc=99,dsg=10000)
{
    if(sf){
        window.sdfslfhasofuiwehnfvlghe = window.document.all;
    }else{
        window.sdfslfhasofuiwehnfvlghe = null;
    }
    this.T_ls = [];
    this.T_jg = SweepVariable(ksVal,pcc,djc,dsg);
}

//撤销一次搜索记录 相当于回退
function SweepReturn()
{
    if(this.T_ls.length < 1){
        return false;
    }
    this.T_jg.all = this.T_ls.pop();
    return true;
}

//测试环境是否认同本功能
this.isTrue = function (){
    return window['VP'] === this;
}

/**
 * 高性能扫描内存
 * @param {string} ksVal    要扫描的变量地址 'window'字符串表达式
 * @param {array} pcc       要排除的变量 必须存在  文本数组
 * @param {int} djc         最高获取几层变量
 * @param {int} dsg         限制只扫描属性小于多少个 排除大数据
 * By:LingMax
 */
function SweepVariable(ksVal,pcc=[],djc=99,dsg=10000){
    let
    ObjX,//临时对象
    lsc,//临时 条件
    obb,//临时对象
    type,//变量类型储存
    llstr,//临时储存 
    newObjX     = {},//存 符合条件的变量列表
    newArrX     = [],//存 符合条件的变量列表 数组
    zz          = [],//对象列表
    addrs       = '',//临时变量地址
    newStr      = {},//存 文本 变量
    newNum      = {},//存 数字 变量
    newBoo      = {},//存 逻辑型 变量
    oldStr      = {},//存 重复的 对象列表
    start       = new Date().getTime(),//执行时间 统计
    addr        = [],//地址列表
    iii         = -1,//遍历的进度
    array       = [],//数组 
    arrx        = {},//地址列表+变量层数
    wnsb        = [],//未能识别的类型
    dasfds=[];
    //排除的变量
    for (const ktt in pcc) {
        try {
            addr.push(eval(pcc[ktt]));//进栈
            zz.push(pcc[ktt]);//遍历过的集合体 地址文本
            iii++;
            arrx[pcc[ktt]] = 0;//第几层
        } catch (error) {
            
        }
    }
    arrx[ksVal] = 1;//第几层
    eval('addr.push('+ksVal+')');
    zz.push(ksVal);
    do { 
        iii++;
        ObjX = addr[iii];
        addrs = zz[iii];

        if(arrx[addrs]>=djc){
            continue;
        }

        if(ObjX === window.VP) continue;//自身不扫描
        //console.log(addrs,ObjX);
        
        if(ObjX === null) continue;//不扫描null
        array = [];
        if(typeof ObjX === 'object') array = Object.keys(ObjX);

        if(array.length >= dsg)continue;//限制层数超出
        //console.log(array);
        for (let index = 0; index < array.length; index++) {
            let key = array[index];  
            try {
                //console.log(llstr,iii);
                obb = ObjX[key];
            } catch (error) {
                //console.log("报错",llstr,iii);
                continue;//读取失败的直接取消
            }

            if(obb === null) continue;
            if(obb === "") continue;
            if(obb === undefined) continue;

            type = typeof obb;
            llstr = addrs+"['"+key+"']";
            if(type === "function") continue;
            if(type === "object"){//ObjX[key] instanceof Array ||
                //开始查找重复变量
                lsc = false;
                for (let ix1 = 0; ix1 < addr.length; ix1++) {
                    if(obb === addr[ix1]){
                        oldStr[llstr] = zz[ix1];
                        lsc = true;
                        break;
                    }
                }  
                if(lsc) continue;//重复变量对象跳过
                //结束查找重复变量

                zz.push(llstr);//记录遍历过的集合体
                addr.push(obb);//进栈  加入待扫描数组
                arrx[llstr] = arrx[addrs]+1;//位置在第几层 层数+1
                //console.log(addrs+'["'+key+'"]');
            }
            //仅仅放行已知类型
            else if(["number","string","boolean","bigint"].indexOf(type) > -1){
                /*
                if(type === "number"){
                    newNum[llstr] = {"su":ObjX,"key":key};
                }else if(type === "boolean"){
                    newBoo[llstr] = {"su":ObjX,"key":key};
                }else{// if(type === "string"){
                    newStr[llstr] = {"su":ObjX,"key":key};
                }
                */
                newObjX[llstr] = {
                    'path':llstr,//路径
                    "su":ObjX,//上一层
                    "key":key,//当前变量名
                    'val':obb//数据静态
                };
                newArrX.push(newObjX[llstr]);
            }else{
                //未能识别的类型
                wnsb[llstr] = obb;
            }
        }
    }while (zz.length > iii+1);
    start = new Date().getTime() - start;
    return {
        "boo":newBoo ,//逻辑变量集
        "num":newNum ,//数字变量集
        "str":newStr,//字符串变量集
        "all":newObjX,//所有变量集 内容静态
        'arr':newArrX,//所有变量的映射地址 内容动态
        "遍历过的集合体":zz,
        "发现重复指针":oldStr,
        "代码执行时间ms":start,
        "未能识别的类型":wnsb,
        's':function (){//另存为文件的函数
            //循环拼接 字符串 以便搜索
            let ll= '',key,array = Object.keys(newObjX),jg=[];
            for (let index = 0; index < array.length; index++) {
                key = array[index];
                ll += newObjX[key].su[newObjX[key].key] + ":#=xhxx=#:" + key +"\r\n";
                //ll += arr[key].jg + ":#=xhxx=#:" + key +"\r\n";
            }
            dow(ll);
        }
    }
}

/**
 * 下载文件
 * @param {*} data 
 * @param {*} filename 
 */
function dow(data,filename){
    if(!filename) filename = 'console.json';
    if(typeof data === "object"){
        data = JSON.stringify(data, undefined, 4);
    }
    var blob = new Blob([data], {type: 'text/json'}),
    e = document.createEvent('MouseEvents'),
    a = document.createElement('a');
    a.download = filename;
    a.href = window.URL.createObjectURL(blob);
    a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    a.dispatchEvent(e);
}  
//公开方法
this.dow            = dow;
this.SweepVariable  = SweepVariable;
this.SweepStr       = SweepStr;
this.SweepStart     = SweepStart;
this.SweepAddr      = SweepAddr;
this.SweepAllFor    = SweepAllFor;
this.SweepAllStr    = SweepAllStr;
this.SweepReturn    = SweepReturn;
}//class
/*
VP.SweepVariable('window',[
    'window["chrome"]'
    //,window["process"]'
]).s();
*/
