chrome.runtime.onMessage.addListener(
    function(msg, sender, sendResponse) {
      if (msg.analysis) {
        const text = msg.analysis.TEXT;
        const url = msg.analysis.URL;
        const wellbeing = analyseText(text, url);
        const PERMA = {
          PERMA: {
            POS: {
              P: wellbeing.POS_P,
              E: wellbeing.POS_E,
              R: wellbeing.POS_R,
              M: wellbeing.POS_M,
              A: wellbeing.POS_A,
            },
            NEG: {
              P: wellbeing.NEG_P,
              E: wellbeing.NEG_E,
              R: wellbeing.NEG_R,
              M: wellbeing.NEG_M,
              A: wellbeing.NEG_A,
            },
          },
        };
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('text').textContent = text;
        document.getElementById('tokens').textContent = text.match(permaReg).length;
        document.getElementById('clean').textContent = cleanText(text);
        createRadarChart(PERMA, document.getElementById('radar').getContext('2d'));
        document.getElementById('data').classList.remove('hidden');
      } else {
        console.warn('Web Wellbeing: Unknown data: ' + msg);
      }
    }
);
