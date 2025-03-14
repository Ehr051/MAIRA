
// networkConfig.js
if (typeof SERVER_URL === 'undefined') {
    var currentHost = window.location.hostname;
    var SERVER_URL = "https://" + currentHost + ":5000";
    var CLIENT_URL = "https://" + currentHost + ":8080";
}




