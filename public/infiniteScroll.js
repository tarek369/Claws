/**
 * Implement infinite scrolling
 * - Inspired by: http://ravikiranj.net/drupal/201106/code/javascript/how-implement-infinite-scrolling-using-native-javascript-and-yui3
 */

/**
 * claws-dev: I made some changes to the original implementation.
 * - Added async/await behavior
 * - Added better event adding/removing
 * - Added ability to choose which element to reference when scrolling
 */

var isIE = /msie/gi.test(navigator.userAgent); // http://pipwerks.com/2011/05/18/sniffing-internet-explorer-via-javascript/

var scroller = {
  options: {},
  updateInitiated: false
}

async function handleScrollEvent(event) {
  await handleScroll(scroller, event)
}

function infiniteScroll(options) {
  var defaults = {
    callback: function() {},
    distance: 50
  }
  // Populate defaults
  for (var key in defaults) {
    if(typeof options[key] == 'undefined') options[key] = defaults[key];
  }

  scroller.options = options;

  var scrollElement = options.element || window;
  var touchMoveElement = options.element || window;

  if (options.action === 'remove') {
    console.log('remove')
    scrollElement.removeEventListener("scroll", handleScrollEvent)
    // For touch devices, try to detect scrolling by touching
    touchMoveElement.removeEventListener("touchmove", handleScrollEvent)
  } else {
    console.log('attach')
    scrollElement.addEventListener("scroll", handleScrollEvent)
    // For touch devices, try to detect scrolling by touching
    touchMoveElement.addEventListener("touchmove", handleScrollEvent)
  }
}

function getScrollPos(element) {
  // Handle scroll position in case of IE differently
  // if (isIE) {
  //   return (element || document.documentElement).scrollTop;
  // } else {
    return element ? element.scrollTop : window.pageYOffset;
  // }
}

var prevScrollPos = getScrollPos();

// Respond to scroll events
async function handleScroll(scroller, event) {
  if (scroller.updateInitiated) {
    console.log('updateInitiated')
    return;
  }
  var scrollPos = getScrollPos(scroller.options.element);
  if (scrollPos == prevScrollPos) {
    console.log('Same spot...?')
    return; // nothing to do
  }

  // Find the pageHeight and clientHeight(the no. of pixels to scroll to make the scrollbar reach max pos)
  var pageHeight = scroller.options.element ? scroller.options.element.scrollHeight : document.documentElement.scrollHeight;
  var clientHeight = scroller.options.element ? scroller.options.element.clientHeight : document.documentElement.clientHeight;

  // Check if scroll bar position is just 50px above the max, if yes, initiate an update
  if (pageHeight - (scrollPos + clientHeight) < scroller.options.distance) {
    scroller.updateInitiated = true;

    await scroller.options.callback(function() {
      scroller.updateInitiated = false;
    });
  }

  prevScrollPos = scrollPos;
}

export default infiniteScroll;