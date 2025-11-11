const sharp = require('sharp');
const aws = require('aws-sdk');
const s3 = new aws.S3();
// const FfmpegCommand = require('fluent-ffmpeg');
// const { Writable } = require('stream');
// const fs = require('fs');
// const path = require('path');
// const fsp = require('fs/promises');

/**
 * 
 * @param {*} imagesFetched 
 * @param {*} folder One of the folders in the bucket
 * @param {*} bucket The bucket name
 * @param {*} type thumbnails or slider
 */
const createResizedImages = async (imagesFetched, folder, bucket, type) => {
    const imageFetchedPromises = [];
    for (const imageContent of imagesFetched.Contents) {
        console.log('========= imageContent', imageContent);
        const { Key } = imageContent;
        let imageName = Key.split('/').pop();
        const imageKey = `public/${folder}/${type}/${imageName}`;

        let imageFetched;
        try {
            console.log('^^^^^^^^^ Going to fetch ', imageKey);
            imageFetched = await s3.getObject({
                Bucket: bucket,
                Key: imageKey
            }).promise();
            console.log('%%%%%%%%%%%%% imageFetched : ', imageFetched);
            imageFetchedPromises.push(imageFetched);
        } catch (error) {
            console.error('Error fetching image:', error);
        }

        if (!imageFetched) {
            console.log(`GOING TO CREATE ${type} image !`);

            const originalImageFetched = await s3.getObject({
                Bucket: bucket,
                Key
            }).promise();

            // IMAGES
            const sharpedImage = await sharp(originalImageFetched.Body);
            const metadata = await sharpedImage.metadata();

            let resizedImage;
            const size = type === 'thumbnails' ? 96 : 1920;
            if (type === 'thumbnails') {
                resizedImage = await sharpedImage.resize({
                    width: size,
                    height: size,
                    fit: 'cover',
                }).withMetadata().toBuffer();
            } else {
                if (metadata.width > metadata.height) {
                    // landscape
                    // thumbnail width is 220 and slider width is 1920
                    resizedImage = await sharpedImage.resize({
                        width: size,
                    }).withMetadata().toBuffer();
                } else {
                    // portrait
                    // thumbnail height is 220 and slider height is 1920
                    resizedImage = await sharpedImage.resize({
                        height: size,
                    }).withMetadata().toBuffer();
                }
            }

            console.log(`PUT ${type} image `);
            return await s3.putObject({
                Bucket: bucket,
                Key: `public/${folder}/${type}/${imageName}`,
                Body: resizedImage,
            }).promise();

        }
    };
    await Promise.all(imageFetchedPromises);
};

/**
 * 
 * @param {*} videosFetched 
 * @param {*} folder One of the folders in the bucket
 * @param {*} bucket The bucket name
 */
// const createVideoThumbnail = async (videosFetched, folder, bucket) => {
//     const folderType = 'thumbnails';
//     const videoFetchedPromises = [];
//     for (const videoContent of videosFetched.Contents) {
//         console.log('========= videoContent', videoContent);
//         const { Key } = videoContent;
//         if (Key.endsWith('/')) {
//             console.log('######### Skipping folder ', Key);
//             continue; // Skip if it's a folder or a video for slider
//         }

//         const videoName = Key.split('/').pop();
//         const videoThumbnailName = videoName.replace('.mp4', '.png');
//         const videoThumbnailKey = `public/${folder}/${folderType}/${videoThumbnailName}`;

//         let videoThumbnailFetched;
//         try {
//             console.log('^^^^^^^^^ Going to fetch ', videoThumbnailKey);
//             videoThumbnailFetched = await s3.getObject({
//                 Bucket: bucket,
//                 Key: videoThumbnailKey
//             }).promise();
//             console.log('%%%%%%%%%%%%% videoThumbnailFetched : ', videoThumbnailFetched);
//             videoFetchedPromises.push(videoThumbnailFetched);
//         } catch (error) {
//             console.error('Error fetching video:', error);
//         }

//         if (!videoThumbnailFetched) {
//             console.log(`GOING TO CREATE ${folderType} thumbnail!`);

//             const originalVideoFetched = await s3.getObject({
//                 Bucket: bucket,
//                 Key
//             }).promise();

//             // VIDEOS
//             console.log('######### Creating video thumbnail for ', Key);
//             console.log('######### originalVideoFetched : ', originalVideoFetched);
//             let screenshotBuffer = Buffer.from([]); // Initialize an empty buffer

//             const writableStream = new Writable({
//                 write(chunk, encoding, callback) {
//                     screenshotBuffer = Buffer.concat([screenshotBuffer, chunk]);
//                     callback();
//                 }
//             });

//             async function writeBufferToFile(filePath, bufferData) {
//                 try {
//                     await fsp.writeFile(filePath, bufferData);
//                     console.log('Buffer successfully written to file (promise-based)!', filePath);
//                 } catch (err) {
//                     console.error('Error writing file:', err);
//                 }
//             }
//             await writeBufferToFile(path.join('/tmp', videoName), originalVideoFetched.Body);

//             console.log('######### Starting to create video thumbnail for ', Key);
//             const ffmpeg = new FfmpegCommand();
//             ffmpeg(path.join('/tmp', videoName))
//                 .seekInput('00:00:01') // Seek to 1 seconds into the video
//                 .frames(1) // Extract only one frame
//                 .outputOptions('-f png') // Output as an image format (e.g., JPEG, PNG)
//                 .outputOptions('-vframes 1') // Ensure only one frame is processed
//                 .outputOptions('-c:v mjpeg') // Specify the video codec for the output image (e.g., Motion JPEG)
//                 .outputOptions('-q:v 2') // Set the quality (for JPEG, 1-31, lower is better)
//                 .noAudio() // No audio output needed for a screenshot
//                 .toFormat('png') // Output format (e.g., 'mjpeg' or 'png')
//                 .pipe(writableStream) // Pipe the output to the writable stream
//                 .on('end', () => {
//                     // The screenshotBuffer now contains the image data
//                     console.log('Screenshot captured in memory:', screenshotBuffer);
//                     // You can now process or save the buffer as needed
//                 })
//                 .on('error', (err) => {
//                     console.error('An error occurred: ' + err.message);
//                 });

//             console.log('######### Creating video thumbnail for ', Key);
//             console.log(`PUT ${folderType} image `);
//             return await s3.putObject({
//                 Bucket: bucket,
//                 Key: `public/${folder}/${folderType}/${videoThumbnailName}`,
//                 Body: screenshotBuffer,
//             }).promise();
//         };
//         await Promise.all(videoFetchedPromises);
//     };
// }
/**
 * 
 * @param {*} videosFetched 
 * @param {*} folder One of the folders in the bucket
 * @param {*} bucket The bucket name
 */
const createDummyVideoThumbnail = async (videosFetched, folder, bucket) => {
    const folderType = 'thumbnails';
    const videoFetchedPromises = [];
    for (const videoContent of videosFetched.Contents) {
        console.log('========= videoContent', videoContent);
        const { Key } = videoContent;
        if (Key.endsWith('/')) {
            console.log('######### Skipping folder ', Key);
            continue; // Skip if it's a folder or a video for slider
        }

        const videoName = Key.split('/').pop();
        const videoThumbnailName = videoName.replace('.mp4', '-video.png');
        const videoThumbnailKey = `public/${folder}/${folderType}/${videoThumbnailName}`;

        let videoThumbnailFetched;
        try {
            console.log('^^^^^^^^^ Going to fetch ', videoThumbnailKey);
            videoThumbnailFetched = await s3.getObject({
                Bucket: bucket,
                Key: videoThumbnailKey
            }).promise();
            console.log('%%%%%%%%%%%%% videoThumbnailFetched : ', videoThumbnailFetched);
            videoFetchedPromises.push(videoThumbnailFetched);
        } catch (error) {
            console.error('Error fetching video:', error);
        }

        if (!videoThumbnailFetched) {
            console.log(`GOING TO CREATE ${folderType} video thumbnail!`);

            // const originalVideoFetched = await s3.getObject({
            //     Bucket: bucket,
            //     Key
            // }).promise();

            // // VIDEOS
            // console.log('######### Creating video thumbnail for ', Key);
            // console.log('######### originalVideoFetched : ', originalVideoFetched);

            const size = 96;
            const dummyVideoThumbnailImage = await sharp({
                create: {
                    width: size,
                    height: size,
                    channels: 3,
                    background: { r: 232, g: 232, b: 232, } // Gray background
                }
            }).composite([{
                input: Buffer.from(
                    `<svg width="${size}" height="${size}">
                        <rect x="0" y="0" width="${size}" height="${size}" fill="#f2f2f2"/>
                        <text x="50%" y="70%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="10" fill="black">${videoThumbnailName}</text>
                        <polygon transform="translate(34, 20)" class="play-btn__svg" points="9.33 6.69 9.33 19.39 19.3 13.04 9.33 6.69"/>
                        <path transform="translate(34, 20)" class="play-btn__svg" d="M26,13A13,13,0,1,1,13,0,13,13,0,0,1,26,13ZM13,2.18A10.89,10.89,0,1,0,23.84,13.06,10.89,10.89,0,0,0,13,2.18Z"/>
                    </svg>`
                ),
                gravity: 'center'
            }]).png().toBuffer();

            console.log(`Dummy image "${videoThumbnailName}" generated successfully at ${dummyVideoThumbnailImage}`);

            console.log(`PUT ${folderType} image ${videoThumbnailName}`);
            return await s3.putObject({
                Bucket: bucket,
                Key: `public/${folder}/${folderType}/${videoThumbnailName}`,
                Body: dummyVideoThumbnailImage,
            }).promise();
        }
    }
    await Promise.all(videoFetchedPromises);
}

/**
* @param {*} videosFetched 
* @param {*} folder One of the folders in the bucket
* @param {*} bucket The bucket name
*/
const putVideoSlider = async (videosFetched, folder, bucket) => {
    const folderType = 'slider';
    const videoFetchedPromises = [];
    for (const videoContent of videosFetched.Contents) {
        console.log('========= videoContent', videoContent);
        const { Key } = videoContent;
        if (Key.endsWith('/')) {
            console.log('######### Skipping folder ', Key);
            continue; // Skip if it's a folder or a video for slider
        }

        const videoName = Key.split('/').pop();
        const videoSliderKey = `public/${folder}/${folderType}/${videoName}`;

        let videoSliderFetched;
        try {
            console.log('^^^^^^^^^ Going to fetch ', videoSliderKey);
            videoSliderFetched = await s3.getObject({
                Bucket: bucket,
                Key: videoSliderKey
            }).promise();
            console.log('%%%%%%%%%%%%% videoSliderFetched : ', videoSliderFetched);
            videoFetchedPromises.push(videoSliderFetched);
        } catch (error) {
            console.error('Error fetching video:', error);
        }

        if (!videoSliderFetched) {
            console.log(`GOING TO CREATE ${folderType} video slider!`);

            const originalVideoFetched = await s3.getObject({
                Bucket: bucket,
                Key
            }).promise();

            console.log(`PUT ${folderType} slider ${videoSliderKey}`);
            return await s3.putObject({
                Bucket: bucket,
                Key: videoSliderKey,
                Body: originalVideoFetched.Body,
            }).promise();
        }
    }
    await Promise.all(videoFetchedPromises);
}

exports.handler = async (event, context) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    console.log(`CONTEXT: ${JSON.stringify(context)}`);

    if (event.Records) {
        const BUCKET = event.Records[0].s3.bucket.name;
        const KEY = event.Records[0].s3.object.key.split('/')[1];
        const folder = KEY.replace("public/", "").split('/')[0];

        // Fetching all images/videos in the folder
        const objectFetched = await s3.listObjectsV2({
            Bucket: BUCKET,
            Prefix: `public/${folder}/`
        }).promise();

        console.log('######### objectFetched : ', objectFetched);

        if (event.Records[0].eventName === 'ObjectCreated:CompleteMultipartUpload' && event.Records[0].s3.object.key.endsWith('.mp4')) {
            // Handling video thumbnails
            await createDummyVideoThumbnail(objectFetched, folder, BUCKET);

            // Handling video slider
            // await putVideoSlider(objectFetched, folder, BUCKET);
        } else if (event.Records[0].eventName === 'ObjectCreated:Put') {
            // Handling thumbnails
            await createResizedImages(objectFetched, folder, BUCKET, 'thumbnails');

            // Handling slider images
            await createResizedImages(objectFetched, folder, BUCKET, 'slider');
        }

    }

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'max-age=31536000',
            'Access-Control-Allow-Origin': '*', // CORS header
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify('Resized Images Completed'),
    };
};
