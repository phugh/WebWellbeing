/**
 * Save options to chrome.storage
 * @function setOptions
 */
function setOptions() {
  const act = document.getElementById('action').value;
  const badge = document.getElementById('badge').value;
  const nGrams = document.getElementById('inc_n').checked;
  let tolerance = parseInt(document.getElementById('blockTol').value);

  // correct tolerance
  if (tolerance > 5) {
    tolerance = 5;
  } else if (tolerance < 1) {
    tolerance = 1;
  }

  // concat checked elements into array
  const tags = [];
  if (document.getElementById('inc_p').checked) tags.push('p');
  if (document.getElementById('inc_a').checked) tags.push('a');
  if (document.getElementById('inc_h').checked) tags.push('h1,h2,h3,h4,h5,h6');
  if (document.getElementById('inc_li').checked) tags.push('li');
  if (document.getElementById('inc_phr').checked) tags.push('span,em,strong,code,samp,kbd,var');
  if (document.getElementById('inc_x').checked) tags.push('blockquote,label,th,td,output');
  const tag = tags.join(',');

  chrome.storage.sync.set({
    action: act,
    badge: badge,
    ngrams: nGrams,
    tags: tag,
    tolerance: tolerance,
  }, function(items) {
    Materialize.toast('Saved!', 3000);
  });
}

/**
 * Restore options from chrome.storage
 * @function getOptions
 */
function getOptions() {
  chrome.storage.sync.get({
    action: 'none',
    badge: 'p-page',
    ngrams: true,
    tags: 'p,a,h1,h2,h3,h4,h5,h6,li,span,em,strong,code,samp,kbd,var,blockquote,label,th,td,output',
    tolerance: 3,
  }, function(items) {
    document.getElementById('action').value = items.action;
    document.getElementById('badge').value = items.badge;
    document.getElementById('blockTol').value = items.tolerance;
    document.getElementById('inc_n').checked = items.ngrams;

    const tags = items.tags.split(',');
    const len = tags.length;
    for (let i = 0; i < len; i++) {
      const x = tags[i];
      if (x === 'p') {
        document.getElementById('inc_p').checked = true;
      } else if (x === 'a') {
        document.getElementById('inc_a').checked = true;
      } else if (x === 'h1') {
        document.getElementById('inc_h').checked = true;
      } else if (x === 'li') {
        document.getElementById('inc_li').checked = true;
      } else if (x === 'em') {
        document.getElementById('inc_phr').checked = true;
      } else if (x === 'output') {
        document.getElementById('inc_x').checked = true;
      }
    }
  });
}

// @todo DOMCL and doc.ready aren't both needed
// but for some reason it doesn't seem to work without both
$(document).ready(function() {
  $('select').material_select(); // initialise drop-down box
  document.getElementById('save').addEventListener('click', setOptions);
});
window.addEventListener('DOMContentLoaded', getOptions);
