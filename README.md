# Node server for image optimization using Squoosh

This project aims to provide image optimization for your projects. It is heavily inspried by [Next.js](https://github.com/vercel/next.js) 
Under the hood it uses [Squoosh](https://github.com/GoogleChromeLabs/squoosh) from [GoogleChromeLabs](https://github.com/GoogleChromeLabs/squoosh)
All the details of the codes are available [here](https://github.com/GoogleChromeLabs/squoosh/tree/dev/codecs)


# How it works

We proxy the images by passing the urls to our server, download the image and use Squoosh Webassembly files to do the image optimization and resize.

Available list of operations 
 - jpeg conversion
 - png conversion
 - resizing
 - rotation
 - webp conversion

## How to use

Install dependencies

    npm install
    
Build the files using 

    npm run build

Start your server 

    npm run start

Your server will be running in [http://localhost:9000/](http://localhost:9000/) by default. 

Visit `http://localhost:9000/_nex/image?url=<image_url>&q=<image_quality>&w=<image_width>`
by default all the resources are returned with `Content-Type: image/webp`

## Available  parameters

### Quality (q)
The quality of the optimized image, an integer between `1` and `100` where `100` is the best quality.
### Image source (url)
The actual url of the image which needs to be optimized
### Image size (w)
Width of the final image that is required.

## What else is in progress ?

 - Implementing cache system for serving already downloaded and optimized images.
 - Handle concurrent image request for same resource.

