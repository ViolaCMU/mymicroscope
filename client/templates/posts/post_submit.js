Template.postSubmit.events({
  'submit form': function(e) {
    e.preventDefault();

    var post = {
      url: $(e.target).find('[name=url]').val(),
      title: $(e.target).find('[name=title]').val()
    };
    
    var errors = validatePost(post);
    if (errors.title || errors.url)
      return Session.set('postSubmitErrors', errors);
      //发生错误的话，用return终止helper执行,而不是实际返回这个值

//     post._id = Posts.insert(post); 这种方法是直接修改客户端的db
//     Router.go('postPage', post);
//     Meteor 内置方法是一种服务器端方法提供给客户端调用。insert(),update(),delete()都是
//     换成下面这种自定义的Meteor内置方法, 因为直接调insert()无法在此前对数据做处理
//     postInsert() 要自己在server实现
	Meteor.call('postInsert', post, function(error, result) {
	// Meteor call 的第一个参数为被调用方法的名字，第二个是该方法的参数，第三个是回调函数
      // 显示错误信息并退出
      if (error)
        //return alert(error.reason);
        return throwError(error.reason);
        
      // 显示结果，跳转页面
      if (result.postExists)
        //alert('This link has already been posted（该链接已经存在）');
        return throwError('This link has already been posted');
        
      Router.go('postPage', {_id: result._id});
      
    });
    //Router.go('postsList');
  }
});

Template.postSubmit.onCreated(function() {
  // 初始化，防止上次的信息还留着
  Session.set('postSubmitErrors', {});
});

Template.postSubmit.helpers({
  errorMessage: function(field) {
    return Session.get('postSubmitErrors')[field];
  },
  errorClass: function (field) {
    return !!Session.get('postSubmitErrors')[field] ? 'has-error' : '';
  }
});
