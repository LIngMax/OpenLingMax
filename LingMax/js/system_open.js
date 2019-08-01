/*
 * @Author: phh@LingMax
 * @mail: xiaohxx@qq.com
 * @Date: 2019-01-12 14:31:26
 * @最后编辑: LingMax@phh
 * @文件详情: 开机脚本 启动脚本
 */


function kjjb (){
    var 
    runExeC = function(arrData){
        db.all('select exec_id from system_open where update_time = date("now")',[],function(err,arr){
            var data ,bz=false;
            arr.push({exec_id : -899999});//修复bug
            
            for (var key1 in arrData) {
                bz = false;
                for (var key in arr) {
                    if(arr[key]['exec_id'] == arrData[key1]['id']){
                        bz=true;
                        break;
                    }
                }
                if(!bz){
                    //执行代码
                    data = arrData[key1];
                    db.run1('insert into system_open (exec_id,run_return)values(?,?)',[data.id,runAllExeC(data)]);
                    //删除30天前的记录
                    db.run1("delete from system_open where update_time < date('now' ,'-30 day')");
                }
            }
        });
    },
    xhxx;

    db.all('select * from `exec` where `classx` = 11',[],function(err,arr){
        //console.log(arr);
        runExeC(arr);
    });
}

setInterval(kjjb, 1000*60*60*24);//一天运行一次

setTimeout(kjjb,1000*5);//5秒后执行开机脚本