//self: refers to sw (access sw)
//addEventListener cannot access click or xxx (no access to dom)

var CACHE_STATIC_NAME = 'static-v2';
var CACHE_DYNAMIC_NAME = 'dynamic-v2';

self.addEventListener('install', function (event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  //'caches' refers to cache api
  //open a new cache, if exist then open, not then create and open; returns a promise
  //async always: 'caches.open()' cannot guarantee cache finishes before installation done

  //do not finish installation untill cache done
  event.waitUntil(
    //'static' gives a name for cache
    caches.open(CACHE_STATIC_NAME).then(function (cache) {
      //inside of this func, can add files to the cache
      console.log('[Service Worker] Precaching App Shell');
      //para: request url; send request to server and get response and store
      //para: path of file to be cached
      //key is a request obj not a string
      //add('/') is super important, or does not load
      // cache.add('/');
      // cache.add('/index.html');
      // cache.add('/src/js/app.js');
      cache.addAll([
        // '/help',
        // '/',
        // '/index.html',
        '/offline.html',
        '/src/js/app.js',
        '/src/js/feed.js',
        //no need to cache polyfills, because
        //fetch does not work in old browsers,
        //but they do not support sw as well
        //still can add to fasten
        '/src/js/promise.js',
        '/src/js/fetch.js',
        //file required by package using
        '/src/js/material.min.js',
        '/src/css/app.css',
        '/src/css/feed.css',
        //img used in index.html
        '/src/images/main-image.jpg',
        //also precache styels used in index.html (eg. font)
        'https://fonts.googleapis.com/css?family=Roboto:400,700',
        'https://fonts.googleapis.com/icon?family=Material+Icons',
        'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
      ]);

      //4. failed condition
      fetch('https://www.google.com', {
        mode: 'no-cors',
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      })
        .then(function (response) {
          if (!response.ok) {
            throw new TypeError('Bad status: html');
          }
          return cache.put('/help/', response);
        })
        .catch(function (err) {
          console.log('google fetch failed');
        });

      // //1. lead user to index even request to help
      // fetch('/index.html')
      //     .then(function (response) {
      //         if (!response.ok) {
      //             throw new TypeError('Bad status: html');
      //         }
      //         return cache.put('/help/', response);
      //     });

      //2. change main img with panda
      // fetch('https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Quinlingpandabearr.jpg/330px-Quinlingpandabearr.jpg')
      //     .then(function (response) {
      //         if (!response.ok) {
      //             throw new TypeError('Bad status: fig');
      //         }
      //         return cache.put('/src/images/main-image.jpg', response);
      //     });

      //3. change the index.html
      // fetch('https://sapui5.hana.ondemand.com/1.36.6/docs/guide/f7cbafc9a76140ec8fc55b51a63cf467.html')
      //     .then(function (response) {
      //         if (!response.ok) {
      //             throw new TypeError('Bad status: help');
      //         }
      //         return cache.put('/', response);
      //     });

      // cache.put('https://randomuser.me', res);
    })
  );
});

//return ensures sw are loaded or are activated correctly
self.addEventListener('activate', function (event) {
  console.log('[Service Worker] Activating Service Worker ...', event);
  event.waitUntil(
    //'caches.keys' gives all the keys in all subcaches (as a list) [cache names]
    caches.keys().then(function (keyList) {
      //takes in an array of Promises and wait then to be finished
      return Promise.all(
        keyList.map(function (key) {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log('[Service Worker] Removing old cache.', key);
            //if not, return is null
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

//listen to non-life cycle event
//fetch triggered when html load script or css through links or when they load image
//or when we manually send fetch request through app.js file
self.addEventListener('fetch', function (event) {
  // console.log("url ", event.request.url);
  if (event.request.url === '/help/' || event.request.url === '/help') {
    console.log('get~');
    console.log('get~');
    console.log('get~');
    console.log('get~');
    console.log('get~');
    console.log('get~');
  }

  // console.log('[Service Worker] Fetching something ...', event);
  //can override the respond
  //'respondWith' expects a promise
  //fetch returns a promise
  event.respondWith(
    // fetch(event.request)
    //caches refers to overall cache storage, allows to open subcache, call match...
    //match gives all subcaches
    //find if the request exists in any of the subcaches
    caches
      .match(event.request)
      //if cannot find in any subcache, response would be null (not error)
      .then(function (response) {
        if (response) {
          return response;
        } else {
          //continue with network request
          return (
            fetch(event.request)
              //'res' is the response from the actual server
              .then(function (res) {
                //open a new cache for dynamic caching
                return caches.open(CACHE_DYNAMIC_NAME).then(function (cache) {
                  //cache.add() takes in url and send request get response and store automatically,
                  //but cache.put() does not
                  //response can only be used once
                  //if res not cloned, it will be consumed, and become empty

                  //temporarily turn off dynamic cache
                  cache.put(event.request.url, res.clone());
                  // cache.put(event.request.url, new Response('I wanna show you...'));
                  return res;
                });
              })
              .catch(function (err) {
                return caches.open(CACHE_STATIC_NAME).then(function (cache) {
                  return cache.match('/offline.html');
                });
              })
          );
        }
      })
  );
});
