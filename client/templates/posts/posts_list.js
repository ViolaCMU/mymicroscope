//var postsData = [
//  {
//    title: 'Introducing Telescope',
//    url: 'http://sachagreif.com/introducing-telescope/'
//  }, 
//  {
//    title: 'Meteor',
//    url: 'http://meteor.com'
//  }, 
//  {
//    title: 'The Meteor Book',
//    url: 'http://themeteorbook.com'
//  }
//];

// 改为在route里设置数据context
// Template.postsList.helpers({
//   posts: function() {
//       return Posts.find({}, {sort: {submitted: -1}});
//       // find() first param is criteria, second is projection
//       // -1 means descendent 
//   }
// });

Template.postsList.onRendered(function () {
  this.find('.wrapper')._uihooks = {
	insertElement: function (node, next) {
	  $(node)
		.hide()
		.insertBefore(next)
		.fadeIn();
	},
    moveElement: function (node, next) {
      // moveElement 会在元素位置改变时被调用，从而取代 Blaze 的默认行为
      var $node = $(node), $next = $(next);
      var oldTop = $node.offset().top;
      var height = $node.outerHeight(true); // 包括margin的高度

      // 找出 next 与 node 之间所有的元素
      var $inBetween = $next.nextUntil(node);
      if ($inBetween.length === 0)
        $inBetween = $node.nextUntil(next);

      // 把 node 放在预订位置
      $node.insertBefore(next);

      // 测量新 top 偏移坐标
      var newTop = $node.offset().top;

      // 将 node *移回*至原始所在位置
      $node
        .removeClass('animate')
        .css('top', oldTop - newTop);

      // push every other element down (or up) to put them back
      $inBetween
        .removeClass('animate')
        .css('top', oldTop < newTop ? height : -1 * height);

      // 强制重绘
      $node.offset();
      // 需要强制浏览器去在元素改变位置后重新绘制它,一个简单的强制重绘的方法是让浏览器检查元素的 offset 属性

      // 动画，重置所有元素的 top 坐标为 0
      $node.addClass('animate').css('top', 0);
      $inBetween.addClass('animate').css('top', 0);
    },
    removeElement: function(node) {
      $(node).fadeOut(function() {
        $(this).remove();
      });
    }
  }
});