Comments = new Mongo.Collection('comments');

Meteor.methods({
  commentInsert: function(commentAttributes) {
    check(this.userId, String);
    check(commentAttributes, {
      postId: String,
      body: String
    });
    var user = Meteor.user();
    var post = Posts.findOne(commentAttributes.postId);
    if (!post)
      throw new Meteor.Error('invalid-comment', 'You must comment on a post');
    comment = _.extend(commentAttributes, {
      userId: user._id,
      author: user.username,
      submitted: new Date()
    });
    
    // 更新帖子的评论数
    // Mongo 的 $inc 操作（给一个数字字段值加一）
    Posts.update(comment.postId, {$inc: {commentsCount: 1}});
    
    //return Comments.insert(comment);
    
    // create the comment, save the id, instead of just return insert()
    comment._id = Comments.insert(comment);
    // now create a notification, informing the user that there's been a comment
    createCommentNotification(comment);
    return comment._id;
  }
});
