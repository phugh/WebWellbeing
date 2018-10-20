window.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {from: 'popup', subject: 'data'},
        function(data) {
          if (data && data.PERMA) {
            // create charts
            createRadarChart(data, document.getElementById('p-radar').getContext('2d'));
            createPieChart(data, document.getElementById('pie').getContext('2d'));
            // number of elements meeting the block / redaction threshold
            document.getElementById('blocked').textContent = data.filtered;
            // total number of elements scanned
            const e = document.getElementsByClassName('elems');
            const eLen = e.length;
            for (let i = 0; i < eLen; i++) {
              e[i].textContent = data.elems.TOTAL;
            }
            // majority positive and negative element percentages
            document.getElementById('neg-cent').textContent = ((data.elems.NEG / data.elems.TOTAL) * 100).toFixed(2);
            document.getElementById('pos-cent').textContent = ((data.elems.POS / data.elems.TOTAL) * 100).toFixed(2);
            // total number of majority positive and negative elements
            document.getElementById('pos-num').textContent = data.elems.POS;
            document.getElementById('neg-num').textContent = data.elems.NEG;
            // number of wellbeing components positively associated in whole page
            document.getElementById('pos').textContent = data.comp.POS;
            document.getElementById('neg').textContent = data.comp.NEG;
            document.getElementById('pos-total').textContent = data.PERMA.SCORE.POS.toFixed();
            document.getElementById('neg-total').textContent = data.PERMA.SCORE.NEG.toFixed();
            // domain stats
            chrome.storage.sync.get(['domains'], function(result) {
              if (result.domains[data.domain]) {
                // set domain name text labels
                const d = document.getElementsByClassName('domain');
                const dLen = d.length;
                for (let i = 0; i < dLen; i++) {
                  d[i].textContent = data.domain;
                }
                // calculate and display scores
                const x = result.domains[data.domain];
                const pos = sumArr(Object.values(x.PERMA.POS));
                const neg = sumArr(Object.values(x.PERMA.NEG));
                document.getElementById('domain-visits').textContent = x.V;
                document.getElementById('domain-pos-total').textContent = (pos / x.V).toFixed();
                document.getElementById('domain-neg-total').textContent = (neg / x.V).toFixed();
                // create graph
                createDomainChart(x, document.getElementById('d-radar').getContext('2d'));
                // show card
                document.getElementById('domain-card').classList.remove('hidden');
              } else {
                // @todo add error handling here
              }
            });
            // Hide error pane and display data pane
            document.getElementById('error').classList.add('hidden');
            document.getElementById('data').classList.remove('hidden');
          } else {
            // hide data pane and reveal error pane
            // @todo add an error message if neccessary
            document.getElementById('data').classList.add('hidden');
            document.getElementById('error').classList.remove('hidden');
          }
        });
  });

  // options button
  document.getElementById('opts').addEventListener('click', function() {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('../options/options.html'));
    }
  });

  // full stats button
  document.getElementById('stats').addEventListener('click', function() {
    window.open(chrome.runtime.getURL('../content/pages/fullstats/stats.html'));
  });

  // refresh page link
  document.getElementById('refresh').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
      window.close();
    });
  });
});
