(function() {
  /**
 * Remove all websites from storage
 * @function rmAll
 * @param  {string} url storage key
 */
  const rmAll = () => {
    chrome.storage.sync.set({domains: {}}, function() {
      location.reload();
    });
  };

  /**
     * Remove a website from storage
     * @function rmSite
     * @param  {string} url storage key
     */
  const rmSite = (url) => {
    chrome.storage.sync.get({domains: {}}, function(items) {
      const data = items.domains;
      delete data[url];
      chrome.storage.sync.set({domains: data}, function() {
        location.reload();
      });
    });
  };

  const sumArr = (arr) => arr.reduce((a, b) => a + b, 0);

  document.addEventListener('DOMContentLoaded', function(event) {
    // Get info from storage
    chrome.storage.sync.get({domains: {}}, function(items) {
      const total = {
        domains: 0,
        views: 0,
        POS: {
          P: 0,
          E: 0,
          R: 0,
          M: 0,
          A: 0,
        },
        NEG: {
          P: 0,
          E: 0,
          R: 0,
          M: 0,
          A: 0,
        },
        P: 0,
        N: 0,
      };
      const data = items.domains;
      const table = document.getElementById('tbody');
      for (let i in data) {
        if (!data.hasOwnProperty(i) || !i) continue;
        const x = data[i];
        // no x.PERMA.POS indicates v < 1.2, clear storage and refresh
        if (x.PERMA) {
          if (!x.PERMA.POS) {
            chrome.storage.sync.clear();
            location.reload();
          }
        }
        const pos = sumArr(Object.values(x.PERMA.POS));
        const neg = sumArr(Object.values(x.PERMA.NEG));
        // update totals
        total.domains += 1;
        total.views += x.V;
        total.P += pos;
        total.N += neg;
        // create domain rows
        const y = {
          0: i,
          1: x.V,
          2: pos.toFixed(3),
          3: neg.toFixed(3),
          4: (pos / x.V).toFixed(3),
          5: (neg / x.V).toFixed(3),
        };
        const tr = document.createElement('tr');
        for (let q in y) {
          if (!y.hasOwnProperty(q)) continue;
          let td = document.createElement('td');
          td.textContent = y[q];
          tr.appendChild(td);
        }
        // delete button
        const td = document.createElement('td');
        td.innerHTML = `<a href="#!" name='${i}' class='delete'><img src='../../../libs/img/delete_forever.svg'></a>`;
        tr.appendChild(td);
        // append row to table
        table.appendChild(tr);
      }
      // calculate positive / negative totals
      total.ap = total.P / total.views;
      total.an = total.N / total.views;
      // create total / overview table
      const tr = document.createElement('tr');
      for (let t in total) {
        if (!total.hasOwnProperty(t) || t === 'POS' || t === 'NEG') continue;
        let td = document.createElement('td');
        if (t === 'views' || t === 'domains') {
          td.textContent = total[t];
        } else {
          td.textContent = total[t].toFixed(3);
        }
        tr.appendChild(td);
      }
      document.getElementById('obody').appendChild(tr);
      // reveal data pane
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('data').classList.remove('hidden');
      // add delete buttons
      const dels = document.getElementsByClassName('delete');
      const len = dels.length;
      for (let i = 0; i < len; i++) {
        dels[i].addEventListener('click', function() {
          rmSite(dels[i].getAttribute('name'));
        });
      }
      // listen for delete all button
      document.getElementById('delete-all').addEventListener('click', rmAll);
      // make table interactive
      $('#table').DataTable();
    });
  });
})();
