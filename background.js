// On Install
chrome.runtime.onInstalled.addListener(function(object) {
  // Open the options page when first installed
  chrome.runtime.openOptionsPage();
  // create text analyser context menu
  chrome.contextMenus.create({
    'id': 'analyse',
    'title': 'Analyse selected text',
    'contexts': ['selection'],
  });
});

// Context Menus
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === 'analyse') {
    if (info.selectionText) {
      const data = {
        TEXT: info.selectionText,
        URL: info.pageUrl.split('/')[2],
      };
      chrome.tabs.create({url: '/content/pages/analysis/analysis.html'}, function(tab) {
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, {analysis: data}, function() {
            // console.log('Web Wellbeing: analysis complete!');
          });
        }, 100);
      });
    } else {
      alert('Web Wellbeing: Please select some text to analyse first!');
    }
  }
});

// Message listener
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      const data = request.data;
      if (data.block) {
        chrome.tabs.update(sender.tab.id, {url: 'content/pages/blocked.html'});
      } else {
        chrome.storage.sync.get({badge: 'p-page'}, function(items) {
          const setBadge = (text, colour) => {
            chrome.browserAction.setBadgeText({
              text: text,
              tabId: sender.tab.id,
            });
            chrome.browserAction.setBadgeBackgroundColor({
              color: colour,
              tabId: sender.tab.id,
            });
          };
          const badge = items.badge;
          if (badge === 'filtered') {
            setBadge(request.data.filtered.toString(), 'darkred');
          } else if (badge === 'p-page') {
            const text = request.data.PERMA.SCORE.POS.toFixed();
            let colour = 'green';
            if (parseInt(text) < 0) colour = 'red';
            setBadge(text, colour);
          } else if (badge === 'n-page') {
            const text = request.data.PERMA.SCORE.NEG.toFixed();
            let colour = 'red';
            if (parseInt(text) < 0) colour = 'green';
            setBadge(text, colour);
          } else if (badge === 'p-domain' || badge === 'n-domain') {
            chrome.storage.sync.clear();
          }
        });
      }
    }
);
