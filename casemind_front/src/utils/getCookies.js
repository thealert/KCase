exports.getCookie = function(name) {


  function getCookieVal(offset) {

    

    let endstr = document.cookie.indexOf(';', offset);
    if (endstr === -1) {
      endstr = document.cookie.length;
    }
    return decodeURI(document.cookie.substring(offset, endstr));
  }

  if(localStorage.getItem(name))
      return localStorage.getItem(name)
  
  let arg = name + '=';
  let alen = arg.length;
  let clen = document.cookie.length;
  let i = 0;
  let j = 0;
  while (i < clen) {
    j = i + alen;
    if (document.cookie.substring(i, j) === arg) return getCookieVal(j);
    i = document.cookie.indexOf(' ', i) + 1;
    if (i === 0) break;
  }
  return null;
};

exports.remvoeCookie= function(name){
  const expires = new Date();

  expires.setTime(expires.getTime() + -1 * 24 * 60 * 60 * 1000);
  document.cookie = `${name}= ; expires=${expires.toUTCString()};path=/`;

}

function get_cookie(name){
  return document.cookie.split(';').some(c => {
      return c.trim().startsWith(name + '=');
  });
}
