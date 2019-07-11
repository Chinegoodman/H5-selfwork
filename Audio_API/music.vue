<template>
    <div class="self-music">
        <p class="self_music_title">{{musicdata.title}}</p>
        <div class="music_list" :style="musiclistsytle">
            <div class="music_li">
                <span>编号</span>
                <span>歌曲名称</span>
                <span>歌手名</span>
            </div>

            <div class="music_li" v-for="(item,index) in musicarr" :key="index">
                <span class="_textover">{{item.id}}</span>
                <span class="_textover">{{item.name}}</span>
                <span class="_textover">{{item.singer}}<i @click="listchoose(item)">播放</i></span>
            </div>
        </div>
        <div class="music_showbox">
            <canvas ref="musicCanvas" id="music_canvas"></canvas>
            <div class="music_controls">
                <div class="music_jindutiao">
                    <i :style="musicjdtpoint" class="music_jdt_point"></i>
                </div>
                <div class="music_change up">上一首</div>
                <div class="music_play_pause" @click="changemusicstatus">播放/暂停</div>
                <div class="music_change down">下一首</div>
                <div class="music_voice">
                    <div class="music_voice_line" @click="changevoicce">
                        <i :style="musicvoicepoint" class="music_voice_point"></i>
                    </div>
                </div>
                <div class="music_voice_number">{{musicvoicepoint.left}}</div>
                <div class="music_time">
                    {{currenttime | time}}/{{durationtime | time}}
                </div>
            </div>
            <!--<audio controls ref="audio" src="http://www.ooo0o.com/demo/music/fade.mp3"></audio>-->
            <!--<audio controls ref="audio" :src="currentmusicdataurl"></audio>-->
            <audio controls ref="audio" :src="currentmusicdata.url"></audio>
        </div>
    </div>
</template>

<script>
    export default {
        props:['musicdata'],
        name: "music",
        data(){
            return{
                currenttime:0,
                durationtime:0,
                musicjdtpoint:{
                    width:'0%'
                },
                musicvoicepoint:{
                    left:'30%'
                },
                currentmusicdata:{},
                musicarr:[],
                musiclistsytle:{
                    backgroundImage:'',
                },
                musicstatus:false
            }
        },
        methods:{
            listchoose(obj){
                this.musicpause()
                this.$refs.audio.pause();
                this.currentmusicdata = obj;
                this.musicplay()
            },
            canvasdone(){
                let audio = this.$refs.audio;
                let canvas = this.$refs.musicCanvas;
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
                var   arrData = new Uint8Array(analyser.frequencyBinCount),
                    count = Math.min(100,arrData.length), //能量柱个数,不能大于数组长度1024,没意义
                    /*计算步长，每隔多少取一个数据用于绘画，意抽取片段数据来反映整体频谱规律，
                           乘以0.6是因为，我测试发现数组长度600以后的数据基本都是0了，
                           画出来能量柱高度就是0了，为了效果好一点，所以只取前60%，
                           如果为了真实可以不乘以0.6
                        */
                    step = Math.round(arrData.length * 0.6 / count),
                    value = 0, //每个能量柱的值
                    drawX = 0, //能量柱X轴位置
                    drawY = 0, //能量柱Y轴坐标
                    height = canvas.height = window.innerHeight,//canvas高度
                    width = canvas.width = window.innerWidth,//canvas宽度
                    //能量柱宽度，设置线条宽度
                    lineWidth = context.lineWidth = canvas.width / count;
                //设置线条宽度
                context.lineWidth = lineWidth;
                //渲染函数
                function render(){
                    //每次要清除画布
                    context.clearRect(0, 0, width, height);
                    //获取频谱值
                    analyser.getByteFrequencyData(arrData);
                    for(var i = 0; i < count; i++) {
                        //前面已经计算好步长了
                        value = arrData[i * step + step];
                        //X轴位置计算
                        drawX = i * lineWidth;
                        /*能量柱的高度，从canvas的底部往上画，那么Y轴坐标就是画布的高度减去能量柱的高度，
                                   而且经测试发现value正常一般都比较小，要画的能量柱高一点，所以就乘以2，
                                   又防止太高，取了一下最大值，并且canvas里面尽量避免小数值，取整一下
                                 */
                        drawY = parseInt(Math.max((height - value * 2), 10));
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
                        context.moveTo(drawX, height);
                        //从X轴drawX，Y轴就是计算好的Y轴，是从下往上画，这么理解
                        context.lineTo(drawX, drawY);
                        /*stroke方法才是真正的绘制方法,顺便也相当于结束了这次的绘画路径，
                                   就不用调用closePath方法了
                                */
                        context.stroke();
                    }
                    //用requestAnimationFrame做动画
                    requestAnimationFrame(render);
                }
                render()
            },
            getmusiclist(){
                this.$ajax.get(this.musicdata.musilistapi).then(e=>{
                    console.log(e.data)
                    this.musicarr = e.data.music;
                    this.currentmusicdata.url = e.data.music[0].url
                })
            },
            musicplay(){
                this.$refs.audio.play();
                this.musicstatus = true;
                this.showmusicmsg(true)
            },
            musicpause(){
                this.$refs.audio.pause();
                this.musicstatus = false;
                this.showmusicmsg(false)
            },
            changemusicstatus(){
                if(this.musicstatus){
                    // true正在播放
                    this.musicpause()
                }else {
                    // false暂停播放
                    this.musicplay()
                }
            },
            showmusicmsg(status){
                let _this = this;
                if(status){
                    clearInterval()
                    setInterval(function () {
                        let musiclong = _this.$refs.audio.duration||0;
                        let musiccurrentTime = _this.$refs.audio.currentTime||0;
                        let musicvolume = _this.$refs.audio.volume||1.0;
                        _this.currenttime = musiccurrentTime;
                        _this.durationtime = musiclong;
                        _this.musicjdtpoint.width = musiccurrentTime/musiclong*100 + '%';
                        _this.musicvoicepoint.left = musicvolume*100 + '%';
                        // _this.currenttimedurationtime();
                        // TODO: 显示的时间总时长有bug
                    },1000)
                }else {
                    clearInterval()
                    let musiclong = _this.$refs.audio.duration||0;
                    let musiccurrentTime = _this.$refs.audio.currentTime||0;
                    let musicvolume = _this.$refs.audio.volume||1.0;
                    _this.currenttime = musiccurrentTime;
                    _this.durationtime = musiclong;
                    _this.musicjdtpoint.width = musiccurrentTime/musiclong*100 + '%';
                    _this.musicvoicepoint.left = musicvolume*100 + '%';
                    // _this.currenttimedurationtime();
                }
                // console.log(_this.currenttime)
                // console.log(_this.durationtime)
            },
            changevoicce(e){
                console.log(e)
                // todo 添加调节音量  及添加调节播放进度功能
                // todo 查看点击列表不播放问题
            },
            // 用过滤器代替此方法
            currenttimedurationtime(){
                let _this=this;
                let currenttimeRRR = Math.floor(this.currenttime)||0
                console.log(currenttimeRRR)
                if(currenttimeRRR<10){
                    _this.currenttime = '00:0'+ currenttimeRRR
                }else if(9<currenttimeRRR<60){
                    _this.currenttime = '00:'+ currenttimeRRR
                }else {
                    _this.currenttime =  Math.floor(currenttimeRRR/60) + ':' + (currenttimeRRR % 60);
                }
                console.log(_this.currenttime)
                let durationtimeRRR = Math.floor(this.durationtime)||0
                console.log(durationtimeRRR)
                if(durationtimeRRR<10){
                    _this.durationtime = '00:0'+ durationtimeRRR
                }else if(9<durationtimeRRR<60){
                    _this.durationtime = '00:'+ durationtimeRRR
                }else {
                    _this.durationtime =  Math.floor(durationtimeRRR / 60) + ':' + (durationtimeRRR % 60);
                }
                console.log(durationtimeRRR % 60)
            },
        },
        filters:{
            time:function (value) {
                if (!value) return ''
                let timeval = Math.floor(value);
                if(timeval < 10){
                    return '00:0'+ timeval
                }else if(timeval > 59){
                    let second;
                    if(timeval % 60 < 10){
                        second = '0'+ (timeval % 60)
                    }else {
                        second = timeval % 60
                    }
                    let minutes;
                    if(Math.floor( timeval / 60) < 10){
                        minutes = '0'+ (Math.floor( timeval / 60))
                    }else {
                        minutes = Math.floor( timeval / 60)
                    }
                    return  minutes + ':' + second;
                }else if(9 < timeval < 15){
                    return '00:'+ timeval
                }
            }
        },
        mounted(){
            // console.log(this.musicdata)
            this.getmusiclist()
            this.canvasdone()
            this.showmusicmsg()
        },
        beforeDestroy(){
            clearInterval()
        }
    }
</script>

<style scoped lang="less">
    @import url('./../../common');
    .self-music{
        width: 100%;
        border: @border;
        box-sizing: border-box;
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        .self_music_title{
            width: 100%;
            text-align: center;
            font-weight: bold;
            line-height: 1.8em;
            font-size: 25px;
            border-bottom: @border;
            color:#ccc;
        }
        .music_list{
            box-sizing: border-box;
            width: 30%;
            border-right: @border;
            background-size: cover;
            .music_li{
                box-sizing: border-box;
                display: flex;
                justify-content: space-around;
                color:#ccc;
                line-height: 1.9em;
                border-bottom: @border;
                span{
                    border-right: @border;
                    width: 37%;
                    text-align: left;
                    padding-left: 5px;
                    display: inline-block;
                    i{
                        cursor: pointer;
                        font-style: normal;
                        border: @border;
                        box-sizing: border-box;
                        display: inline-block;
                        padding: 0 5px;
                        line-height: 1.3em;
                        border-radius: 4px;
                        float: right;
                        margin-top: 0.2em;
                        margin-right: 1em;
                        &:hover{
                            box-shadow: @shadow;
                        }
                    }
                }
                span:nth-child(3){
                    border-right: none;
                    width: 50%;
                }
                span:nth-child(1){
                    width: 13%;
                }
            }
        }
        .music_showbox{
            position: relative;
            width: 70%;
            height: 440px;
            #music_canvas{
                width: 100%;
                height: 100%;
            }
            .music_controls{
                position: absolute;
                left: 50%;
                bottom: 10px;
                width: 90%;
                transform: translate(-50%,0);
                border: @border;
                box-sizing: border-box;
                padding: 5px 15px;
                border-radius: 5px;
                padding-top: 37px;
                opacity: 0;
                background-color: rgba(91,91,91,0.65);
                transition: opacity 0.7s;
                &>*{
                    cursor: pointer;
                }
                text-align: center;
                .music_change,.music_play_pause{
                    display: inline-block;
                    color:@musicbtncolor;
                    height: 20px;
                    line-height: 20px;
                    &:hover{
                        box-shadow: @shadow;
                    }
                }
                .music_play_pause{
                    margin: 0 20px;
                }
                .music_jindutiao{
                    height: 2px;
                    border: none;
                    background-color: @musicbtncolor;
                    position: absolute;
                    top: 15px;
                    left: 50%;
                    width: 90%;
                    transform: translate(-50%,0);
                    .music_jdt_point{
                        position: absolute;
                        left: 0;
                        top: 0;
                        height: 100%;
                        background-color: @musiclinebtncolor;
                        box-shadow: @shadow;
                        &:after{
                            content: '';
                            position: absolute;
                            width: 4px;
                            height: 4px;
                            right: -2px;
                            top: -1px;
                            background-color: @musiclinebtncolor;
                            box-shadow: @shadow;
                        }
                    }
                }
                .music_voice{
                    position: absolute;
                    bottom: 5px;
                    right: calc( 5% + 120px + 38px ) ;
                    height: 20px;
                    width: 20px;
                    background-color: @musicbtncolor;
                    border-radius: 50%;
                    .music_voice_line{
                        position: absolute;
                        left: 100%;
                        bottom: 50%;
                        /*transform: translateY(-50%);*/
                        height: 2px;
                        width: 120px;
                        background-color: @musiclinecolor;
                        /*声音音量标记*/
                        .music_voice_point{
                            position: absolute;
                            width: 4px;
                            height: 10px;
                            box-shadow: 0 0 4px @musiclinebtncolor;
                            background: @musiclinebtncolor;
                            top: -4px;
                            transform: translateX(-2px);
                        }
                    }
                    &:hover{
                        box-shadow: @shadow;
                        .music_voice_line{
                            box-shadow: @shadow;
                        }
                    }
                }
                .music_voice_number{
                    position: absolute;
                    bottom: 5px;
                    right: 5%;
                    height: 20px;
                    width: 38px;
                    color: @musicbtncolor;
                    text-align: center;
                    cursor: auto;
                }
                .music_time{
                    position: absolute;
                    bottom: 5px;
                    left: 5%;
                    color: @musicbtncolor;
                    height: 20px;
                    line-height: 20px;
                    cursor: default;
                }
            }
            &:hover{
                .music_controls{
                    opacity: 1;
                }
            }
            audio{
                display: none;
                position: relative;
                top: -200px;
            }
        }
    }
</style>