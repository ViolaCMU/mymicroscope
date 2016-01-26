Posts = new Mongo.Collection('posts');

//Posts.allow({
//  insert: function(userId, doc) {
//    // 只允许登录用户添加帖子
//    return !! userId;
//  }
//});
//因为 Meteor Methods 是在服务器上执行，所以 Meteor 假设它们是可信任的。这样的话，Meteor 方法就会绕过任何 allow/deny 回调。

//在创建帖子这个章节，我们抛弃了 allow() 方法，因为我们只通过服务端方法去插入新的帖子（绕过了 allow() 方法）。
//但是现在我们要在客户端编辑和删除帖子！我们回到 posts.js 文件并添加 allow()
Posts.allow({
  update: function(userId, post) { return ownsDocument(userId, post); },
  remove: function(userId, post) { return ownsDocument(userId, post); }
});

Posts.deny({
  update: function(userId, post, fieldNames) {
    // 只能更改如下两个字段：
    // 并使用 Underscore 的 without() 方法返回一个不包含 url 和 title 字段的子数组。
    return (_.without(fieldNames, 'url', 'title').length > 0);
  }
});

Posts.deny({
  // 检查更新时url, title是否都填了
  update: function(userId, post, fieldNames, modifier) {
    var errors = validatePost(modifier.$set);
    // modifier.$set 像整个 post 对象那样包含同样两个 title 和 url 属性。当然，这也的确意味着只部分更新 title 或者 url 是不行的，但是实践中不应有问题。
    return errors.title || errors.url;
  }
});

Meteor.methods({
  postInsert: function(postAttributes) {
    check(Meteor.userId(), String);
    check(postAttributes, {
      title: String,
      url: String
    });
    
    var errors = validatePost(postAttributes);
    if (errors.title || errors.url)
      throw new Meteor.Error('invalid-post', "你必须为你的帖子填写标题和 URL");
    
//     if (Meteor.isServer) {
//       postAttributes.title += "(server)";
//       // wait for 5 seconds
//       Meteor._sleepForMs(5000);
//     } else {
//       postAttributes.title += "(client)";
//     }   
    // 询问 Meteor 这部分代码是否在服务器端执行。如果是，我们会在帖子的标题后面添加 (server) 字符串。如果不是，我们将添加 (client) 字符串
   
    var user = Meteor.user();
    var post = _.extend(postAttributes, {
      userId: user._id,
      author: user.username,
      submitted: new Date(),
      commentsCount: 0,
      upvoters: [],
      votes: 0
    });
      
    var postWithSameLink = Posts.findOne({url: postAttributes.url});
    if (postWithSameLink) {
      return {
        postExists: true,
        _id: postWithSameLink._id
      }
    }
    // _.extend() 方法来自于 Underscore 库，作用是将一个对象的属性传递给另一个对象。  
    var postId = Posts.insert(post);
    return {
      _id: postId
    };
  },
  upvote: function(postId) {
    check(this.userId, String);
    check(postId, String);
    
    // var post = Posts.findOne(postId);
//     if (!post)
//       throw new Meteor.Error('invalid', 'Post not found');
//     if (_.include(post.upvoters, this.userId))
//       throw new Meteor.Error('invalid', 'Already upvoted this post');
//     Posts.update(post._id, {
//       $addToSet: {upvoters: this.userId},
//       $inc: {votes: 1}
//     });
// 以上的code将投票分为“find”和“update”两个操作，如果用户在两步中间投票两次是可以被允许的
// mongoDB 让我们将其转化为一个命令
    var affected = Posts.update({
      _id: postId,
      upvoters: {$ne: this.userId}
      // $ne : not equal to 
    }, {
      $addToSet: {upvoters: this.userId},
      $inc: {votes: 1}
    });
    if (! affected)
      throw new Meteor.Error('invalid', "You weren't able to upvote that post");
  }
});

validatePost = function (post) {
  var errors = {};
  if (!post.title)
    errors.title = "请填写标题";
  if (!post.url)
    errors.url =  "请填写 URL";
  return errors;
}