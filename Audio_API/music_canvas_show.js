// 参数：画布元素。画布的默认宽度。音频元素【注意：画布元素必须设置一个方形的父级容器。代码中已做好适配缩放的设置】
// cvsgetready(document.getElementById('cvs'),800,document.getElementById('music'));
function cvsgetready(cvs_dom, cvs_dom_wh, audio_dom, bgcolor) {
    let audio = audio_dom;
    let canvas = cvs_dom;
    canvas.height = cvs_dom_wh;
    canvas.width = cvs_dom_wh;
    // 缩放
    canvas.style.transform = 'scale(' + cvs_dom.parentNode.offsetWidth / cvs_dom.offsetWidth + ')'
    let context = canvas.getContext("2d");
    audio.crossOrigin = "anonymous";
    //创建境况
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    var audioContext = new AudioContext();
    //创建输入源
    var source = audioContext.createMediaElementSource(audio);
    //用createAnalyser方法,获取音频时间和频率数据,实现数据可视化。
    var analyser = audioContext.createAnalyser();
    //连接：source → analyser → destination
    source.connect(analyser);
    //声音连接到扬声器
    analyser.connect(audioContext.destination);
    /*存储频谱数据，Uint8Array数组创建的时候必须制定长度，
    长度就从analyser.frequencyBinCount里面获取，长度是1024*/
    var arrData = new Uint8Array(analyser.frequencyBinCount),
        count = Math.min(100, arrData.length), //能量柱个数,不能大于数组长度1024,没意义
        /*计算步长，每隔多少取一个数据用于绘画，意抽取片段数据来反映整体频谱规律，
               乘以0.6是因为，我测试发现数组长度600以后的数据基本都是0了，
               画出来能量柱高度就是0了，为了效果好一点，所以只取前60%，
               如果为了真实可以不乘以0.6
            */
        step = Math.round(arrData.length * 0.8 / count),
        // step = Math.round(arrData.length / count),
        value = 0, //每个能量柱的值
        drawY = 0, //能量柱Y轴坐标
        //能量柱宽度，设置线条宽度
        lineWidth = 10;
    //设置线条宽度
    context.lineWidth = lineWidth;
    //渲染函数
    function render() {
        // 每次要清除画布
        context.clearRect(0, 0, cvs_dom_wh, cvs_dom_wh);
        context.arc(cvs_dom_wh / 2, cvs_dom_wh / 2, 400, 0, 2 * Math.PI);
        context.fillStyle = bgcolor || 'rgba(255,255,255,1)';
        // context.fillStyle = bgcolor || 'rgba(0,0,0,1)';
        context.fill();
        //获取频谱值
        analyser.getByteFrequencyData(arrData);
        // console.log(arrData);
        for (var i = 0; i < count; i++) {
            //前面已经计算好步长了
            value = arrData[i * step + step];
            /*能量柱的高度，从canvas的底部往上画，那么Y轴坐标就是画布的高度减去能量柱的高度，
                       而且经测试发现value正常一般都比较小，要画的能量柱高一点，所以就乘以2，
                       又防止太高，取了一下最大值，并且canvas里面尽量避免小数值，取整一下
                     */
            // drawY = parseInt(Math.max((height - value * 2), 10));
            drawY = value;
            //开始一条路径
            context.beginPath();
            /*设置画笔颜色，hsl通过这个公式出来的是很漂亮的彩虹色
               H：Hue(色调)。0(或360)表示红色，120表示绿色，240表示蓝色，
                       也可取其他数值来指定颜色。取值为：0 - 360
               S：Saturation(饱和度)。取值为：0.0% - 100.0%
               L：Lightness(亮度)。取值为：0.0% - 100.0%
             */
            context.strokeStyle = "hsl( " + Math.round((i * 360) / count) + ", 100%, 50%)";
            //从X轴drawX，Y轴就是canvas的高度，也就是canvas的底部
            // context.moveTo(drawX, height);
            context.save();
            context.translate(cvs_dom_wh / 2, cvs_dom_wh / 2);
            //旋转
            context.rotate(i * Math.PI / 50);
            context.moveTo(0, 100);
            context.lineTo(0, 100 + drawY);
            //stroke方法才是真正的绘制方法,顺便也相当于结束了这次的绘画路径,就不用调用closePath方法了
            //之前的是水平排布显示条块，不需要 但此处是做了圆圈布局显示需要闭合一下如果不闭合。会出现收尾相连进行描绘的操作。既会出现白色的条块显示bug
            context.closePath();
            context.stroke();
            context.restore();
        }
        //用requestAnimationFrame做动画
        requestAnimationFrame(render);
    }
    render()
}