import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { stitchHandler } from './stitch'
import { checkFFmpeg } from './ffmpeg'

dotenv.config()

const app = express()
const PORT = parseInt(process.env.PORT || '8080', 10)

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key'],
}))
app.options('*', cors())
app.use(express.json({ limit: '50mb' }))

app.get('/health', async (_req, res) => {
  const ffmpegOk = await checkFFmpeg()
  res.json({ status: 'ok', ffmpeg: ffmpegOk })
})

app.post('/stitch', stitchHandler)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`VMS FFmpeg Worker listening on port ${PORT}`)
})
