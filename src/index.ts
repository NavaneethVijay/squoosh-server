import express, { Application, Request, Response } from 'express'
import { imageOptimizer } from './imageOptimizer'

const app: Application = express()

const port: number = 9000

/**
 * Predifined route for receiving the image props
 */
app.get('/_nex/image', async (req: Request, res: Response) => {
  await imageOptimizer(req, res)
})

app.listen(port, function () {
    console.log(`⚡️[server]: Server is running at http://localhost:${port} !`)
})