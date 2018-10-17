(function() {
  'use strict';
  // return the number of elements in an array >0
  const nPos = (arr) => arr.filter((v) => v > 0).length;

  // default options
  let action = 'none';
  let ngrams = true;
  let tags = 'p,a,h1,h2,h3,h4,h5,h6,li,span,em,strong,code,samp,kbd,var,blockquote,label,th,td,output';
  let tolerance = 3;

  /**
   * @function main
   * @return {Object}
   */
  const main = () => {
    // Default data object
    let data = {
      action: action,
      domain: window.location.toString().split('/')[2],
      block: false,
      elems: {
        POS: 0,
        NEG: 0,
        TOTAL: 0,
      },
      filtered: 0,
      fe: [],
      PERMA: {
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
        SCORE: {
          POS: 0,
          NEG: 0,
        },
      },
      comp: {
        POS: 0, // number of positive associations with "POS" wellbeing components
        NEG: 0, // number of positive associations with "NEG" wellbeing components
      },
    };

    /*
      // ensure site is English
      if (!isEnglish(data.domain)) {
        // redirect
      }
    */

    // collect page elements
    const elements = document.querySelectorAll(tags);
    let i = elements.length;
    data.elems.TOTAL = i;

    // PERMA!
    if (i > 0) {
      let filtered = 0;
      let P = [];
      let E = [];
      let R = [];
      let M = [];
      let A = [];
      let Pn = [];
      let En = [];
      let Rn = [];
      let Mn = [];
      let An = [];

      while (i--) {
        // tokenise element text
        const text = cleanText(elements[i].textContent);
        if (!text) continue;
        let tokens = text.match(permaReg);
        if (!tokens) continue;
        if (isBritish(data.domain)) tokens = fromBritish(tokens);
        if (ngrams === true) {
          tokens = tokens.concat(getNgrams(tokens, 2), getNgrams(tokens, 3));
        }
        // match tokens against lexicon
        const matches = getMatches(tokens);
        // cache lexical values
        const pp = matches.POS_P;
        const pe = matches.POS_E;
        const pr = matches.POS_R;
        const pm = matches.POS_M;
        const pa = matches.POS_A;
        const np = matches.NEG_P;
        const ne = matches.NEG_E;
        const nr = matches.NEG_R;
        const nm = matches.NEG_M;
        const na = matches.NEG_A;
        // push to array so we can make page average later
        P.push(pp);
        E.push(pe);
        R.push(pr);
        M.push(pm);
        A.push(pa);
        Pn.push(np);
        En.push(ne);
        Rn.push(nr);
        Mn.push(nm);
        An.push(na);
        data.PERMA.SCORE.POS += (pp + pe + pr + pm + pa);
        data.PERMA.SCORE.NEG += (np + ne + nr + nm + na);
        // calculate if this element is majority positive or negative
        let z = 0;
        if ((pp < np) && (np > 0)) z++;
        if ((pe < ne) && (ne > 0)) z++;
        if ((pr < nr) && (nr > 0)) z++;
        if ((pm < nm) && (nm > 0)) z++;
        if ((pa < na) && (na > 0)) z++;
        if (z >= 3) {
          data.elems.NEG++;
        } else {
          let y = 0;
          if ((np < pp) && (pp > 0)) y++;
          if ((ne < pe) && (pe > 0)) y++;
          if ((nr < pr) && (pr > 0)) y++;
          if ((nm < pm) && (pm > 0)) y++;
          if ((na < pa) && (pa > 0)) y++;
          if (y >= 3) data.elems.POS++;
        }
        if (z >= tolerance) {
          filtered++;
          data.fe.push(elements[i]);
        }
      }

      data.PERMA = {
        POS: {
          P: sumArr(P),
          E: sumArr(E),
          R: sumArr(R),
          M: sumArr(M),
          A: sumArr(A),
        },
        NEG: {
          P: sumArr(Pn),
          E: sumArr(En),
          R: sumArr(Rn),
          M: sumArr(Mn),
          A: sumArr(An),
        },
        SCORE: data.PERMA.SCORE,
      };

      data.comp.POS = nPos(Object.values(data.PERMA.POS));
      data.comp.NEG = nPos(Object.values(data.PERMA.NEG));
      data.filtered = filtered;
      if (action === 'block' && data.comp.NEG >= tolerance) data.block = true;
    }
    return data;
  };

  if (!permaLexicon) {
    throw new Error('PERMA lexicon is missing!');
  } else {
    chrome.storage.sync.get({
      action: action,
      ngrams: ngrams,
      tags: tags,
      tolerance: tolerance,
    }, function(items) {
      action = items.action;
      ngrams = items.ngrams;
      tags = items.tags;
      tolerance = parseInt(items.tolerance);

      if (tags.length > 0) {
        // analyse page
        const data = main();
        // send data message so background.js can update the icon badge
        chrome.runtime.sendMessage({from: 'content', subject: 'data', data: data});
        // listen for popup
        chrome.runtime.onMessage.addListener(
            function(msg, sender, sendResponse) {
              if (msg.from === 'popup' && msg.subject === 'data') {
                sendResponse(data);
              } else {
                console.error('Web Wellbeing: Unrecognised message: ', msg);
              }
            }
        );
        // redact elements
        if (action === 'redact') {
          const elements = data.fe;
          const len = elements.length;
          for (let i = 0; i < len; i++) {
            if (elements[i].classList) {
              elements[i].classList.add('wwb_redacted');
              const subs = elements[i].children;
              const l = subs.length;
              for (let x = 0; x < l; x++) {
                if (subs[x].classList) subs[x].classList.add('wwb_redacted');
              }
            }
          }
        }
        // store page scores for domain averages
        const domain = data.domain;
        chrome.storage.sync.get({
          domains: {
            [domain]: {
              PERMA: {
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
              },
              V: 0,
            },
          },
        }, function(items) {
          const value = {
            [domain]: {
              PERMA: {
                POS: {
                  P: items.domains[domain].PERMA.POS.P + data.PERMA.POS.P,
                  E: items.domains[domain].PERMA.POS.E + data.PERMA.POS.E,
                  R: items.domains[domain].PERMA.POS.R + data.PERMA.POS.R,
                  M: items.domains[domain].PERMA.POS.M + data.PERMA.POS.M,
                  A: items.domains[domain].PERMA.POS.A + data.PERMA.POS.A,
                },
                NEG: {
                  P: items.domains[domain].PERMA.NEG.P + data.PERMA.NEG.P,
                  E: items.domains[domain].PERMA.NEG.E + data.PERMA.NEG.E,
                  R: items.domains[domain].PERMA.NEG.R + data.PERMA.NEG.R,
                  M: items.domains[domain].PERMA.NEG.M + data.PERMA.NEG.M,
                  A: items.domains[domain].PERMA.NEG.A + data.PERMA.NEG.A,
                },
              },
              V: items.domains[domain].V + 1,
            },
          };
          // store the new domain values
          chrome.storage.sync.set({domains: Object.assign({}, items.domains, value)}, function() {
            // console.log('Web Wellbeing: domain updated successfully!');
          });
        });
      } else console.log('Web Wellbeing: no elements selected to scan in options.');
    });
  }
})();
