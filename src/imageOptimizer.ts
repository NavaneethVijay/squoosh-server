import { Request, Response } from 'express'
import { mediaType } from '@hapi/accept'
import { getOrientation, Orientation } from 'get-orientation'
import { processBuffer, Operation } from './squoosh/main'
import { IncomingMessage, ServerResponse } from 'http'
import fetch from 'node-fetch';

//const AVIF = 'image/avif'
const WEBP = 'image/webp'
const PNG = 'image/png'
const JPEG = 'image/jpeg'
const GIF = 'image/gif'
const SVG = 'image/svg+xml'
const CACHE_VERSION = 2
const MODERN_TYPES = [/* AVIF, */ WEBP]
const ANIMATABLE_TYPES = [WEBP, PNG, GIF]
const VECTOR_TYPES = [SVG]


/**
 *  Main function for image optimization
 * @param req 
 * @param res 
 * @returns 
 */
export async function imageOptimizer(
    req: Request,
    res: Response
  ) {

    const { headers } = req
    let { url, w, q } = req.query

    url = String(url);
    w = String(w);
    q = String(q);

    const mimeType = getSupportedMimeType(MODERN_TYPES, headers.accept)

    let href:string;

    if (!url) {
        res.statusCode = 400
        res.end('"url" parameter is required')
        return { finished: true }
      } else if (Array.isArray(url)) {
        res.statusCode = 400
        res.end('"url" parameter cannot be an array')
        return { finished: true }
      }

      let isAbsolute: boolean;

      href = url

      // CHeck for url validation


      if (!w) {
        res.statusCode = 400
        res.end('"w" parameter (width) is required')
        return { finished: true }
      } else if (Array.isArray(w)) {
        res.statusCode = 400
        res.end('"w" parameter (width) cannot be an array')
        return { finished: true }
      }
    
      if (!q) {
        res.statusCode = 400
        res.end('"q" parameter (quality) is required')
        return { finished: true }
      } else if (Array.isArray(q)) {
        res.statusCode = 400
        res.end('"q" parameter (quality) cannot be an array')
        return { finished: true }
      }


      const width = parseInt(w, 10)

      if (!width || isNaN(width)) {
        res.statusCode = 400
        res.end('"w" parameter (width) must be a number greater than 0')
        return { finished: true }
      }

      const quality = parseInt(q)

      if (isNaN(quality) || quality < 1 || quality > 100) {
        res.statusCode = 400
        res.end('"q" parameter (quality) must be a number between 1 and 100')
        return { finished: true }
      }


      let upstreamBuffer: Buffer
      let upstreamType: string | null


      const upstreamRes = await fetch(href)

      res.statusCode = upstreamRes.status
      upstreamBuffer = Buffer.from(await upstreamRes.arrayBuffer())
      upstreamType = upstreamRes.headers.get('Content-Type')


      let contentType: string


      if (mimeType) {
        contentType = mimeType
      } else if (
        upstreamType?.startsWith('image/') 
      ) {
          contentType = upstreamType
  
      } else {
        contentType = JPEG
      }


      let optimizedBuffer: Buffer | undefined

      const orientation = await getOrientation(upstreamBuffer)
  
      const operations: Operation[] = []
  
      if (orientation === Orientation.RIGHT_TOP) {
        operations.push({ type: 'rotate', numRotations: 1 })
      } else if (orientation === Orientation.BOTTOM_RIGHT) {
        operations.push({ type: 'rotate', numRotations: 2 })
      } else if (orientation === Orientation.LEFT_BOTTOM) {
        operations.push({ type: 'rotate', numRotations: 3 })
      }
  
      operations.push({ type: 'resize', width })

      //Converting the response to the required image type
      if (contentType === WEBP) {
        optimizedBuffer = await processBuffer(
          upstreamBuffer,
          operations,
          'webp',
          quality
        )
      } else if (contentType === PNG) {
        optimizedBuffer = await processBuffer(
          upstreamBuffer,
          operations,
          'png',
          quality
        )
      } else if (contentType === JPEG) {
        optimizedBuffer = await processBuffer(
          upstreamBuffer,
          operations,
          'jpeg',
          quality
        )
      }

      if (optimizedBuffer) {
        sendResponse(req, res, contentType, optimizedBuffer)
      } else {
        throw new Error('Unable to optimize buffer')
      }
  }

function getSupportedMimeType(options: string[], accept = ''): string {
    const mimeType = mediaType(accept, options)
    return accept.includes(mimeType) ? mimeType : ''
}

function sendResponse(
    req: IncomingMessage,
    res: ServerResponse,
    contentType: string | null,
    buffer: Buffer
  ) {

    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate')
    if (contentType) {
      res.setHeader('Content-Type', contentType)
    }
    res.end(buffer)
  }