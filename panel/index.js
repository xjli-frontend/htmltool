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
      ],
      defaultType:0,
      filename:"",
      title:""
    },
    created: function () {
    },
    methods: {
      build(){
        Editor.Ipc.sendToMain('htmltool:build',{type:this.defaultType,filename:this.filename,title:this.title});
      },
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
    #openlabel { color: red; }
    #buildlabel { color: green; line-height:30px;}
  `,

  template: fs.readFileSync(Editor.url('packages://htmltool/panel/index.html', 'utf8')),

  $: {
    buildhtml: '#buildhtml',
    mainDiv: '#mainDiv',
    platformType: "#platformType",
    openlabel: "#openlabel",
    buildlabel: "#buildlabel",
    filename:"#filename",
    title:"#title"
  },

  // method executed when template and styles are successfully loaded and initialized
  ready () {
    this.vue = createVUE(this.$mainDiv);
    this.$platformType.value = this.vue.defaultType;
    this.$platformType.addEventListener('change', (event) => {
      Editor.log(`change: ${this.$platformType.value}`)
      this.vue.defaultType = this.$platformType.value;
    });
    this.$filename.addEventListener('change', (event) => {
      this.vue.filename = this.$filename.value;
    });
    this.$title.addEventListener('change', (event) => {
      this.vue.title = this.$title.value;
    });
  },

  // register your ipc messages here
  messages: {
    'htmltool:open-error' (event) {
      this.$openlabel.innerText = '先构建打开!';
      setTimeout(()=>{
        this.$openlabel.innerText = '';
      },500)
    },
    'htmltool:build-tip' (event,params) {
      this.$buildlabel.innerText = `${params.tip}`;
      Editor.log(`${params.tip}`)
    }
  }
});