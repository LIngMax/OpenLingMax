/**
 * 框架切换模块
 * 
 * by:LingMax
 */
var sxwy; //全局刷新网页函数
function Start_Iframes() {
    //var ifs= new Array();
    var ifi = -1,
        ifj = -1,
        ifs = new Array();
    //ifi是框架个数 ifj是上次框架  
    $('.layui-side .nl').each(function() {
        $(this).click(function() {
            if ($(this).attr('data-url') == null) {
                //空网页不创建内存
                return;
            }
            var ls = $(this).attr('data-int');
            if (ls == ifj) {
                //避免闪烁
                return;
            }
            //隐藏上次框架
            if (ifs.length > ifj && ifj != -1) {
                ifs[ifj].hide();
            }
            if (ls == null) {
                //第一次
                ifi++; //最后的序号+1
                ls = ifi; //框架的序号
                ifj = ifi; //计数量

                //创建框架
                $(this).attr('data-int', ifj);
                $('.layui-body').append("<iframe class='ife' src='" + $(this).attr('data-url') + "'></iframe>");
                ifs[ifj] = $('.ife').eq(ifj);
            } else {
                ifj = ls;
                //显示
                ifs[ifj].show(1); //为解决这个问题,填1,360浏览器bug
            }
        });
    });
    sxwy = function() {
        ifs[ifj][0].contentWindow.location.reload(true);
        //ifs[ifj].attr("src", ifs[ifj].attr("src"));
    }

    //win.showDevTools(ifs[ifj], function(){});

}