/**
 * 工具箱模块
 * 
 * by:LingMax
 */
var iixc = 0; //异步的坑

// HOOK  遇到开发者环境时
var dirxx = dir;
if(cwd == 'G:\\syn\\OpenLingMax\\LingMax'){
    console.log('工具库切换到 开发者环境');
    dirxx = function(){
        var aacce = arguments;
        if(aacce.length > 0 && (aacce[0]+'').length > 0) aacce[0] = 'G:/软件/LingMax/resource/'+aacce[0];
        return dir.apply(this, aacce);
    };
}


/**
 * 重载界面
 * @param {json} json_tools  数据
 * @param {dom} dom_pant   父元素 的js原生元素
 */
function local_tools(json_tools, dom_pant) {

    var zjj = function(jx) {
        var lj, addr, iis, ls = '';
        lj = fs.existsSync(dirxx(json_tools[jx].path));
        addr = json_tools[jx].id;
        //edit_info(id)
        ls = '<div class="layui-collapse" ><div class="layui-colla-item"><h2 class="layui-colla-title">' + json_tools[jx].name + '<div class="py_right" data-path="' + addr + '"><a href="javacript:;" title="打开主程序目录" data-path="' + addr + '" class="mainpathx ' + (lj ? '' : 'layui-hide') + '"><i class="layui-icon layui-icon-app color_qj_green"></i></a> <a href="javacript:;" title="打开下载目录" data-path="' + addr + '" class="pathx ' + (lj ? '' : 'layui-hide') + '"><i class="layui-icon layui-icon-template-1 color_qj_green"></i></a><a href="javacript:;" title="修改详情" class="webedit"><i class="layui-icon color_qj_green layui-icon-edit"></i></a> <a href="javacript:;" title="去网站下载" data-path="' + addr + '" class="webpath "><i id="xhrun" class="layui-icon color_qj_green ' + (lj ? 'layui-icon-ok' : 'layui-icon-upload') + '"></i></a> <button class="layui-btn layui-btn-normal btn_run execx" data-path="' + addr + '">' + (lj ? '运行' : '下载') + '</button> </div></h2><div class="layui-colla-content kkide"><p>' + json_tools[jx].recommend + '</p>';
        ls = ls + '</div></div></div>';
        iis = $(ls);
        dom_pant.append(iis);
        iis = $(iis.find(".kkide")[0]);
        iixc++;
        db.all('select * from obj where su = ' + addr + ' order by sortx desc', [], function(err, rows) {
            //console.log(iis);
            local_tools(rows, iis);
            iixc--;
            if (iixc == 0) {
                csh();
            }
        });

    };
    for (var jx in json_tools) {
        zjj(jx);
    }
}