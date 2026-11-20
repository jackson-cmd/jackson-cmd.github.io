// Fills every element with a data-views attribute with the GoatCounter visit
// count of a path (the attribute value, or the current page when it is empty).
// Elements stay empty, and hidden by CSS, until a count arrives.
(function () {
  var script = document.currentScript;
  var code = script && script.getAttribute('data-gc');
  if (!code || !window.fetch) return;
  document.querySelectorAll('[data-views]').forEach(function (el) {
    var path = el.getAttribute('data-views') || location.pathname;
    fetch('https://' + code + '.goatcounter.com/counter/' + encodeURIComponent(path) + '.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.count) return;
        var num = document.createElement(el.getAttribute('data-views-tag') || 'b');
        num.textContent = d.count;
        el.appendChild(num);
        el.appendChild(document.createTextNode(d.count === '1' ? ' view' : ' views'));
      })
      .catch(function () {});
  });
})();
