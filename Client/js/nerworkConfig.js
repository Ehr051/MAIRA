
// networkConfig.js
if (typeof SERVER_URL === 'undefined') {
    var currentHost = window.location.hostname;
    var SERVER_URL = "http://" + currentHost + ":5000";
    var CLIENT_URL = "http://" + currentHost + ":8080";
}




