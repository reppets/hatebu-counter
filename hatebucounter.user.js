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

var iframeStyle = {
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
iframe.ready(function() {
	var idoc = iframe.contents()[0];
	idoc.open();
	idoc.write(iframeContents);
	idoc.close();
	iframe.document = idoc;
	iframe.body = $('body',idoc);
	constructIFrame(iframe);
	retrieveCount(iframe);
	if (!usesLazyLoad) {
		retrieveComments(iframe);
	}
});

function showInline() {
	if (this.isDisplayable) {
		this.css('display', 'inline');
	}
}

function showBlock() {
	if (this.isDisplayable) {
		this.css('display', 'block');
	}
}

function hide() {
	this.css('display', 'none');
}

function constructIcon(element, src, isDisplayable) {
	element.attr('src', src);
	element.appear = showInline;
	element.disappear = hide;
	element.isDisplayable = isDisplayable;
	return element;
}

function expand(iframe) {
	iframe.isExpanded = true;
	
	iframe.closeIcon.appear();
	iframe.lockIcon.appear();
	iframe.reloadIcon.appear();
	iframe.commentList.appear();
	iframe.messageLine.appear();
	
	setIFrameSize(iframe);
}

function shrink(iframe) {
	if (iframe.isLocked) {
		return;
	}

	iframe.isExpanded = false;

	iframe.closeIcon.disappear();
	iframe.lockIcon.disappear();
	iframe.reloadIcon.disappear();
	iframe.commentList.disappear();
	iframe.messageLine.disappear();

	setIFrameSize(iframe);
}

function setIFrameSize(iframe) {
	iframe.body.ready(function() {
		var newHeight = $('#wrapper',iframe.body).outerHeight();
		var newWidth = $('#wrapper',iframe.body).outerWidth();
		iframe.css('height',newHeight+'px');
		iframe.css('width',newWidth+'px');
	});
}

function constructIFrame(iframe) {
	// set iframe attributes
	iframe.isLocked = false;

	// set icons
	iframe.closeIcon = constructIcon($('#close', iframe.body), CLOSE_ICON_URL, true);
	iframe.closeIcon.click(function() {
		iframe.remove();
	});

	iframe.lockIcon = constructIcon($('#lock', iframe.body), UNLOCKED_ICON_URL, true);
	iframe.lockIcon.click(function() {
		if (iframe.isLocked) {
			iframe.lockIcon.attr('src', UNLOCKED_ICON_URL);
			iframe.isLocked = false;
		} else {
			iframe.lockIcon.attr('src', LOCKED_ICON_URL);
			iframe.isLocked = true;
		}
	});

	iframe.reloadIcon = constructIcon($('#reload', iframe.body), RELOAD_ICON_URL, true);
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

	iframe.hatebuIcon = constructIcon($('#hatebufavicon', iframe.body), LOADING_ICON_URL, true);
	iframe.hatebuIcon.appear();

	iframe.errorIcon = constructIcon($('#countloaderror', iframe.body), ERROR_ICON_URL, false);


	// set other elements
	iframe.entryLink = $('#hatebuentrylink', iframe.body);
	iframe.entryLink.attr('href', 'http://b.hatena.ne.jp/entry/'+document.URL.replace('http://',''));

	iframe.commentList = $('#commentlist', iframe.body);
	iframe.commentList.appear = showBlock;
	iframe.commentList.disappear = hide;
	iframe.commentList.css('max-height',(Math.round($(window).height()*0.7)+'px'));
	iframe.commentList.isDisplayable = false;

	iframe.messageText = $('#message', iframe.body);
	iframe.messageLine = $('#messageline', iframe.body);
	iframe.messageLine.appear = showBlock;
	iframe.messageLine.disappear = hide;
	iframe.messageLine.isDisplayable = false;

	iframe.countText = $('#count', iframe.body);
	iframe.countText.text('-');

	iframe.wrapper = $('#wrapper', iframe.body);
	
	shrink(iframe);

	
	// event handlers
	if (usesLazyLoad) {
		var commentLoadHandler = function() {
			iframe.hatebuIcon.attr('src', GM_getResourceURL('loadingIcon'));
			retrieveComments(iframe);
			iframe.wrapper.unbind('mouseenter', commentLoadHandler);
		};
		iframe.wrapper.mouseenter(commentLoadHandler);
	}

	iframe.wrapper.mouseenter(function() {
		expand(iframe);
	});

	iframe.wrapper.mouseleave(function() {
		shrink(iframe);
	});

	$(window).resize(function() {
		iframe.commentList.css('max-height',(Math.round($(window).height()*0.7)+'px'));
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
			refresh(iframe);
		}
	});
}

function retrieveComments(iframe) {
	GM_xmlhttpRequest({
		method:'GET',
		url:'http://b.hatena.ne.jp/entry/jsonlite/?url='+encodeURIComponent(document.URL),
		onload: function(response) {
			if (response.responseText && response.responseText != 'null') {
				var comments = JSON.parse(response.responseText);
				for (var i in comments.bookmarks) {
					var user = comments.bookmarks[i].user;
					var comment = comments.bookmarks[i].comment;
					if (comment) {
						var item = $('<li/>');
						item.text(user+' : '+comment);
						iframe.commentList.append(item);
						iframe.commentList.isDisplayable = true;
						var hasComment = true;
					}
				}
				if (!hasComment) {
					iframe.messageText.text(MESSAGE_NO_COMMENT);
					iframe.messageLine.isDisplayable = true;
				}
			} else {
				iframe.messageText.text(MESSAGE_NO_COMMENT);
				iframe.messageLine.isDisplayable = true;
			}
			iframe.hatebuIcon.attr('src', HATENA_FAVICON_URL);

			refresh(iframe);
		}
	});
}


function refresh(iframe) {
	if (iframe.isExpanded) {
		expand(iframe);
	} else {
		shrink(iframe);
	}
}
