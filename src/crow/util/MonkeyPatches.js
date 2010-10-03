goog.provide('crow.util.MonkeyPatches');

/**
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf#Compatibility
 */
if (!Array.prototype.indexOf)
{
  Array.prototype.indexOf = function(elt /*, from*/)
  {
    var len = this.length >>> 0;

    var from = Number(arguments[1]) || 0;
    from = (from < 0)
         ? Math.ceil(from)
         : Math.floor(from);
    if (from < 0)
      from += len;

    for (; from < len; from++)
    {
      if (from in this &&
          this[from] === elt)
        return from;
    }
    return -1;
  };
}

/*!
 * + Jonas Raoni Soares Silva
 * //@ http://jsfromhell.com/array/shuffle [rev. #1]
 */
if(!Array.prototype.shuffle){
	Array.prototype.shuffle = function(){
		var v = this.concat();
    for(var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x){}
    return v;
  };
}
