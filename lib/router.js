Router.configure({
  layoutTemplate: 'layout',
  loadingTemplate: 'loading',
  notFoundTemplate: 'notFound',
  //waitOn: function() { return [Meteor.subscribe('posts'), Meteor.subscribe('comments')];}
  // 没必要把comments 放在路由器级加载，因为很多comments都用不到
  waitOn: function() { 
    //return [Meteor.subscribe('posts'), Meteor.subscribe('notifications')]; 
    return [Meteor.subscribe('notifications')]; 
  }
});

PostsListController = RouteController.extend({
  template: 'postsList',
  increment: 5,
  postsLimit: function() {
    return parseInt(this.params.postsLimit) || this.increment;
  },
  findOptions: function() {
    return {sort: this.sort, limit: this.postsLimit()};
    // sort改为NewPostsController和BestPostsController的具体sort了
  },
  subscriptions: function() {
    this.postsSub = Meteor.subscribe('posts', this.findOptions());
  },
  // waitOn: function() {
//     return Meteor.subscribe('posts', this.findOptions());
//   },
//   data: function() {
//     return {posts: Posts.find({}, this.findOptions())};
//   }
  posts: function() {
    return Posts.find({}, this.findOptions());
  },
  data: function() {
    var hasMore = this.posts().count() === this.postsLimit();
    //var nextPath = this.route.path({postsLimit: this.postsLimit() + this.increment});
    return {
      posts: this.posts(),
      ready: this.postsSub.ready,
      nextPath: hasMore ? this.nextPath() : null
      // 改为NewPostsController和BestPostsController的具体nextPath了
    };
  }
});

NewPostsController = PostsListController.extend({
  sort: {submitted: -1, _id: -1},
  nextPath: function() {
    return Router.routes.newPosts.path({postsLimit: this.postsLimit() + this.increment})
  }
});
BestPostsController = PostsListController.extend({
  sort: {votes: -1, submitted: -1, _id: -1},
  nextPath: function() {
    return Router.routes.bestPosts.path({postsLimit: this.postsLimit() + this.increment})
  }
});
Router.route('/', {
  name: 'home',
  controller: NewPostsController
});
Router.route('/new/:postsLimit?', {name: 'newPosts'});
Router.route('/best/:postsLimit?', {name: 'bestPosts'});

// Router.route('/:postsLimit?', {
//   name: 'postsList'
  // waitOn: function() {
//     var limit = parseInt(this.params.postsLimit) || 5;
//     return Meteor.subscribe('posts', {sort: {submitted: -1}, limit: limit});
//   },
//   data: function() {
//     var limit = parseInt(this.params.postsLimit) || 5;
//     return {
//       posts: Posts.find({}, {sort: {submitted: -1}, limit: limit})
//     };
//   }
//});

Router.route('/posts/:_id', {
  name: 'postPage',
  waitOn: function() { 
    //return Meteor.subscribe('comments', this.params._id); 
    return [
      Meteor.subscribe('singlePost', this.params._id),
      Meteor.subscribe('comments', this.params._id)
    ];
  },
  data: function() {return Posts.findOne(this.params._id);}
});

Router.route('/posts/:_id/edit', {
  name: 'postEdit',
  waitOn: function() {
    return Meteor.subscribe('singlePost', this.params._id);
  },
  data: function() { return Posts.findOne(this.params._id); }
});

Router.route('/submit', {name: 'postSubmit'});

var requireLogin = function() {
  if (! Meteor.user()) {
    if (Meteor.loggingIn()) {
      this.render(this.loadingTemplate);
    } else {
      //accessDenied is the name of a customer route, so we need to create template for it
      this.render('accessDenied');
    }
  } else {
    this.next();
  }
}

// 'dataNotFount' and 'loading' are the only two built-in hooks
Router.onBeforeAction('dataNotFound', {only: 'postPage'});

Router.onBeforeAction(requireLogin, {only: 'postSubmit'});