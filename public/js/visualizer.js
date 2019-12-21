/* elements */
let eCanvas, eFileSelect, eLoading, eContainer
/* global variables */
let AudioContext = window.AudioContext || window.webkitAudioContext
let audioCtx, bufferSourceNode, analyserNode

let canvasCtx, smooth, fft_size, width, height
let file

let visualizer_type = 2
let init_func
let render_func

/* fft_size的前1/16 是人声的范围，后面基本都是泛音 */
/*
得到的频率应该是线性从0HZ到96000HZ/2=48000HZ
而人声的频率大概从80HZ到1200HZ，最高3000HZ，是48000的1/16

https://www.zhihu.com/question/21759927
https://blog.csdn.net/weixin_30646315/article/details/95334479
低频段 （30—150HZ）；
中低频（150—500HZ）；
中高频段（500—5000HZ）；
高频段（5000—20kHZ）。

重低音范围 0HZ->120HZ，占比 1/2400 -> 1/400，用于外圈显示数据，重低音更能显示出音乐的节奏，前41个数字

人声范围 120HZ->1200HZ，占比  1/400 -> 1/40，用于内圈显示数据，41至410个数字共369

TODO: 可以考虑将人声的个数字平均到41个数字与外圈对应
*/
let duration = 0
let offset = 0
let played = 0
let remained = 0
let played_s = ''
let remained_s = ''

// ! for histogram
let bar_wid
let bar_gap
let bar_tot
let calc_mid
let real_need
let hei, gird, gird2

let init_histogram = function () {
    smooth = 0.77
    fft_size = 16384
    real_need = 410
    height = 600
    calc_mid = 300
    bar_wid = 2
    bar_gap = 1

    bar_tot = bar_wid + bar_gap
    width = bar_tot * real_need

    eCanvas.setAttribute('width', width)
    eCanvas.setAttribute('height', height)
    canvasCtx = eCanvas.getContext('2d')
    canvasCtx.lineWidth = 2

    gird = canvasCtx.createLinearGradient(0, 0, height, 0)
    gird.addColorStop(0, '#66ccff')
    gird.addColorStop(1, '#eee')
    gird2 = canvasCtx.createLinearGradient(0, 0, height, 0)
    gird2.addColorStop(0, '#fff')
    gird2.addColorStop(1, '#971d4c')
    hei = 0
}

let render_histogram = function (dataArray) {
    canvasCtx.beginPath()
    for (let i = 0; i < real_need; i++) {
        let value = dataArray[i]
        canvasCtx.fillStyle = gird
        canvasCtx.fillRect(i * bar_tot, calc_mid, bar_wid, -value + 1)
        canvasCtx.fillRect(i * bar_tot, calc_mid - 20 - value, bar_wid, hei)
        canvasCtx.fillStyle = gird2
        canvasCtx.fillRect(i * bar_tot, calc_mid, bar_wid, value + 1)
        canvasCtx.fillRect(i * bar_tot, calc_mid + 20 + value, bar_wid, hei)
    }
}

// ! for circle
let outer_begin
let outer_end
let inner_begin
let inner_end
let cir_r, cir_d, poi_r, poi_d
let cir_x, cir_y
let hold_outer, hold_inner
let outer_cnt
let inner_cnt
let music_name = "Select a file"
let author = "hello"
let style_outter = 'rgba(72, 226, 251, 0.8)'
let style_inner = 'rgba(72, 226, 251, 0.8)'
let up_text1_d = 40
let up_text2_d = 10
let down_text_d1 = 10
let down_text_d2 = 40
let pbar_h = 2
let pbar_h2 = 4
let pbar_w = 200
let style_bar1 = 'rgba(72, 226, 251, 0.8)'
let style_bar2 = 'rgba(72, 226, 251, 1)'
let style_blr = 'rgba(0, 0, 0, 0.2)'
let ext = 4 // 每个外圈柱子都向前向后扩展2个，即1->5
let outer_bar_d = 3

let init_circle = function () {
    smooth = 0.8
    fft_size = 16384
    outer_begin = 5
    outer_end = 40
    inner_begin = 41
    inner_end = 500

    width = 1920
    height = 1080

    cir_r = 400
    cir_d = 250
    poi_d = 250
    cir_x = 960
    cir_y = 540
    poi_r = 2
    hold_outer = 180 //
    hold_inner = 180 //
    outer_cnt = outer_end - outer_begin + 1
    inner_cnt = inner_end - inner_begin + 1
    eContainer.setAttribute('width', width)
    eCanvas.setAttribute('width', width)
    eCanvas.setAttribute('height', height)
    canvasCtx = eCanvas.getContext('2d')
}
/*
let render_outer = function (dataArray) {
    canvasCtx.beginPath()
    canvasCtx.lineWidth = outer_bar_d
    for (let i = outer_begin; i <= outer_end; i++) {
        let value = dataArray[i] // 0~255
        if (value <= hold_outer) continue // 过滤掉音量较小的情况
        value -= hold_outer
        value = value * cir_d / (255 - hold_outer)
        // 从-90°到90°，-1/2 PI ~ 1/2 PI
        let ang = (i - outer_begin + 0.5) * Math.PI / outer_cnt
        let x = Math.sin(ang)
        let y = Math.cos(ang)
        canvasCtx.moveTo(cir_x + x * cir_r, cir_y + y * cir_r)
        canvasCtx.lineTo(cir_x + x * (cir_r + value), cir_y + y * (cir_r + value))
        canvasCtx.moveTo(cir_x - x * cir_r, cir_y + y * cir_r)
        canvasCtx.lineTo(cir_x - x * (cir_r + value), cir_y + y * (cir_r + value))
    }
    canvasCtx.strokeStyle = style_outter
    canvasCtx.closePath()
    canvasCtx.stroke()
}
*/

let render_outer = function (dataArray) {
    canvasCtx.beginPath()
    canvasCtx.lineWidth = outer_bar_d
    let parts = (ext * 2 + 1)
    let part_d = 1 / parts

    for (let i = outer_begin; i <= outer_end; i++) {
        let value = dataArray[i] // 0~255
        if (value <= hold_outer) value = 0 // 过滤掉音量较小的情况
        else {
            value -= hold_outer
            value = value * cir_d / (255 - hold_outer)
        }
        dataArray[i] = value
    }
    for (let i = outer_begin; i <= outer_end; i++) {
        let value = dataArray[i]
        /* 从-90°到90°，-1/2 PI ~ 1/2 PI */
        let ang = (i - outer_begin + 0.5) * Math.PI / outer_cnt
        let x = Math.sin(ang)
        let y = Math.cos(ang)
        canvasCtx.moveTo(cir_x + x * cir_r, cir_y + y * cir_r)
        canvasCtx.lineTo(cir_x + x * (cir_r + value), cir_y + y * (cir_r + value))
        canvasCtx.moveTo(cir_x - x * cir_r, cir_y + y * cir_r)
        canvasCtx.lineTo(cir_x - x * (cir_r + value), cir_y + y * (cir_r + value))

        let pre_delta = ((i == outer_begin) ? 0 : ((dataArray[i - 1] - dataArray[i]) / parts))
        let post_delta = ((i == outer_end) ? 0 : ((dataArray[i + 1] - dataArray[i]) / parts))
        for (let j = 1; j <= ext; j++) {
            //? 是否进行平滑处理？
            // 使用2x作为因子做平滑处理
            // draw pre
            ang = (i - outer_begin + 0.5 - (part_d * j)) * Math.PI / outer_cnt
            x = Math.sin(ang)
            y = Math.cos(ang)
            value = dataArray[i]
            if ((pre_delta > 0 && post_delta > 0) || (pre_delta < 0 && post_delta < 0)) {
                value = value + pre_delta * j * (2 * part_d * j)
            } else {
                value = value + pre_delta * j
            }
            canvasCtx.moveTo(cir_x + x * cir_r, cir_y + y * cir_r)
            canvasCtx.lineTo(cir_x + x * (cir_r + value), cir_y + y * (cir_r + value))
            canvasCtx.moveTo(cir_x - x * cir_r, cir_y + y * cir_r)
            canvasCtx.lineTo(cir_x - x * (cir_r + value), cir_y + y * (cir_r + value))
            // draw post
            ang = (i - outer_begin + 0.5 + (part_d * j)) * Math.PI / outer_cnt
            x = Math.sin(ang)
            y = Math.cos(ang)
            value = dataArray[i]
            if ((pre_delta > 0 && post_delta > 0) || (pre_delta < 0 && post_delta < 0)) {
                value = value + post_delta * j * (2 * part_d * j)
            } else {
                value = value + post_delta * j
            }
            canvasCtx.moveTo(cir_x + x * cir_r, cir_y + y * cir_r)
            canvasCtx.lineTo(cir_x + x * (cir_r + value), cir_y + y * (cir_r + value))
            canvasCtx.moveTo(cir_x - x * cir_r, cir_y + y * cir_r)
            canvasCtx.lineTo(cir_x - x * (cir_r + value), cir_y + y * (cir_r + value))
        }
    }
    canvasCtx.strokeStyle = style_outter
    canvasCtx.closePath()
    canvasCtx.stroke()
}

let render_inner = function (dataArray) {
    canvasCtx.beginPath()
    canvasCtx.lineWidth = 1
    for (let i = inner_begin; i <= inner_end; i++) {
        let value = dataArray[i]
        if (value <= hold_inner) value = 0
        else {
            value -= hold_inner
            value = value * poi_d / (255 - hold_inner)
        }
        let ang = (i - inner_begin + 0.5) * Math.PI / inner_cnt
        let x = Math.sin(ang)
        let y = Math.cos(ang)
        canvasCtx.moveTo(cir_x + x * (cir_r - value), cir_y + y * (cir_r - value))
        canvasCtx.arc(cir_x + x * (cir_r - value), cir_y + y * (cir_r - value), poi_r, 0, 2 * Math.PI)
        canvasCtx.moveTo(cir_x - x * (cir_r - value), cir_y + y * (cir_r - value))
        canvasCtx.arc(cir_x - x * (cir_r - value), cir_y + y * (cir_r - value), poi_r, 0, 2 * Math.PI)
    }
    canvasCtx.closePath()
    canvasCtx.fillStyle = style_inner
    canvasCtx.fill()
}



let render_blr = function () {
    canvasCtx.beginPath()
    canvasCtx.lineWidth = 1

    canvasCtx.moveTo(cir_x, cir_y)
    canvasCtx.arc(cir_x, cir_y, cir_r, 0, 2 * Math.PI)
    canvasCtx.closePath()
    canvasCtx.fillStyle = style_blr
    canvasCtx.fill()
}

let render_font = function () {
    canvasCtx.font = "40px bold 黑体"
    canvasCtx.fillStyle = style_inner
    canvasCtx.textAlign = "center"
    canvasCtx.textBaseline = "bottom"
    canvasCtx.fillText(music_name, cir_x, cir_y - up_text1_d)

    canvasCtx.font = "24px bold 黑体"
    canvasCtx.fillStyle = style_inner
    canvasCtx.textAlign = "center"
    canvasCtx.textBaseline = "bottom"
    canvasCtx.fillText(author, cir_x, cir_y - up_text2_d)

    let timeinfo = formater(played) + ' ' + formater(remained)
    canvasCtx.font = "28px bold 黑体"
    canvasCtx.fillStyle = style_inner
    canvasCtx.textAlign = "center"
    canvasCtx.textBaseline = "top"
    canvasCtx.fillText(timeinfo, cir_x, cir_y + down_text_d1)

    let tag = 'ELAPSED REMAINED'
    canvasCtx.font = "18px bold 黑体"
    canvasCtx.fillStyle = style_inner
    canvasCtx.textAlign = "center"
    canvasCtx.textBaseline = "top"
    canvasCtx.fillText(tag, cir_x, cir_y + down_text_d2)
}

let repeat = function (c, t) {
    let res = ''
    while (t-- > 0) res += c
    return res
}

let render_bar = function () {
    // 先画一条细线，再画一条较粗的线表示进度

    canvasCtx.beginPath()
    canvasCtx.lineWidth = pbar_h
    canvasCtx.moveTo(cir_x - pbar_w, cir_y)
    canvasCtx.lineTo(cir_x + pbar_w, cir_y)
    canvasCtx.closePath()
    canvasCtx.strokeStyle = style_bar1
    canvasCtx.stroke()

    canvasCtx.beginPath()
    canvasCtx.lineWidth = pbar_h2
    let w = remained * pbar_w / duration
    canvasCtx.moveTo(cir_x - w, cir_y)
    canvasCtx.lineTo(cir_x + w, cir_y)
    canvasCtx.closePath()
    canvasCtx.strokeStyle = style_bar2
    canvasCtx.stroke()
}

let render_circle = function (dataArray) {
    render_blr()
    render_font()
    render_outer(dataArray)
    render_inner(dataArray)
    render_bar()
}


// ! others
let loadFile = function (file) {
    let fileReader = new FileReader()
    fileReader.onload = function (e) {
        let filename = file.name
        if (filename.indexOf('.') != -1)
            filename = filename.substring(0, filename.lastIndexOf('.'))
        if (filename.indexOf('-') == -1) {
            music_name = filename.trim()
            author = ''
        } else {
            author = filename.substring(0, filename.indexOf('-')).trim()
            music_name = filename.substring(filename.indexOf('-') + 1, filename.length).trim()
        }
        audioCtx.decodeAudioData(e.target.result, function (buffer) {
            duration = buffer.duration
            console.log('duration:', duration)
            start_play(buffer)
        })
    }
    fileReader.readAsArrayBuffer(file)
}

let start_play = function (buffer) {
    if (bufferSourceNode) bufferSourceNode.stop()
    bufferSourceNode = audioCtx.createBufferSource()
    bufferSourceNode.connect(analyserNode).connect(audioCtx.destination)
    bufferSourceNode.buffer = buffer
    bufferSourceNode.start(0)
    offset = audioCtx.currentTime
    console.log('offset', offset)
    showLoading(false)
    window.requestAnimationFrame(render)
}

let showLoading = function (show) {
    eLoading.className = show ? 'show' : 'hide'
}

if (visualizer_type == 1) {
    init_func = init_histogram
    render_func = render_histogram
} else if (visualizer_type == 2) {
    init_func = init_circle
    render_func = render_circle
}

let formater = function (s) {
    let time = Math.floor(s)
    let hour = Math.floor(time / 3600)
    let hourStr = hour > 9 ? hour : ('0' + hour)
    time -= hour * 3600
    let minute = Math.floor(time / 60)
    let minuteStr = minute > 9 ? minute : ('0' + minute)
    time -= minute * 60
    let secondStr = time > 9 ? time : ('0' + time)
    let res = hourStr + ':' + minuteStr + ':' + secondStr
    return res
}


let render = function () {
    canvasCtx.clearRect(0, 0, eCanvas.width, eCanvas.height)
    let dataArray = new Uint8Array(analyserNode.frequencyBinCount)
    let over = false
    analyserNode.getByteFrequencyData(dataArray)
    played = audioCtx.currentTime - offset
    if (played > duration) {
        played = duration
        over = true
    }
    remained = duration - played
    render_func(dataArray)
    if (!over)
        window.requestAnimationFrame(render)
}

window.onload = function () {
    eCanvas = document.getElementById('canvas')
    eFileSelect = document.getElementById('file_select')
    eLoading = document.getElementById('loading')
    eContainer = document.getElementById('container')
    /* init canvas and configs */
    init_func()
    /* init audio */
    audioCtx = new AudioContext()
    analyserNode = audioCtx.createAnalyser()
    analyserNode.fftSize = fft_size * 2
    analyserNode.smoothingTimeConstant = smooth
    /* init file chooser */
    eFileSelect.onchange = function () {
        if (eFileSelect.files[0]) {
            file = eFileSelect.files[0]
            showLoading(true)
            loadFile(file)
        }
    }
}