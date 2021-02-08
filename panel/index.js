const createVUE = function (element) {
  return new window.Vue({
    el: element,
    data:
    {
      types:[
        {id:0,name:"google"},
        {id:1,name:"facebook"},
        {id:2,name:"appLovin"},
        {id:3,name:"unity"},
        {id:4,name:"vungle"},
        {id:5,name:"穿山甲"},
        {id:6,name:"ironSource"},
        {id:7,name:"腾讯广点通"},
        {id:8,name:"mintergral"}
      ],
      defaultType:0,
      tip:"",
      fail:"",
      callback:"platformDownloadCallback"
    },
    created: function () {
    },
    methods: {
      openhtml(){
        Editor.Ipc.sendToMain('htmltool:open-html');
      }
    }
  });
};
const fs = require('fs');
Editor.Panel.extend({
  // css style for panel
  style: `
    :host { margin: 5px; }
    h2 { color: #f90; }
    #failtext { color: red; }
    #buildlabel { color: green; line-height:30px;}
    #title_tip{color: green;}
    span{
      position:relative;
      display:inline-block;
    }
    span:hover{
      cursor:pointer;
    }
    span:hover:before{
      content:attr(data-tooltip);
      background:black;
      color:#fff;
      padding:.2em .8em;
      position:absolute;
      top:-100%;
      white-spack:pre;
    }
    span:hover:after{
      content:" ";
      position:absolute;
    }
  `,

  template: fs.readFileSync(Editor.url('packages://htmltool/panel/index.html', 'utf8')),

  $: {
    buildhtml: '#buildhtml',
    mainDiv: '#mainDiv',
    platformType: "#platformType",
    buildlabel: "#buildlabel",
    link:"#link",
    suffix:"#suffix",
    title:"#title",
  },

  ready () {
    this.vue = createVUE(this.$mainDiv);

    this.$buildhtml.addEventListener('click', (event) => {
      this.$buildhtml.disabled = true;
      if((this.vue.defaultType == 2 || this.vue.defaultType == 3) && this.$link.value == ""){
          this.$buildhtml.disabled = false;
          this.vue.fail = '需要填入链接!';
          setTimeout(()=>{
            this.vue.fail = '';
          },500)
          return;
      }
      Editor.Ipc.sendToMain('htmltool:build',{type:this.$platformType.value,title:this.$title.value,isSuffix:this.$suffix.checked,link:this.$link.value});
    });

    this.$platformType.value = this.vue.defaultType;
    this.$platformType.addEventListener('change', (event) => {
      Editor.log(`change: ${this.$platformType.value}`)
      this.vue.defaultType = this.$platformType.value;
      if(this.vue.defaultType == 2 || this.vue.defaultType == 3){
        this.$link.style.display = "block";
      }else{
        this.$link.style.display = "none";
      }
      this.vue.tip = showTipByType(this.$platformType.value);
    });
  },

  messages: {
    'htmltool:open-error' (event) {
      this.vue.fail = '先构建打开!';
      setTimeout(()=>{
        this.vue.fail = '';
      },500)
    },
    'htmltool:build-tip' (event,params) {
      if(params.tip == "success"){
        this.$buildhtml.disabled = false;
      }
      // this.$buildlabel.innerText = `${params.tip}`;
      Editor.log(`${params.tip}`)
    }
  },

});

const platform_type = {
  /** 谷歌 0*/
  google : 0,
  /** facebook 1*/
  facebook : 1,
  /** appLovin 2*/
  appLovin : 2,
  /** unity 3*/
  unity : 3,
  /** vungle 4*/
  vungle : 4,
  /** 穿山甲 5*/
  csj : 5,
  /** ironSource 6*/
  ironSource : 6,
  /** 腾讯广点通 7*/
  txgdt : 7,
  /** 腾讯广点通 8*/
  mintergral : 8
}
let showTipByType = function(type){
  let tip = "";
  switch (Number(type)) {
    case platform_type.google:
    case platform_type.facebook:
        break;
    case platform_type.unity:
    case platform_type.appLovin:
        tip = "注：需要将mraid.js导入为插件(appLovin和unity的mraid不同)";
        break;
    case platform_type.vungle:
        tip = "注：命名为ad.html,工具自动处理";
        break;
    case platform_type.csj:
        tip = "注：会生成对应平台的config";
        break;
    case platform_type.ironSource:
        break;
    case platform_type.txgdt:
        tip = "注：会生成对应平台的config";
        break;
    case platform_type.mintergral:
        tip = `注：需要自定义window.gameStart,gameClose\n以及游戏内部直接调用gameReady,gameEnd`;
        break;
    default:
        break;
  }
  return tip;
}

