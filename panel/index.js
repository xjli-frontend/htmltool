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
        {id:6,name:"腾讯广点通"},
      ],
      defaultType:1
    },
    created: function () {
    },
    methods: {
      build(){
        Editor.Ipc.sendToMain('htmltool:build',{type:this.defaultType});
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
    #label { color: red; }
  `,

  // html template for panel
  template: fs.readFileSync(Editor.url('packages://htmltool/panel/index.html', 'utf8')),

  // element and variable binding
  $: {
    // openhtml: '#openhtml',
    buildhtml: '#buildhtml',
    mainDiv: '#mainDiv',
    platformType: "#platformType",
    label: "#label"
  },

  // method executed when template and styles are successfully loaded and initialized
  ready () {
    this.vue = createVUE(this.$mainDiv);
    this.$platformType.value = this.vue.defaultType;
    this.$platformType.addEventListener('change', (event) => {
      this.vue.defaultType = this.$platformType.value;
    });
  },

  // register your ipc messages here
  messages: {
    'htmltool:open-error' (event) {
      this.$label.innerText = '先构建打开!';
      setTimeout(()=>{
        this.$label.innerText = '';
      },500)
    }
  }
});