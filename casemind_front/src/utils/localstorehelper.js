
const ttl=1000*60*60*24*2

exports.setLocalWithExpiry = function(key, value) {
	const now = new Date()

	// `item` is an object which contains the original value
	// as well as the time when it's supposed to expire
	const item = {
		value: value,
		expiry: now.getTime() + ttl,
	}
	localStorage.setItem(key, JSON.stringify(item))
}

exports.getLoaclWithExpiry = function(key) {
	const itemStr = localStorage.getItem(key)
	// if the item doesn't exist, return null
	if (!itemStr) {
		return null
	}
    const now = new Date()
    const item = JSON.parse(itemStr)
    var res=itemStr
    if('value' in item)
        res= item.value
    for (var item_key in localStorage){
        
        var item_value=localStorage.getItem(item_key);
        try{
            if('expiry' in JSON.parse(item_value)){
                if (now.getTime() > JSON.parse(item_value).expiry){
                    console.log("delete item "+item_key)
                    localStorage.removeItem(item_key)
                    if(item_key==key){
                        res=null;
                    }
                }
            }
        }
        catch(e){
            continue;
        }
        
     }
    return res;
	// const item = JSON.parse(itemStr)
	// const now = new Date()
	// // compare the expiry time of the item with the current time
	// if (now.getTime() > item.expiry) {
	// 	// If the item is expired, delete the item from storage
	// 	// and return null
	// 	localStorage.removeItem(key)
	// 	return null
	// }
	//return item.value
}