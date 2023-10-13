const app = require("express")()
const cors = require("cors")
// const http = require("http")
// const { Server } = require("socket.io")
const ffmpeg = require("fluent-ffmpeg")
const pathToFfmpeg = require("ffmpeg-static")
// const fs = require("fs")
// const tada = require("path").dirname("./media/tada.mp4")
// const path = require("path")

// var streamFs = fs.createWriteStream("stream.m3u8")

ffmpeg.setFfmpegPath(pathToFfmpeg)

// const server = http.createServer(app)

// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST"],
//   },
// })

// var uri = "rtsp://freja.hiof.no:1935/rtplive/definst/hessdalen03.stream",

// io.on("connection", function (socket) {
//   console.log(`User connected: ${socket.id}`)
//   var pipeStream = function (data) {
//     socket.emit("data", data.toString("base64"))
//   }

//   socket.on("send_rstp", function (data) {
//     const StreamFolder = path.join(__dirname, `/stream/`)
//     const filePath = path.join(StreamFolder, "stream.m3u8")
//     var stream = ffmpeg(data.rstp)
//     stream
//       .outputOptions([
//         "-hls_time 10",
//         "-hls_list_size 6",
//         "-hls_flags delete_segments",
//         "-hls_segment_filename stream%03d.ts",
//       ])
//       .output((output) => {})
//       .on("start", (data) => {
//         console.log("stream started", data)
//         // socket.emit("data", )
//       })
//       .on("error", (error) => {
//         console.log(error, "juju")
//       })
//       .run()
//   })

//   // stream.on("data", pipeStream)
//   socket.on("disconnect", function () {
//     // stream.removeListener("data", pipeStream)
//   })
// })

app.use(
  cors({
    origin: "*",
  })
)

app.get("/", function (req, res) {
  var range = req.headers.range
  if (range) {
    var parts = range.replace(/bytes=/, "").split("-")
    var partialstart = parts[0]
    var partialend = parts[1]
    var start = parseInt(partialstart, 10)
    var end = partialend ? parseInt(partialend, 10) : 1
    var chunksize = end - start + 1

    res.writeHead(206, {
      "Content-Range  ": "bytes " + start + "-" + end + "/",
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4",
    })
  } else {
    const head = {
      // "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    }

    res.writeHead(200, head)
  }

  var stream = ffmpeg(req.query.rstp)

  stream
    .videoCodec("libx264")
    .withAudioCodec("aac")
    .format("mp4")
    .videoFilters({
      filter: "drawtext",
      options: {
        fontsize: 20,
        fontfile: "public/fonts/Roboto-Black.ttf",
        text: "USERNAME",
        x: 10,
        y: 10,
        fontcolor: "red",
      },
    })
    .outputOptions(
      //   [
      //   "-hls_time 10",
      //   "-hls_list_size 6",
      //   "-hls_flags delete_segments",
      //   "-hls_segment_filename stream%03d.ts",
      //   // "-movflags frag_keyframe + empty_moov",
      // ]
      [
        "-frag_duration 100",
        "-movflags frag_keyframe+faststart",
        "-movflags frag_keyframe+empty_moov",
        "-pix_fmt yuv420p",
      ]
    )
    .output(res, { end: true })
    .output("outputfile.mp4")
    .on("start", (data) => {
      console.log("stream started", data)
      // socket.emit("data", )
    })
    .on("error", (error) => {
      console.log(error, "juju")
    })
    .run()
})

app.listen(3001, () => {
  console.log("SERVER RUNNING")
})
