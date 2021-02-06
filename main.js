'use strict';

const exec = require('child_process').exec;
module.exports = {
  load () {
    // execute when package loaded
  },

  unload () {
    // execute when package unloaded
  },

  // register your ipc messages here
  messages: {
    'open' () {
      // open entry panel registered in package.json
      Editor.Panel.open('htmltool');
    },
    'build' (event,params) {
      Editor.log('构建开始!'+ JSON.stringify(params));
      main(params);
    },
    'open-html'(){
        if(!ouputhtml){
            Editor.Ipc.sendToPanel('htmltool', 'htmltool:open-error');
            return;
        }
        exec('explorer.exe /select,'+ouputhtml,()=>{
            if (err) {
                return Editor.error(err);
            }
            Editor.log("文件打开成功！"+ouputhtml);    
        });
    }
  },
};


const platform_type = {
    /** 谷歌 */
    google: 0,
    /** facebook */
    facebook: 1,
    /** appLovin */
    appLovin: 2,
    /** unity */
    unity: 3,
    /** vungle */
    vungle: 4,
    /** 穿山甲 */
    csj: 5,
    /** ironSource */
    ironSource: 6,
    /** 腾讯广点通 */
    txgdt: 7,
}
const path = require("path");
const fs = require('fs');
const CleanCSS = require("clean-css");
const toolRoot = path.join(Editor.Project.path, 'packages', "htmltool");
let ouputhtml = "";
const workdir = path.join(Editor.Project.path, "build","web-mobile");
Editor.log(workdir);
// 以下格式转成base64
const base64FileFormat = new Set(['.png', '.jpg', '.jpeg', '.bmp', '.gif', '.webp', '.mp3', '.wav', '.ogg', '.w4a', 'binary', ".bin", ".dbbin", ".skel"]);
// 以下文本文件需要处理
const textFileFormat = new Set([".tsx", ".tmx", ".fnt", ".plist", ".txt", ".atlas", ".json", ".xml", ".ExportJson"]);
const timePromise = function (duration) {
    return new Promise((resolve) => {
        setTimeout(resolve, duration);
    })
}
let main = async (params) => {
    let type = params.type;
    let filename = params.filename;
    Editor.log(`打包类别: ${type}`);
    let newloaderJS = '';
    let resdir = '';
    let needDeletefiles = [];
    let packRoot = ".";
    Editor.log(`workdir: ${workdir}`);
    if (fs.existsSync(path.join(workdir, "assets"))) {
        resdir = path.join(workdir, "assets");
        Editor.log("newloader2.4.x.j");
        newloaderJS = path.join(toolRoot,"newloader2.4.x.js");
    } else {
        resdir = path.join(workdir, "res");
        Editor.log("newloader2.3.x.j");
        newloaderJS = path.join(toolRoot,"newloader2.3.x.js");
    }
    if (!fs.existsSync(resdir)) {
        Editor.error(resdir + "不存在！");
        return;
    }
    Editor.log("合并的res目录", resdir)
    let loopDir = function (dir, fileArr) {
        let files = fs.readdirSync(dir);
        for (let filename of files) {
            let stat = fs.statSync(path.join(dir, filename));
            if (stat.isDirectory()) {
                loopDir(path.join(dir, filename), fileArr);
            } else if (stat.isFile()) {
                fileArr.push(path.join(dir, filename));
            }
        }
    }
    let files = [];
    loopDir(resdir, files);

    let ouputAssetUTF8Contents = {};
    let ouputAssetJSFiles = [];
    let webMobileTag = path.basename(workdir)
    for (let assetsfilepath of files) {
        let _assetsfilepath = assetsfilepath.replace(/[\\]+/g, "/");
        let filePath = _assetsfilepath.split(webMobileTag + "/").pop();
        let extname = path.extname(filePath);
        if (base64FileFormat.has(extname)) {
            let content = fs.readFileSync(assetsfilepath, "base64");
            ouputAssetUTF8Contents[filePath] = content;
        } else if (textFileFormat.has(extname)) {
            let content = fs.readFileSync(assetsfilepath, 'utf-8');
            ouputAssetUTF8Contents[filePath] = content;
        } else if (extname == ".js") {
            ouputAssetJSFiles.push(assetsfilepath);
        }
    }
    fs.writeFileSync(path.join(workdir, "packassets.js"),
        `window["ccassets"]=${JSON.stringify(ouputAssetUTF8Contents)}`);
    let jsfilesQueue = [
        path.join(workdir, "packassets.js")
    ];
    needDeletefiles.push(path.join(workdir, "packassets.js"));

    let cocosjsfiles = [];
    let loopDirJS = function (dir, fileArr) {
        if (dir.indexOf(resdir) >= 0) {
            return;
        }
        let files = fs.readdirSync(dir);
        for (let filename of files) {
            let stat = fs.statSync(path.join(dir, filename));
            if (stat.isDirectory()) {
                loopDirJS(path.join(dir, filename), fileArr);
            } else if (stat.isFile()) {
                if (filename.indexOf('.js') > 0
                    && filename.indexOf("packassets.js") < 0
                    && filename.indexOf("pack.js") < 0) {
                    fileArr.push(path.join(dir, filename));
                }
            }
        }
    }
    loopDirJS(workdir, cocosjsfiles);
    Editor.log("cocosjsfiles", cocosjsfiles)
    // 把settings.js 放入jsfilesQueue
    for (let index = 0; index < cocosjsfiles.length; index++) {
        const jsfile = cocosjsfiles[index];
        if (jsfile.indexOf('settings') >= 0) {
            jsfilesQueue.push(jsfile);
            cocosjsfiles.splice(index, 1);
            break;
        }
    }
    // 把main.js 放入jsfilesQueue
    for (let index = 0; index < cocosjsfiles.length; index++) {
        let jsfile = cocosjsfiles[index];
        if (jsfile.indexOf('main.') >= 0) {
            let jscontent = fs.readFileSync(jsfile, 'utf-8');
            let linearr = jscontent.split("\n");
            let haschange = false;
            for (let j = 0; j < linearr.length; j++) {
                let element = linearr[j];
                if (element.indexOf("jsList:") >= 0) {
                    linearr[j] = "jsList:[],";
                    haschange = true;
                    break;
                }
            }
            if (haschange) {
                jsfile = path.join(workdir, 'main_temp.js')
                fs.writeFileSync(jsfile, linearr.join("\n"), 'utf-8');
                needDeletefiles.push(jsfile);
            }
            jsfilesQueue.push(jsfile);
            cocosjsfiles.splice(index, 1);
            break;
        }
    }
    // 把cocos2d-js-min.js放入jsfilesQueue
    for (let index = 0; index < cocosjsfiles.length; index++) {
        const jsfile = cocosjsfiles[index];
        if (jsfile.indexOf('cocos2d-js') >= 0) {
            jsfilesQueue.push(jsfile);
            cocosjsfiles.splice(index, 1);
            break;
        }
    }
    jsfilesQueue.push(newloaderJS)
    // 剩余的js（也可能没有了）
    jsfilesQueue = jsfilesQueue.concat(cocosjsfiles);

    // assetsBundle 内合并js放入 filesQueue;
    jsfilesQueue = jsfilesQueue.concat(ouputAssetJSFiles);

    Editor.log("jsfilesQueue ", jsfilesQueue);

    // 清理html
    addTip("处理 html");
    let html = fs.readFileSync(path.join(workdir, "index.html"), 'utf-8');
    html = html.replace(/<link rel="stylesheet".*\/>/gs, "")
    html = html.replace(/<script.*<\/script>/gs, "")
    html = html.replace(/<title.*<\/title>/gs, "")
    let title = `<title>${params.title ? params.title:Editor.Project.name}</title>`
    html = html.replace("<head>", `<head>\n${title}`);
    addTip("处理 css");
    let csscode = fs.readFileSync(path.join(toolRoot, "style-mobile.css"), 'utf-8');
    csscode = `<style>${new CleanCSS().minify(csscode).styles}</style>`
    html = html.replace("</head>", `${csscode}\n</head>`);
    addTip("css 写入完成")
    Number(type) == platform_type.csj && addConfig();
    let jscodecontent = '';
    for (let jsfile of jsfilesQueue) {
        if (!jsfile.endsWith(".js")) {
            continue;
        }
        addTip(`处理 ${jsfile}`)
        await timePromise(300);
        jscodecontent = jscodecontent + fs.readFileSync(jsfile, 'utf-8') + "\n";
    }
    let jscodeTAG = `<script type="text/javascript">\n${jscodecontent}window.boot();</script>`
    html = html.replace("</body>", `${jscodeTAG}\n</body>`)
    let suf = filename ? filename + ".html" : "index." + Math.floor(Date.now() / 1000) + ".html";
    suf = Number(type) == platform_type.vungle ? "ad.html":suf;
    ouputhtml = path.join(path.dirname(workdir), suf);
    html = addSdk(type,html);
    fs.writeFileSync(ouputhtml, html, 'utf-8')
    addTip("html写入完成");
    for (let fff of needDeletefiles) {
        fs.unlink(fff, (err) => {
            err && Editor.log(err)
        })
    }
    Editor.log(ouputhtml)
}

let addTip = function(tip){
    Editor.Ipc.sendToPanel('htmltool', 'htmltool:build-tip',{tip:tip});
}

const googleSDKStr = '<script type="text/javascript" src="https://tpc.googlesyndication.com/pagead/gadgets/html5/api/exitapi.js"> </script>';
const unityAppLovinSDKStr = '<script type="text/javascript" src="https://tpc.googlesyndication.com/pagead/gadgets/html5/api/exitapi.js"> </script>';
const csjSDKStr = '<script type="text/javascript" src="https://sf3-ttcdn-tos.pstatp.com/obj/union-fe-nc/playable/sdk/playable-sdk.js"> </script>';
const ironSourceFrontSdkStr = `<script>
function getScript(e, i) {
    var n = document.createElement("script");
    n.type = "text/javascript", n.async = !0, i && (n.onload = i), n.src = e, document.head.appendChild(n)
}
function parseMessage(e) {
    var i = e.data,
        n = i.indexOf(DOLLAR_PREFIX + RECEIVE_MSG_PREFIX);
    if (-1 !== n) {
        var t = i.slice(n + 2);
        return getMessageParams(t)
    }
    return {}
}
function getMessageParams(e) {
    var i, n = [],
        t = e.split("/"),
        a = t.length;
    if (-1 === e.indexOf(RECEIVE_MSG_PREFIX)) {
        if (a >= 2 && a % 2 === 0)
            for (i = 0; a > i; i += 2) n[t[i]] = t.length < i + 1 ? null : decodeURIComponent(t[i + 1])
    } else {
        var o = e.split(RECEIVE_MSG_PREFIX);
        void 0 !== o[1] && (n = JSON && JSON.parse(o[1]))
    }
    return n
}
function getDapi(e) {
    var i = parseMessage(e);
    if (!i || i.name === GET_DAPI_URL_MSG_NAME) {
        var n = i.data;
        getScript(n, onDapiReceived)
    }
}
function invokeDapiListeners() {
    for (var e in dapiEventsPool) dapiEventsPool.hasOwnProperty(e) && dapi.addEventListener(e, dapiEventsPool[
        e])
}
function onDapiReceived() {
    dapi = window.dapi, window.removeEventListener("message", getDapi), invokeDapiListeners()
}
function init() {
    window.dapi.isDemoDapi && (window.parent.postMessage(DOLLAR_PREFIX + SEND_MSG_PREFIX + JSON.stringify({
        state: "getDapiUrl"
    }), "*"), window.addEventListener("message", getDapi, !1))
}
var DOLLAR_PREFIX = "$$",
RECEIVE_MSG_PREFIX = "DAPI_SERVICE:",
SEND_MSG_PREFIX = "DAPI_AD:",
GET_DAPI_URL_MSG_NAME = "connection.getDapiUrl",
dapiEventsPool = {},
dapi = window.dapi || {
    isReady: function () {
        return !1
    },
    addEventListener: function (e, i) {
        dapiEventsPool[e] = i
    },
    removeEventListener: function (e) {
        delete dapiEventsPool[e]
    },
    isDemoDapi: !0
};
init();
</script>`
const ironSourceEndSdkStr = `<script>
function onReadyCallback() {dapi.removeEventListener("ready", onReadyCallback);if (dapi.isViewable()) {adVisibleCallback({isViewable: true});dapi.getAudioVolume();}dapi.addEventListener("viewableChange", adVisibleCallback);dapi.addEventListener("adResized", adResizeCallback);dapi.addEventListener("audioVolumeChange", adAudioCallback);}
function adVisibleCallback(event) {console.log("isViewable " + event.isViewable);if (event.isViewable) {screenSize = dapi.getScreenSize();} else {}}
function adAudioCallback(event) {if (event.isViewable) {} else {}}
function adResizeCallback(event) {screenSize = event;console.log("ad was resized width " + event.width + " height " + event.height);}
window.onload = function () {(dapi.isReady()) ? onReadyCallback(): dapi.addEventListener("ready", onReadyCallback);};\n
</script>`;
let addSdk = function(type,html){
    Editor.log("处理 sdk引入: "+type)
    switch (Number(type)) {
        case platform_type.google:
            Editor.log("处理 google sdk引入 ")
            html = html.replace("</head>", `${googleSDKStr}\n</head>`)
            break;
        case platform_type.facebook:
            Editor.log("处理 facebook sdk引入 ")
            break;
        case platform_type.unity:
        case platform_type.appLovin:
            Editor.log("处理 unity|applovin sdk引入 ")
            html = html.replace("<body>", `${unityAppLovinSDKStr}\n<body>`)
            break;
        case platform_type.vungle:
            Editor.log("处理 vungle sdk引入 ")
            html = html.replace("<body>", `${unityAppLovinSDKStr}\n<body>`)
            break;
        case platform_type.csj:
            Editor.log("处理 穿山甲 sdk引入 ")
            html = html.replace("<body>", `<body>\n${csjSDKStr}`)
            break;
        case platform_type.ironSource:
            Editor.log("处理 ironSource sdk引入 ")
            html = html.replace("<head>", `<head>\n${ironSourceFrontSdkStr}`)
            html = html.replace("</body>", `${ironSourceEndSdkStr}\n</body>`)
            break;
        default:
            break;
    }
    return html;
}

let content = 
`{
    "playable_orientation":0,
    "playable_languages":["en"]
}`
let addConfig = function(){
    let configname = `config.json`;
    let outpath = path.join(path.dirname(workdir), configname);
    fs.writeFileSync(outpath, content, 'utf-8')
    addTip("config 写入完成")
}
