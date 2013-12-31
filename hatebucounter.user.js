// ==UserScript==
// @name hatena
// @namespace hatena
// @include *
// @require http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @resource loadingIcon http://cdn-ak.f.st-hatena.com/images/fotolife/r/reppets/20131208/20131208222202.gif
// @resource lockedIcon http://cdn-ak.f.st-hatena.com/images/fotolife/r/reppets/20131223/20131223190146.png
// @resource unlockedIcon http://cdn-ak.f.st-hatena.com/images/fotolife/r/reppets/20131223/20131223181716.png
// @resource closeIcon http://cdn-ak.f.st-hatena.com/images/fotolife/r/reppets/20131223/20131223190145.png
// @resource errorIcon http://cdn-ak.f.st-hatena.com/images/fotolife/r/reppets/20131223/20131223190147.png
// @resource reloadIcon http://cdn-ak.f.st-hatena.com/images/fotolife/r/reppets/20131223/20131223221947.png
// ==/UserScript==

// INFO:
//    the loading icon generated with http://www.ajaxload.info/
//    the other icons are from http://modernuiicons.com/

// ignore iframe/frame
if (window.top != window.self) {
  return;
}

// ====== OPTIONS ==============================================================

// use lazy loading or not.
// When it set to false, retrieve comments every page load. It fails sometimes when reloaded(?)
var usesLazyLoad = true;



// ====== CONSTANTS ============================================================
const HATENA_FAVICON_URL = 'http://b.hatena.ne.jp/favicon.ico';
const LOADING_ICON_URL = GM_getResourceURL('loadingIcon');
const LOCKED_ICON_URL = GM_getResourceURL('lockedIcon');
const UNLOCKED_ICON_URL = GM_getResourceURL('unlockedIcon');
const CLOSE_ICON_URL = GM_getResourceURL('closeIcon');
const ERROR_ICON_URL = GM_getResourceURL('errorIcon');
const RELOAD_ICON_URL = GM_getResourceURL('reloadIcon');

const MESSAGE_NO_COMMENT = 'コメントはありません';

// ====== IFRAME CONTENTS ======================================================
var iframeContents = '\
<!DOCTYPE html>\
<html>\
  <head>\
    <meta charset="UTF-8" />\
    <title></title>\
    <style type="text/css">\
      * {\
        padding: 0;\
        border:  0;\
        margin:  0;\
        font-size: small;\
      }\
      body {\
        background-color: rgba(0,0,0,0.8);\
        color: white;\
        display: block;\
      }\
      img {\
        display: none;\
      }\
      img.icon {\
        height: 1em;\
        width:  1em;\
        margin: 3px;\
        vertical-align: middle;\
      }\
      img.action {\
        cursor: pointer;\
      }\
      #commentlist {\
        margin: 0;\
        padding: 1em 1em 1em 1em;\
        list-style: square inside;\
        display: none;\
        width: 500px;\
        height: auto;\
        white-space: normal;\
        overflow-y: auto;\
      }\
      #commentlist li {\
        margin-bottom: 1.1ex;\
        line-height:   110%;\
        word-wrap:     break-word;\
      }\
      #messageline {\
        margin:  0  0.8em  0  0.8em;\
        padding: 0.5em;\
        height: auto;\
        width: auto;\
        overflow: auto;\
        display: none;\
      }\
      #counterline {\
        padding: 2px 5px 3px 3px;\
        margin: 0;\
        border: 0;\
        text-align: right;\
        width: auto;\
        height: auto;\
        display: block;\
      }\
      #count {\
        vertical-align:middle;\
      }\
      #wrapper {\
        display: block;\
        width: auto;\
        height: auto;\
        position: absolute;\
        right: 0;\
        bottom: 0;\
        white-space: nowrap;\
      }\
    </style>\
  </head>\
  <body><!--\
    --><div id="wrapper"><!--\
      --><ul id="commentlist"></ul><!--\
      --><div id="messageline"><!--\
        --><span id="message"></span><!--\
      --></div><!--\
      --><div id="counterline"><!--\
        --><img id="close" class="icon action" alt="閉じる" title="閉じる"><!--\
        --><img id="lock" class="icon action" alt="ロックする" title="ロックする"><!--\
        --><img id="reload" class="icon action" alt="リロード" title="リロード"><!--\
        --><a id="hatebuentrylink" target="_blank"><img id="hatebufavicon" class="icon" alt="はてなブックマークエントリーページへ" title="はてなブックマークエントリーページへ"></a><!--\
        --><span id="count"></span><!--\
        --><img id="countloaderror" class="icon"><!--\
      --></div><!--\
    --></div><!--\
  --></body>\
</html>\
';



// ====== STYLE DEFINITIONS ====================================================
// tab style
var tabStyle = {
	'position':'fixed'
	,'z-index':'2147483647'
	,'display':'block'
	,'right':'0px'
	,'bottom':'0px'
	,'visibility':'visible'
	,'overflow':'visible'
	,'border': '0'
	,'padding': '0'
	,'margin': '0'
	,'width':'auto'
	,'height':'auto'
	,'background':'rgba(1,0,0,0.8) none'
};
var tabExpandStyle = {
	'width':'500px'
	,'height':'auto'
	,'max-height':'50%'
};
var tabShrinkStyle = {
	'width':'auto'
	,'height':'auto'
};

var iframeStyle = {
//	'position':'absolute'
	'position':'fixed'
	,'z-index':'2147483647'
	,'display':'block'
	,'right':'0px'
	,'bottom':'0px'
	,'width':'auto'
	,'height':'auto'
	,'max-width':'50%'
	,'min-width':'none'
	,'max-height':'none'
	,'min-height':'none'
	,'background':'rgba(0,0,0,0) none'
	,'color':'rgba(255,255,255,0.8)'
	,'overflow':'auto'
	,'padding': '0'
	,'border': '0'
	,'margin': '0'
	,'text-align':'left'
	,'vertical-align':'bottom'
};

// ====== DOM CREATION =========================================================
var iframe = $('<iframe/>');
iframe.css(iframeStyle);
$(document.body).append(iframe);
iframe.commentLoaded = false;
iframe.ready(function() {
	var idoc = iframe.contents()[0];
	idoc.open();
	idoc.write(iframeContents);
	idoc.close();
	iframe.document = idoc;
	iframe.body = $('body',idoc);
	constructIFrame(iframe);
});

function constructIFrame(iframe) {

	iframe.closeIcon = $('#close', iframe.body);
	iframe.lockIcon = $('#lock', iframe.body);
	iframe.reloadIcon = $('#reload', iframe.body);
	iframe.hatebuIcon = $('#hatebufavicon', iframe.body);
	iframe.entryLink = $('#hatebuentrylink', iframe.body);
	iframe.countText = $('#count', iframe.body);
	iframe.errorIcon = $('#countloaderror', iframe.body);
	iframe.wrapper = $('#wrapper', iframe.body);
	iframe.commentList = $('#commentlist', iframe.body);
	iframe.messageText = $('#message', iframe.body);
	iframe.messageLine = $('#messageline', iframe.body);

	function showInline() {
		this.css('display', 'inline');
	}

	function showBlock() {
		this.css('display', 'block');
	}

	function hide() {
		this.css('display', 'none');
	}

	iframe.closeIcon.attr('src', CLOSE_ICON_URL);
	iframe.closeIcon.appear = showInline;
	iframe.closeIcon.disappear = hide;
	iframe.closeIcon.click(function() {
		iframe.remove();
	});

	iframe.isLocked = false;
	iframe.lockIcon.attr('src', UNLOCKED_ICON_URL);
	iframe.lockIcon.appear = showInline;
	iframe.lockIcon.disappear = hide;
	iframe.lockIcon.click(function() {
		if (iframe.isLocked) {
			iframe.lockIcon.attr('src', UNLOCKED_ICON_URL);
			iframe.isLocked = false;
		} else {
			iframe.lockIcon.attr('src', LOCKED_ICON_URL);
			iframe.isLocked = true;
		}
	});

	iframe.reloadIcon.attr('src', RELOAD_ICON_URL);
	iframe.reloadIcon.appear = showInline;
	iframe.reloadIcon.disappear = hide;
	iframe.reloadIcon.click(function() {
		iframe.hatebuIcon.attr('src', LOADING_ICON_URL);
		iframe.countText.text('-');
		iframe.commentList.empty();

		setTimeout(
			function() {
				retrieveCount(iframe);
				retrieveComments(iframe);
			}
			, 350);
	});
							
	iframe.hatebuIcon.attr('src', LOADING_ICON_URL);
	iframe.hatebuIcon.appear = showInline;
	iframe.hatebuIcon.disappear = hide;
	iframe.hatebuIcon.appear();
	iframe.hatebuIcon.load(function() {
		setIFrameSize(iframe.body);
	});

	iframe.entryLink.attr('href', 'http://b.hatena.ne.jp/entry/'+document.URL.replace('http://',''));

	iframe.errorIcon.attr('src', ERROR_ICON_URL);
	iframe.errorIcon.appear = showInline;
	iframe.errorIcon.disappear = hide;
	iframe.errorIcon.disappear();

	iframe.commentList.appear = function() {
		if (this.hasComment) {
			this.css('display','block');
		} else {
			return;
		}
	};
	iframe.commentList.disappear = hide;
	iframe.commentList.disappear();
	
	iframe.countText.text('-');
	setIFrameSize(iframe.body);

	iframe.messageLine.appear = showBlock;
	iframe.messageLine.disappear = hide;
	iframe.messageText.appear = showInline;
	iframe.messageText.disappear = hide;
	
	// retrieves a bookmark count.
	retrieveCount(iframe);

	if (usesLazyLoad) {
		var commentLoadHandler = function() {
			iframe.hatebuIcon.attr('src', GM_getResourceURL('loadingIcon'));
			retrieveComments(iframe);
			iframe.commentList.css('max-height',(Math.round($(window).height()*0.7)+'px'));
			iframe.wrapper.unbind('mouseenter', commentLoadHandler);
		};
		iframe.wrapper.mouseenter(commentLoadHandler);
	}


	iframe.wrapper.mouseenter(function() {
		iframe.closeIcon.appear();
		iframe.lockIcon.appear();
		iframe.reloadIcon.appear();
		if (iframe.commentList.hasComment) {
			iframe.commentList.appear();
		}
		if (iframe.messageLine.hasMessage) {
			iframe.messageLine.appear();
		}
		setIFrameSize(iframe.body);
	});

	iframe.wrapper.mouseleave(function() {
		if (iframe.isLocked) {
			return;
		}
		iframe.closeIcon.disappear();
		iframe.lockIcon.disappear();
		iframe.reloadIcon.disappear();
		iframe.commentList.disappear();
		iframe.messageLine.disappear();
		setIFrameSize(iframe.body);
	});
}

function setIFrameSize(ibody) {
	ibody.ready(function() {
		var newHeight = $('#wrapper',ibody).outerHeight();
		var newWidth = $('#wrapper',ibody).outerWidth();
		iframe.css('height',newHeight+'px');
		iframe.css('width',newWidth+'px');
	});
}

function retrieveCount(iframe) {
	GM_xmlhttpRequest({
		method:'GET',
		url:'http://api.b.st-hatena.com/entry.count?url='+encodeURIComponent(document.URL),
		onload: function(response) {
			iframe.hatebuIcon.attr('src', HATENA_FAVICON_URL);
			if (response.responseText) {
				iframe.countText.text(response.responseText);
			} else {
				iframe.countText.text('0');
			}
			setIFrameSize(iframe.body);
		}
	});
}

function retrieveComments(iframe) {
	GM_xmlhttpRequest({
		method:'GET',
		url:'http://b.hatena.ne.jp/entry/jsonlite/?url='+encodeURIComponent(document.URL),
		onload: function(response) {
			iframe.commentLoaded=true;
			if (response.responseText && response.responseText != 'null') {
				var comments = JSON.parse(response.responseText);
				for (var i in comments.bookmarks) {
					var user = comments.bookmarks[i].user;
					var comment = comments.bookmarks[i].comment;
					if (comment) {
						var item = $('<li/>');
						item.text(user+':'+comment);
						iframe.commentList.append(item);
						iframe.commentList.hasComment = true;
					}
				}
				if (!iframe.commentList.hasComment) {
					iframe.messageText.text(MESSAGE_NO_COMMENT);
					iframe.messageText.appear();
					iframe.messageLine.appear();
					iframe.messageLine.hasMessage = true;
				}
			} else {
				iframe.messageText.text(MESSAGE_NO_COMMENT);
				iframe.messageText.appear();
				iframe.messageLine.appear();
				iframe.messageLine.hasMessage = true;
			}
			iframe.commentList.appear();
			iframe.hatebuIcon.attr('src', HATENA_FAVICON_URL);
			setIFrameSize(iframe.body);
		}
	});
}

var commentLoaded = false;
if (!usesLazyLoad) {
	retrieveComments(iframe);
}
