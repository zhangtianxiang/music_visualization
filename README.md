# music_visualizer

## github_page

尝试将可视化程序制作成为react应用，并使用github_page部署，后期将可视化核心拆出后拆分为子模块。

## usage

clone the project, then open `index.html`, choose a music file to play

## style

now there are two style to show, change `visualizer_type` in `public/js/visulizer.js` to switch.

```js
let visualizer_type = 2
```

type 1 is histogram

type 2 is a style mimic AE effects

## type2 exmpale

For case the code not running, examples uploaded to `/example/`.

## beyond PJ

以下内容不属于PJ

目前这个repo为了课程PJ而设立，type1是一个比较简单的柱形图的可视化，虽然可视化了，但是其实跟音乐节奏很难对上，没有什么意义，因为音乐节奏类的频率较低，大概在120HZ以内，2000HZ以上为乐器声音和一些泛音，而这120HZ占比太小，所以看柱形图根本根节奏对不上。

type2将120HZ内的频率以外圈圆形柱形图展示，12HZ到2000HZ左右的频率以内圈圆形跳动原点表示，这样完全可以与节奏对应，与音乐契合，展示效果更好。

写音乐可视化是一个非常早的想法，大概四年前就层使用AE的一个特效来实现音乐可视化，但是以前技术不太成熟没法做成js的，之后一直在搁置。之所以使用HTML+js，是因为并不是要做可视化音乐播放器，而是纯粹的给定音乐可以将其可视化，用于录制视频等功能。

现在的type2基本图形已经绘制好了，还有一些小bug需要调试，如：外圈长度设置较大时会显示错乱，不同浏览器提供的AudioContext里的AnalyzerNode的采样率不同，对IE的适配等。导致显示效果变差。还有一些参数设置应该转移到页面上来，还有UI界面的美化。等之后可以考虑搭配一个后端部署到自己的服务器上去。

## thanks

感激kuckir的CSPL库，因为网页解析到的低频率的值比较稀疏，只有三十多个，要贴满外圈必须要插值，设想的是三次样条插值，但是自己写有点搞，幸好有人做了这个事情。现在就差重构代码，改进用户交互UI了。

Thanks for kuckir's CSPL:

http://blog.ivank.net/interpolation-with-cubic-splines.html

https://github.com/kuckir/CSPL.js

之后会改为submodule
