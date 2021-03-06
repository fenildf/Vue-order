var UserGroupProxy=require('../proxy').UserGroup;
var UserProxy=require('../proxy').User;
var EventProxy = require('eventproxy');
var moment=require('moment');
var validator=require('validator');
/**
 * 
 */
exports.group_list=function(req,res,next){
    //分页页数
    var page = parseInt(req.query.page, 10) || 1;
    page = page > 0 ? page : 1;
    var totalCount=0;
    var proxy=new EventProxy();
    proxy.fail(next);
    var query = {},limit=10;
    //分页查询
    var opt = { skip: (page - 1) * limit, limit: limit, sort: '-create_at'};
    UserGroupProxy.getGroupsByQuery(query, opt,proxy.done('groups',function (groups) {
        groups.map(function (group) {
            group.createAt=moment(group.create_at).format('YYYY-MM-DD HH:mm:ss');
        });
       return groups;
    }));
    UserGroupProxy.getCountByQuery(query, proxy.done(function (all_group_count) {
        var pages = Math.ceil(all_group_count / limit);
        totalCount=all_group_count;
        proxy.emit('pages', pages);
    }));
    proxy.all('groups','pages',function(groups,pages){
        res.render('admin/user/grouplist', {
        groups: groups,
        current_page: page,
        list_group_count: limit,
        all_group_count: totalCount,
        pages: pages,
        base:'/admin/usergroup/',
        pageTitle: '分组管理'
      });
    });
    
};
/**
 * 新增分组
 */
exports.create=function(req,res,next){
     var grouptitle = validator.trim(req.body.grouptitle);
     if(!grouptitle){
         return res.send({success:false,message:'分组名称不能为空'})
     }
     UserGroupProxy.newAndSave(grouptitle,function(err,group){
         if(err){
             return next(err);
         }
         res.send({success:true,message:'保存成功',data:group});
     });
}
/**
 * 编辑分组
 */
exports.edit=function(req,res,next){
     var gid = validator.trim(req.params.gid);
     var grouptitle = validator.trim(req.body.grouptitle);
     if(!grouptitle){
         return res.send({success:false,message:'分组名称不能为空'})
     }
     UserGroupProxy.getUserGroupById(gid,function(err,group){
         if(err){
             return next(err);
         }
         if(!group){
           return res.send({success:false,message:'分组不存在！'})
         }
         group.grouptitle=grouptitle;
         group.save(function(err){
            if(err){
                return res.send({sucess:false,message:err.message});
            }
            return  res.send({success:true,message:'保存成功',data:group});
         });
     });
}

/**
 * 删除分组
 */
exports.del=function(req,res,next){
     var gid = validator.trim(req.params.gid);
     
     var proxy=new EventProxy();
     proxy.fail(next);
     
     UserGroupProxy.getUserGroupById(gid,proxy.done(function(group){
         if(!group){
           return res.send({success:false,message:'分组不存在！'})
         }
         proxy.emit('group',group);
     }));
     UserProxy.getUserByGroupId(gid,proxy.done(function(users){
         if(users && users.length>0){
           return res.send({success:false,message:'分组存在用户，不能删除！'})
         }
         proxy.emit('users',null);
     }));
     proxy.all('group','users',function(group,users){
         UserGroupProxy.removeById(gid,function(err,group){
             if(err){
                  return res.send({ success: false, message: err.message });
             }else{
                  return res.send({ success: true, message: '删除成功！' });
             }
         });
     });
}