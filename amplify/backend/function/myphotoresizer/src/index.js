

const sharp = require('sharp');
const aws = require('aws-sdk');
const s3 = new aws.S3();

const BUCKET = 'myphotosapp1676e2a1bb674832ad8d1b3ffade4cb8803ad-dev';

// Contents
// {
//     Key: 'public/photos_2015/IMG_20150101_214844-edited.jpg',
//     LastModified: 2025-03-16T19:39:37.000Z,
//     ETag: '"c3c75d91393cde7d58f3b4e0f653a354"',
//     ChecksumAlgorithm: [ 'CRC64NVME' ],
//     Size: 1839798,
//     StorageClass: 'STANDARD'
//   },
const createThumbnails = async (imagesFetched, route) => {
    imagesFetched.Contents.map(async (imageContent) => {
        const { Key } = imageContent;
        if (Key.endsWith('/')) {
            return;
        }
        const imageName = Key.split('/').pop();
        console.log('imageName : ', imageName);

        const thumbnailKey = `public/${route}/thumbnails/${imageName}`;
        console.log('thumbnailKey : ', thumbnailKey);

        let thumbnailFetched;
        try {
            thumbnailFetched = await s3.getObject({
                Bucket: BUCKET,
                Key: thumbnailKey
            }).promise();
            console.log('thumbnailFetched : ', thumbnailFetched);
        } catch (error) {
            console.error('Error creating thumbnail:', error);
        }

        if (!thumbnailFetched) {
            console.log('GOING TO CREATE thumbnail : ');

            const imageFetched = await s3.getObject({
                Bucket: BUCKET,
                Key
            }).promise();

            const sharpedImage = await sharp(imageFetched.Body);
            const metadata = await sharpedImage.metadata();

            let resizedImageThumbnail
            if (metadata.width > metadata.height) {
                // landscape
                // thumbnail width is 220
                resizedImageThumbnail = await sharpedImage.resize({
                    width: 220,
                }).withMetadata().toBuffer();
            } else {
                // portrait
                // thumbnail height is 260
                resizedImageThumbnail = await sharpedImage.resize({
                    height: 220,
                }).withMetadata().toBuffer();
            }

            console.log('PUT thumbnail : ');
            return await s3.putObject({
                Bucket: BUCKET,
                Key: `public/${route}/thumbnails/${imageName}`,
                Body: resizedImageThumbnail,
            }).promise();
        }
    });
};

exports.handler = async (event, context) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    console.log(`CONTEXT: ${JSON.stringify(context)}`);

    try {
        // console.time('############# Resizing Images');
        // const { route } = event.queryStringParameters;
        // const imagesFetched = await s3.listObjectsV2({
        //     Bucket: BUCKET,
        //     Prefix: `public/${route}/`
        // }).promise();
        // console.log('FETCHED imagesFetched.Contents : ', imagesFetched.Contents);

        // createThumbnails(imagesFetched, route);

        // // {
        // //     Key: 'public/photos_2015/IMG_20150101_214844-edited.jpg',
        // //     LastModified: 2025-03-16T19:39:37.000Z,
        // //     ETag: '"c3c75d91393cde7d58f3b4e0f653a354"',
        // //     ChecksumAlgorithm: [ 'CRC64NVME' ],
        // //     Size: 1839798,
        // //     StorageClass: 'STANDARD'
        // //   },
        // const resizedImagesPromises = imagesFetched.Contents.map(async (imageContent) => {
        //     const { Key } = imageContent;
        //     if (Key.endsWith('/')) {
        //         return;
        //     }
        //     const imageFetched = await s3.getObject({
        //         Bucket: BUCKET,
        //         Key
        //     }).promise();

        //     const sharpedImage = await sharp(imageFetched.Body);
        //     const metadata = await sharpedImage.metadata();

        //     let resizedImage = sharpedImage;
        //     if (metadata.width > 1920) {
        //         resizedImage = await sharpedImage.resize({
        //             width: 1920
        //         }).toBuffer();
        //     }
        //     return resizedImage.toString('base64');
        // }).filter(img => img !== undefined);

        // const resizedImagesResults = await Promise.allSettled(resizedImagesPromises);

        // const successfulResizedImages = resizedImagesResults
        //     .filter(input => input.status === 'fulfilled')
        //     .map(result => result.value);
        // console.log('successfulResizedImages : ', successfulResizedImages);

        // console.timeEnd('############# Resizing Images');
        // return {
        //     statusCode: 200,
        //     headers: {
        //         'Content-Type': 'image/jpeg',
        //         'Cache-Control': 'max-age=31536000',
        //         'Access-Control-Allow-Origin': '*', // CORS header
        //         'Access-Control-Allow-Methods': 'GET, OPTIONS',
        //         'Access-Control-Allow-Headers': 'Content-Type',
        //     },
        //     body: JSON.stringify(successfulResizedImages),
        //     isBase64Encoded: true
        // };

        // 
        const { route } = event.queryStringParameters;

        // Handling thumbnails
        const imagesFetched = await s3.listObjectsV2({
            Bucket: BUCKET,
            Prefix: `public/${route}/`
        }).promise();
        const thumbnailsCreation = await createThumbnails(imagesFetched, route);
        console.log('thumbnailsCreation : ', thumbnailsCreation);

        // Fetching thumbnails
        const thumbnailsFetched = await s3.listObjectsV2({
            Bucket: BUCKET,
            Prefix: `public/${route}/thumbnails/`
        }).promise();

        const thumbnailsPromises = thumbnailsFetched.Contents.map(async (imageContent) => {
            const { Key } = imageContent;
            if (Key.endsWith('/')) {
                return;
            }
            const thumbnailFetched = await s3.getObject({
                Bucket: BUCKET,
                Key
            }).promise();
            return thumbnailFetched.Body.toString('base64');
        });
        const thumbnailsResults = await Promise.allSettled(thumbnailsPromises);
        const successfulThumbnails = thumbnailsResults
            .filter(input => input.status === 'fulfilled')
            .map(result => result.value);
        console.log('successfulImages : ', successfulThumbnails);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'max-age=31536000',
                'Access-Control-Allow-Origin': '*', // CORS header
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify(successfulThumbnails),
            isBase64Encoded: true
        };
    }

    catch (error) {
        console.error('Error processing S3 event:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Image processing failed' })
        };
    }
};