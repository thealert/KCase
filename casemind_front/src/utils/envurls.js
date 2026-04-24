var defaultOrigin = 'http://localhost:8443'
var runtimeOrigin =
    typeof window !== 'undefined' && window.location && window.location.origin
        ? window.location.origin
        : defaultOrigin
var websocketOrigin = runtimeOrigin.replace(/^http/, 'ws')

var urlmaps=
{
    'server':{
        'proxyurl': runtimeOrigin,
        'websocketurl': websocketOrigin
    }

}
exports.getEnvUrlbyKey=function(name)
{
    return urlmaps['server'][name];
}