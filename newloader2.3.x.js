(function () {
    function b64ToUint6(nChr) {
        return nChr > 64 && nChr < 91
            ? nChr - 65 : nChr > 96 && nChr < 123
                ? nChr - 71 : nChr > 47 && nChr < 58
                    ? nChr + 4 : nChr === 43
                        ? 62 : nChr === 47
                            ? 63 : 0
    }
    function base64DecToArr(sBase64, nBlockSize) {
        var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length
        var nOutLen = nBlockSize ? Math.ceil((nInLen * 3 + 1 >>> 2) / nBlockSize) * nBlockSize : nInLen * 3 + 1 >>> 2
        var aBytes = new Uint8Array(nOutLen)
        for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
            nMod4 = nInIdx & 3
            nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4
            if (nMod4 === 3 || nInLen - nInIdx === 1) {
                for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
                    aBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
                }
                nUint24 = 0
            }
        }
        return aBytes
    }
    var handlers = {};
    [".tsx", ".tmx", ".fnt", ".plist", ".txt", ".atlas", ".json", ".xml", ".ExportJson"]
        .forEach(function (format) {
            handlers[format.substr(1)] = function (item, onComplete) {
                var res = window.ccassets[item.url];
                if (res) {
                    onComplete && onComplete(null, res);
                } else {
                    onComplete && onComplete(new Error(item.url + " unpack!"));
                }
            };
        });
    ['.png', '.jpg', '.jpeg', '.bmp', '.gif', '.webp'].forEach(function (format) {
        format = format.substr(1);
        handlers[format] = function (item, onComplete) {
            var img = new Image()
            img.id = item.id;
            img.src = "data:image/" + format + ";base64," + window.ccassets[item.url];
            onComplete && onComplete(null, img)
        };
    });
    ['.mp3', '.wav', '.ogg', '.w4a'].forEach(function (format) {
        handlers[format.substr(1)] = function (item, onComplete) {
            base64DecToArr(window.ccassets[item.url]).buffer,
                function (buffer) {
                    onComplete(null, buffer)
                },
                function () {
                    onComplete(new Error("mp3-res-fail"), null)
                }
        };
    });
    ['binary', ".bin", ".dbbin", ".skel"].forEach(function (format) {
        handlers[format.substr(1)] = function (item, onComplete) {
            var arraybuffer = base64DecToArr(window.ccassets[item.url]).buffer;
            onComplete(null, arraybuffer);
        };
    });
    cc.loader.addDownloadHandlers(handlers);
    console.log('cc.loader.addDownloadHandlers')
})();

// // web加载音频
// var audioBufferHandler = (item, callback) => {
//     if (formatSupport.length === 0) {
//         return new Error('Audio Downloader: audio not supported on this browser!');
//     }

//     item.content = item.url;

//     // If WebAudio is not supported, load using DOM mode
//     if (!__audioSupport.WEB_AUDIO || (item.urlParam && item.urlParam['useDom'])) {
//         loadDomAudio(item, callback);
//     }
//     else {
//         loadWebAudio(item, callback);
//     }
// };

//     // 转二进制Blob
//     function base64toBlob(base64, type) {  
//         // 将base64转为Unicode规则编码
//         var bstr = atob(base64, type),  
//         n = bstr.length,  
//         u8arr = new Uint8Array(n);  
//         while (n--) {  
//             u8arr[n] = bstr.charCodeAt(n) // 转换编码后才可以使用charCodeAt 找到Unicode编码
//         }  
//         return new Blob([u8arr], {  
//             type: type,
//         })
//     }

//     // 加载domaudio
//     function loadDomAudio(item, callback) {
//         var dom = document.createElement('audio');

//         dom.muted = true;
//         dom.muted = false;

//         var data = window.resMap[item.url.split("?")[0]];
//         data = base64toBlob(data, "audio/mpeg");

//         if (window.URL) {
//             dom.src = window.URL.createObjectURL(data);
//         } else {
//             dom.src = data;
//         }
        

//         var clearEvent = function () {
//             clearTimeout(timer);
//             dom.removeEventListener("canplaythrough", success, false);
//             dom.removeEventListener("error", failure, false);
//             if(__audioSupport.USE_LOADER_EVENT)
//                 dom.removeEventListener(__audioSupport.USE_LOADER_EVENT, success, false);
//         };
//         var timer = setTimeout(function () {
//             if (dom.readyState === 0)
//                 failure();
//             else
//                 success();
//         }, 8000);
//         var success = function () {
//             clearEvent();
//             item.element = dom;
//             callback(null, item.url);
//         };
//         var failure = function () {
//             clearEvent();
//             var message = 'load audio failure - ' + item.url;
//             cc.log(message);
//             callback(message, item.url);
//         };
//         dom.addEventListener("canplaythrough", success, false);
//         dom.addEventListener("error", failure, false);
//         if(__audioSupport.USE_LOADER_EVENT)
//             dom.addEventListener(__audioSupport.USE_LOADER_EVENT, success, false);
//     }

//     // 加载webaudio
//     function loadWebAudio(item, callback) {
//         if (!context) callback(new Error('Audio Downloader: no web audio context.'));

//         var data = window.resMap[item.url];
//         data = base64toArray(data);

//         if (data) {
//             context["decodeAudioData"](data.buffer, function(buffer){
//                 //success
//                 //item.buffer = buffer;
//                 callback(null, buffer);
//             }, function(){
//                 //error
//                 callback('decode error - ' + item.id, null);
//             });
//         } else {
//             callback('request error - ' + item.id, null);
//         }
//     }

//         // 转二进制
//         function base64toArray(base64) {  
//             // 将base64转为Unicode规则编码
//             var bstr = atob(base64),  
//             n = bstr.length,  
//             u8arr = new Uint8Array(n);  
//             while (n--) {  
//                 u8arr[n] = bstr.charCodeAt(n) // 转换编码后才可以使用charCodeAt 找到Unicode编码
//             }
    
//             return u8arr;
//         }