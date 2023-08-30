<h1>Manifest</h1>
<h2>Basics</h2>
<ul>
    <li>used to make web installable (eg. generate an icon in homepage)</li>
</ul>
<ol>
    <li>create json file named <i>"manifest.json" under the root folder</i></li>
    <li>add manifest json file path in every html file under head: <code>&lt;link rel="manifest" href="/manifest.json"&gt;</code></li>
    <li>write properties to manifest file</li>
</ol>

<h2>Manifest Properties</h2>
<ul>
    <li>name: long name of app</li>
    <li>short_name: short name of app (below icon)</li>
    <li>start_url: which page to load on startup</li>
    <li>scope: which pages included in PWA</li>
    <li>display: should it look like a standalone app (like native app)</li>
    <li>background_color: color while loading</li>
    <li>theme_color: top bar in task switcher</li>
    <li>description</li>
    <li>dir: read direction of app</li>
    <li>orientation: default orientation</li>
    <li>lang</li>
    <li>icons: list of icons - provide source, type, and size (select best show on homescreen)</li>
    <li>related_applications: native app</li>
</ul>

<h2>Manifest Test</h2>
in chrome customize -> more tools -> developer tools -> application

or right click -> inspect -> application