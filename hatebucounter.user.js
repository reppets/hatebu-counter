// ==UserScript==
// @name hatena
// @namespace hatena
// @include *
// @require http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// ==/UserScript==

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



// ====== STYLE DEFINITIONS ====================================================
// tab style
var tabStyle = {
	'position':'fixed'
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
	,'background':'rgba(0,0,0,0) none'
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

var innerTabStyle = {
	'position':'absolute'
	,'z-index':'2147483647'
	,'display':'block'
	,'right':'0px'
	,'bottom':'0px'
	,'width':'auto'
	,'height':'auto'
	,'max-width':'none'
	,'min-width':'none'
	,'max-height':'none'
	,'min-height':'none'
	,'background':'rgba(0,0,0,0.9) none'
	,'color':'rgba(255,255,255,0.8)'
	,'overflow-y':'hidden'
	,'overflow-x':'visible'
	,'padding': '6px 3px 3px 6px'
	,'border': '0'
	,'text-align':'left'
	,'vertical-align':'bottom'
	,'font':'normal normal normal small normal sans-serif'
	,'list-style':'disc none inside'
};

// count tab style
var countTabStyle = {
	'display':'block'
	,'width':'auto'
	,'height':'auto'
	,'min-width':'none'
	,'min-height':'none'
	,'margin-top':'auto'
	,'margin-bottom':'0'
	,'margin-left':'auto'
	,'margin-right':'0'
	,'border':'0'
	,'padding':'0'
	,'text-align':'right'
	,'white-space':'nowrap'
	,'background':'rgba(0,0,0,0)'
};

// img (for favicons)
var imgStyle = {
	'width':'16px'
	,'height':'16px'
	,'margin-left':'auto'
	,'margin-right':'3px'
	,'border':'0'
	,'vertical-align':'middle'
	,'float':'none'
};

// count text
var countStyle = {
	'display':'inline'
	,'width':'auto'
	,'height':'auto'
	,'min-width':'none'
	,'min-height':'none'
	,'background':'rgba(0,0,0,0)'
	,'color':'white'
	,'font':'normal normal normal small normal sans-serif'
	,'line-height':'1.4em'
};

// list
var listStyle = {
	'margin':'0'
	,'border':'0'
	,'padding':'0'
	,'height':'auto'
	,'width':'auto'
	,'max-height':'500px'
	,'display':'none'
	,'list-style':'square none inside'
	,'overflow-y':'auto'
	,'overflow-x':'visible'
};
var listExpandStyle = {
	'display':'block'
};
var listShrinkStyle = {
	'display':'none'
};

// list item
var itemStyle = {
	'margin':'5px 0 5px 0'
	,'color':'white'
	,'font':'normal normal normal small normal sans-serif'
	,'list-style':'square none inside'
};



// ====== DOM CREATION =========================================================
var tab = $('<div/>');
tab.css(tabStyle);
$(document.body).append(tab);

var innerTab = $('<div/>');
innerTab.css(innerTabStyle);
tab.append(innerTab);

var list = $('<ul/>');
list.css(listStyle);
innerTab.append(list);

var countTab = $('<div/>');
countTab.css(countTabStyle);
innerTab.append(countTab);

var hatenaAnchor = $('<a/>');
hatenaAnchor.attr('href', 'http://b.hatena.ne.jp/entry/'+document.URL.replace('http://',''));
countTab.append(hatenaAnchor);

var hatenaIcon = $('<img/>');
hatenaIcon.attr('src', HATENA_FAVICON_URL);
hatenaIcon.css(imgStyle);
hatenaAnchor.append(hatenaIcon);

var count = $('<div/>');
count.css(countStyle);
countTab.append(count);



tab.mouseenter(function(event) {
	tab.css(tabExpandStyle);
	list.css(listExpandStyle);
});

tab.mouseleave(function(event) {
	tab.css(tabShrinkStyle);
	list.css(listShrinkStyle);
});


// retrieves a bookmark count.
GM_xmlhttpRequest({
	method:'GET',
	url:'http://api.b.st-hatena.com/entry.count?url='+encodeURIComponent(document.URL),
	onload: function(response) {
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
			GM_log('comments'+response.responseText);
			if (response.responseText) {
				var comments = JSON.parse(response.responseText);
				for (var i in comments.bookmarks) {
					var user = comments.bookmarks[i].user;
					var comment = comments.bookmarks[i].comment;
					if (comment) {
						var item = $('<li/>')
						item.css(itemStyle);
						item.text(user+':'+comment);
						list.append(item);
					}
					
				}
			}
		}
	});
}

var commentLoaded = false;
if (!usesLazyLoad) {
	retrieveComments();
} else {
	tab.mouseenter(function(event) {
		if (!commentLoaded) {
			retrieveComments();
			commentLoaded=true;
		}
	});
}
	
