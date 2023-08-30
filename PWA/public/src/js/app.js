// import Promise from 'promise-polyfill';

// if 'serviceWorker' property exists in the browser (nevigator),
// means add sw only if browser supports

// visit sw in nevigator and add path of sw
// slash '/' means go to root folder first

// tells browser /sw.js should be treated in a special way, registered as sw, as background process

//save install banner to show later 
var deferredPrompt;

//check if there is a Promise Object
if (!window.Promise) {
    window.Promise = Promise;
}

// register() returns a promise, async, ensure not block other thread
// then is feature of promise, message show once registration done
// .register('/sw.js', {scope: '/help/'}) // optional
if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/sw.js')
        .then(function () {
            console.log('Service Worker Registered!');
        })
        .catch(function (err) {
            console.log(err);
        });
}

//'beforeinstallprompt' trigger by chrome right before about to show install banner
window.addEventListener('beforeinstallprompt', function (event) {
    // console.log('beforeinstallprompt fired');
    //chrome not show the banner
    event.preventDefault();
    deferredPrompt = event;
    //do nothing
    return false;
});

// //2. use promise to do async
// //good for multiple chained async
// var promise = new Promise(function (resolve, reject) {
//     setTimeout(function() {
//         // resolve('This is executed once the timer is done')
//         reject({ code: 500, message: 'An error occured!' });
//         //console.log('This is executed once the timer is done');
//     }, 3000);
// });


// //ajax: cannot be used in sw, because partially sync and complex
// //do not use
// var xhr = new XMLHttpRequest();
// //config request, open connection, but not send
// xhr.open('GET', 'https://httpbin.org/ip');
// xhr.responseType = 'json';

// //when get a response
// xhr.onload = function () {
//     console.log(xhr.response);
// };

// xhr.onerror = function () {
//     console.log('Error!');
// };

// xhr.send();

// //fetch here also triggers fetch in sw
// //fetch is method provided by js and browser
// //http get request data from a resource
// //fetch: send and handle response, only async
// fetch('https://httpbin.org/ip')
//     .then(function (response) {
//         console.log(response);
//         //parse the json data into js object
//         return response.json();
//     }).then(function (data) {
//         console.log(data);
//     })
//     .catch(function (err) {
//         console.log(err);
//     });


// //http post sent data to server
// fetch('https://httpbin.org/post', {
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json'
//     },
//     mode: 'cors',
//     body: JSON.stringify({ message: 'Does this work?' })
// })
//     .then(function (response) {
//         console.log(response);
//         return response.json();
//     }).then(function (data) {
//         console.log(data);
//     }).catch(function (err) {
//         console.log(err);
//     });

// //m1. deal with error promise
// //function in then executed when resolve or reject called
// // promise.then(function(text) {
// //     // console.log(text);
// //     return text;
// // }, function (err) {
// //     console.log(err.code, err.message);
// // }).then(function(newText) {
// //     console.log(newText);
// // });

// //m2. error promise
// //catch catches any error happens before it
// promise.then(function (text) {
//     return text;
// }).then(function (newText) {
//     console.log(newText);
// })
//     .catch(function (err) {
//         console.log(err.code, err.message);
//     });

// //1. use callback to do async
// //1st para is a callback
// //after 3000ms function (1st para) will be executed
// // setTimeout(function () {
// //     console.log('This is executed once the timer is done');
// // }, 3000);
// console.log('This is executed right after setTimeout()');