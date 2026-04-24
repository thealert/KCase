var urlmaps=
{
    'server':{  
        'proxyurl':'http://localhost:8443',
        'websocketurl':'ws://localhost:8443'
    }

}
exports.getEnvUrlbyKey=function(name)
{
    return urlmaps['server'][name];
}