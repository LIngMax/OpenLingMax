/**
 * nwjs 跟随鼠标移动 模块
 * 
 * by:LingMax
 */
var win = nwjs.Window.get(); //win 窗口对象

$(function() {
    var
        lj //开关
        , hx = -155 //横
        ,
        hy = -155 //竖
        ,
        domx = $("#move") //操控的元素
    ;
    $(document).mousemove(function(e) {
        if (e.which == 1) {
            if (lj) {
                if (hx == -155) {
                    hx = e.pageX;
                    hy = e.pageY;
                }
                win.moveBy(e.pageX - hx, e.pageY - hy);
            }
        } else {
            lj = false;
            hx = -155;
            domx.css("cursor", "auto");
        }
    });

    domx.mousedown(function() {
        return;
        lj = true;
        domx.css("cssText", "cursor:move !important");
        domx.focus();
    });

    $(document).mouseup(function() {
        return;
        lj = false;
        hx = -155;
        domx.css("cursor", "auto");
    });
    domx.dblclick(function() {
        if (win.isFullscreen) {
            win.leaveFullscreen();
        } else {
            win.enterFullscreen();
        }
    });
});