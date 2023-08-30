<h1>Service Worker</h1>
<ul>
    <li>Normal JS runs on a single thread, can aceess and manipulate DOM</li>
    <li> Service Worker
    <ol>
        <li>sw are JS, but run on different thread than HTML pages</li>
        <li>by default, scope for sw is the folder it sits in</li>
        <li>runs in background</li>
        <li>decoupled from HTML</li>
        <li>can listen to events (eg. 1. fetch [a http request]; 2. push notification; 3. notification interaction; 4. background sync; 5. sw lifecycle) and react
        <ul>
            <li>sw serves like a network proxy: every http request sent via fetch goes through sw</li>
        </ul>
        </li>
    </ol>
    </li>
</ul>

<h2>Service Worker Lifecycle</h2>
<ol>
    <li>index.html loads app.js</li>
    <li>app.js registers sw.js</li>
    <li>sw.js installation (install event) [only install sw when it is updated or never installed]</li>
    <li>sw.js activation (activate event, sw now controls all page of scope)</li>
    <li>sw.js goes idle until a fetch event triggers it</li>
</ol>

<h2>Service Worker Implementation</h2>
<ul>
    <li>Declare: sw and manifest can work independently</li>
    <li>Important: sw only works on pages served via https (only exception: localhost)</li>
</ul>
<ol>
    <li>register<br>add registration code to public/src/js/app.js
    </li>
    <li>install<br>only installed when sw.js updated</li>
    <li>activate<br>
        if sw.js changed, must close all existing tabs to enable activation;<br> or click 'Update on reload' from inspect -> application -> service worker<br>or click 'unregister' and then reload<br>or click 'update' 
    </li>
</ol>

<h1>References</h1>
<h2>SW Cache</h2>
<ul>
    <li><a href="https://jakearchibald.com/2014/offline-cookbook/#cache-persistence">About Cache Persistence and Storage Limits</a></li>
    <li><a href="https://developer.mozilla.org/en/docs/Web/API/Service_Worker_API">Learn more about Service Workers</a></li>
    <li><a href="https://developers.google.com/web/fundamentals/getting-started/primers/service-workers">Google's Introduction to Service Workers</a></li>
</ul>
