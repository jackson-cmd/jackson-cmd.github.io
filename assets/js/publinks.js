// Publication entries: toggle the TL;DR and BibTeX panels, copy BibTeX.
document.addEventListener('click', function (e) {
  var t = e.target.closest && e.target.closest('.pub-toggle');
  if (t) {
    var panel = document.getElementById(t.getAttribute('aria-controls'));
    if (!panel) return;
    var open = t.getAttribute('aria-expanded') === 'true';
    t.setAttribute('aria-expanded', open ? 'false' : 'true');
    panel.hidden = open;
    return;
  }
  var c = e.target.closest && e.target.closest('.pub-copy');
  if (c) {
    var code = c.parentNode.querySelector('code');
    var text = code ? code.textContent : '';
    var done = function () { c.textContent = 'Copied'; setTimeout(function () { c.textContent = 'Copy'; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done); }
    else { var r = document.createRange(); r.selectNodeContents(code); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
  }
});
