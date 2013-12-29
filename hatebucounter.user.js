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
        overflow-y: scroll;\
      }\
      #commentlist li {\
        margin-bottom: 1.1ex;\
        line-height:   110%;\
        word-wrap:     break-word;\
      }\
      #messageline {\
        margin:  0  0.8em  0  0.8em;\
        display: none;\
      }\
      #counterline {\
        padding: 2px 5px 3px 3px;\
        margin: 0;\
        border: 0;\
        text-align: right;\
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
  <body>\
    <div id="wrapper">\
      <ul id="commentlist"></ul>\
      <div id="messageline">\
        <span id="message"></span>\
      </div>\
      <div id="counterline">\
        <img id="close" class="icon action" alt="閉じる" title="閉じる">\
        <img id="lock" class="icon action" alt="ロックする" title="ロックする">\
        <img id="reload" class="icon action" alt="リロード" title="リロード">\
        <a id="hatebuentrylink"><img id="hatebufavicon" class="icon" alt="はてなブックマークエントリーページへ" title="はてなブックマークエントリーページへ"></a>\
        <span id="count"></span>\
        <img id="countloaderror" class="icon">\
      </div>\
    </div>\
  </body>\
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

var iframeStyle = iframeStyle;

// ====== DOM CREATION =========================================================
var tab = $('<div/>');
tab.css(tabStyle);
$(document.body).append(tab);

var iframe = $('<iframe/>');
iframe.css(iframeStyle);
//tab.append(iframe);
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
	var ibody = iframe.body;
	var closeIcon = $('#close',ibody);
	var lockIcon = $('#lock', ibody);
	var reloadIcon = $('#reload', ibody);
	var hatebuIcon = $('#hatebufavicon', ibody);
	var entryLink = $('#hatebuentrylink', ibody);
	var countText = $('#count', ibody);
	var errorIcon = $('#countloaderror', ibody);
	iframe.closeIcon = closeIcon;
	iframe.lockIcon = lockIcon;
	iframe.reloadIcon = reloadIcon;
	iframe.hatebuIcon = hatebuIcon;
	iframe.entryLint = entryLink;
	iframe.countText = countText;
	iframe.errorIcon = errorIcon;
	iframe.wrapper = $('#wrapper', ibody);
	iframe.commentList = $('#commentlist', ibody);

	closeIcon.attr('src', CLOSE_ICON_URL);
	closeIcon.click(function() {
		iframe.remove();
	});

	lockIcon.attr('src', UNLOCKED_ICON_URL);
	lockIcon.isLocked = false;
	lockIcon.click(function() {
		if (lockIcon.isLocked) {
			lockIcon.attr('src', UNLOCKED_ICON_URL);
			lockIcon.isLocked = false;
		} else {
			lockIcon.attr('src', LOCKED_ICON_URL);
			lockIcon.isLocked = true;
		}
	});

	reloadIcon.attr('src', RELOAD_ICON_URL);
	reloadIcon.click(function() {
		//TODO reload
	});

	hatebuIcon.attr('src', LOADING_ICON_URL);
	hatebuIcon.css('display','inline');
	hatebuIcon.load(function() {
		setIFrameSize(ibody);
	});

	entryLink.attr('href', 'http://b.hatena.ne.jp/entry/'+document.URL.replace('http://',''));
	entryLink.attr('target', '_blank');

	errorIcon.attr('src', ERROR_ICON_URL);
	errorIcon.css('display','none');

	countText.text('-');
	setIFrameSize(ibody);

	// retrieves a bookmark count.
	GM_xmlhttpRequest({
		method:'GET',
		url:'http://api.b.st-hatena.com/entry.count?url='+encodeURIComponent(document.URL),
		onload: function(response) {
			hatebuIcon.attr('src', HATENA_FAVICON_URL);
			if (response.responseText) {
				countText.text(response.responseText);
			} else {
				countText.text('0');
			}
			setIFrameSize(ibody);
		}
	});

	iframe.wrapper.mouseenter(function() {
		closeIcon.css('display','inline');
		lockIcon.css('display','inline');
		reloadIcon.css('display','inline');
		iframe.commentList.css('display','block');
		setIFrameSize(ibody);
		if (!commentLoaded && usesLazyLoad) {
			hatebuIcon.attr('src', GM_getResourceURL('loadingIcon'));
			retrieveComments();
			commentLoaded=true;
			iframe.commentList.css('max-height',(Math.round($(window).height()*0.7)+'px'));
		}
	});

	iframe.wrapper.mouseleave(function() {
		closeIcon.css('display','none');
		lockIcon.css('display','none');
		reloadIcon.css('display','none');
		iframe.commentList.css('display','none');
		setIFrameSize(ibody);
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

// retrieves a bookmark count.
GM_xmlhttpRequest({
	method:'GET',
	url:'http://api.b.st-hatena.com/entry.count?url='+encodeURIComponent(document.URL),
	onload: function(response) {
		hatenaIcon.attr('src', HATENA_FAVICON_URL);
		if (response.responseText) {
			count.text(response.responseText);
		} else {
			count.text('0');
		}
	}
});


function retrieveComments() {
	GM_xmlhttpRequest({
		method:'GET',
		url:'http://b.hatena.ne.jp/entry/jsonlite/?url='+encodeURIComponent(document.URL),
		onload: function(response) {
			iframe.hatebuIcon.attr('src', HATENA_FAVICON_URL);
			if (response.responseText && response.responseText != 'null') {
				try {
				var comments = JSON.parse(response.responseText);
				for (var i in comments.bookmarks) {
					var user = comments.bookmarks[i].user;
					var comment = comments.bookmarks[i].comment;
					if (comment) {
						var item = $('<li/>');
						item.text(user+':'+comment);
						iframe.commentList.append(item);
					}
					
				}
				} catch(e) {alert(e);}
			}
			setIFrameSize(ibody);
		}
	});
}

var commentLoaded = false;
if (!usesLazyLoad) {
	retrieveComments();
} else {
	iframe.mouseenter(function(event) {
		if (!commentLoaded) {
			var hatenaIcon = $('#hatebufavicon',idoc);
			hatenaIcon.attr('src', GM_getResourceURL('loadingIcon'));
			retrieveComments();
			commentLoaded=true;
		}
	});
}
