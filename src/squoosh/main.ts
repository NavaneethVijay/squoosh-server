import Worker from 'jest-worker'
import * as path from 'path'
import { cpus } from 'os'

type RotateOperation = {
  type: 'rotate'
  numRotations: number
}
type ResizeOperation = {
  type: 'resize'
  width: number
}

export function execOnce<T extends (...args: any[]) => ReturnType<T>>(
  fn: T
): T {
  let used = false
  let result: ReturnType<T>

  return ((...args: any[]) => {
    if (!used) {
      used = true
      result = fn(...args)
    }
    return result
  }) as T
}



export type Operation = RotateOperation | ResizeOperation
export type Encoding = 'jpeg' | 'png' | 'webp'

const getWorker = execOnce(
  () =>
    new Worker(path.resolve(__dirname, 'impl'), {
      enableWorkerThreads: true,
      // There will be at most 6 workers needed since each worker will take
      // at least 1 operation type.
      numWorkers: Math.max(1, Math.min(cpus().length - 1, 6)),
      computeWorkerKey: (method) => method,
    })
)

export async function processBuffer(
  buffer: Buffer,
  operations: Operation[],
  encoding: Encoding,
  quality: number
): Promise<Buffer> {
  const worker: typeof import('./impl') = getWorker() as any

  let imageData = await worker.decodeBuffer(buffer)
  for (const operation of operations) {
    if (operation.type === 'rotate') {
      imageData = await worker.rotate(imageData, operation.numRotations)
    } else if (operation.type === 'resize') {
      if (imageData.width && imageData.width > operation.width) {
        imageData = await worker.resize(imageData, operation.width)
      }
    }
  }

  switch (encoding) {
    case 'jpeg':
      return Buffer.from(await worker.encodeJpeg(imageData, { quality }))
    case 'webp':
      return Buffer.from(await worker.encodeWebp(imageData, { quality }))
    case 'png':
      return Buffer.from(await worker.encodePng(imageData))
    default:
      throw Error(`Unsupported encoding format`)
  }
}
