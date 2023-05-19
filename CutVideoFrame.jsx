import React, {useState, useEffect, useRef} from "react";
import "./CutVideoFrame.scss"

const videoFile = require('../../assets/imgs/head_video.webm')
const log = console.log
let changeFlag = false
export function UseCutVideoFrame() {
    const videoRef = useRef(null)
    const [imgArr, setImgArr] = useState([])
    const [btnText,setBtnText] = useState('点击取帧')
    const [frameRate,setFrameRate] = useState(24)

    useEffect(() => {
        log("init")
    }, [])
    useEffect(() => {
        // videoRef && console.log(videoRef)
    }, [videoRef])
    const getFrame = () => {
        if(changeFlag)return
        if(!frameRate || frameRate<1 || frameRate > 60){
            alert("请输入1-60帧率")
            return
        }
        changeFlag = true
        setImgArr([])
        setBtnText('正在缓存,请稍等')
        bufferVideoFrames(videoFile, frameRate).then((res) => {
            setImgArr(res)
            setBtnText('缓存已完成')
            setTimeout(()=>{
                changeFlag = false
                setBtnText('点击再次取帧')
            },2000)
        }).catch((err) => {
            log(err)
        })
    }
    // 对视频帧进行缓存
    const bufferVideoFrames = async (videoFile, frameTotal = 24) => {
        return new Promise(async (resolve) => {
            // 获取视频标签节点
            let videoNode = document.createElement("video");

            let seeked;
            // 监听设置视频播放位置动作结束
            videoNode.addEventListener('seeked', async function () {
                if (seeked) seeked();
            });
            // 当浏览器已加载视频的当前帧时触发
            videoNode.addEventListener('loadeddata', async function () {
                // 新建一个canvas画布承载当前帧视频
                let canvas = document.createElement('canvas');
                let context = canvas.getContext('2d');
                // 尺寸根据视频宽高设置
                let [w, h] = [videoNode.videoWidth, videoNode.videoHeight]
                canvas.width = w;
                canvas.height = h;

                let frames = [];// 存放取出的帧
                let interval = 1 / frameTotal;// 计算每帧时长，例如60帧就是1/60，每帧16.6ms
                let currentTime = 0;// 起始时间
                let duration = videoNode.duration;// 视频总时长

                while (currentTime < duration) {
                    // 不断按每帧时长，移动播放位置，直到视频结束
                    videoNode.currentTime = currentTime;
                    // 关键，通过await等待视频移动完成后，才执行后续帧的保存，通过seeked事件监听
                    // eslint-disable-next-line no-loop-func
                    await new Promise(r => seeked = r);
                    // 保存帧到canvas的context
                    context.drawImage(videoNode, 0, 0, w, h);
                    // 将canvas转为base64的图片格式
                    let base64ImageData = canvas.toDataURL();
                    // 存入结果数组
                    frames.push(base64ImageData);
                    // 移动视频进度
                    currentTime += interval;
                }
                resolve(frames);
            });
            // 一步会触发加载完成事件监听
            videoNode.src = videoFile;

        });
    }
    const imgNode = (arr) => {
        return arr.length ? imgArr.map((item, index) => {
                return (
                    <div className={"single-frame-box"} key={index}>
                        <img className={'frameImg'} src={item} alt={`frame${index}`}/>
                        <span>第{index+1}帧</span>
                    </div>
                )
            })
            : null
    }
    return (
        <div className={"video-box"}>
            <h1>视频帧缓存</h1>
            <video ref={videoRef} className={"video"} preload="auto" loop autoPlay muted={true} src={videoFile}/>
            <div  className={"video-input-box"}>
                <input type="number" placeholder={"输入帧率"} value={frameRate}  onChange={event => setFrameRate(Number(event.target.value))}/>
                <button onClick={getFrame}>{btnText}</button>
            </div>
            <p className={"video-tips"}>帧率越高，每一帧之间更接近，过渡更平滑，但是如果原视频只有30帧，那么按60帧取帧就会有一半的帧是重复的，并无意义</p>
            <p className={"video-tips"}>可用于抽帧合成、视频截图、动画进度控制（Apple官网）</p>
            <p className={"video-tips"}>实现说明见我的博客<a className={"video-tips"} href="http://blog.jsfinder.com/archives/39.html">《js实现对视频按帧缓存》</a></p>
            <div className={"frame-box"}>
                {imgNode(imgArr)}
            </div>
        </div>
    )
}
