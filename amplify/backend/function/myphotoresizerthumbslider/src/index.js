const sharp = require('sharp');
const aws = require('aws-sdk');
const s3 = new aws.S3();

/**
 * 
 * @param {*} imagesFetched 
 * @param {*} folder One of the folders in the bucket
 * @param {*} bucket The bucket name
 * @param {*} type thumbnails or slider
 * @param {*} width 
 */
const createResizedImages = async (imagesFetched, folder, bucket, type) => {
    const imageFetchedPromises = [];
    for (const imageContent of imagesFetched.Contents) {
        console.log('========= imageContent', imageContent);
        const { Key } = imageContent;
        if (Key.endsWith('/')) {
            continue; // Skip if it's a folder
        }
        const imageName = Key.split('/').pop();
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

            const sharpedImage = await sharp(originalImageFetched.Body);
            const metadata = await sharpedImage.metadata();

            let resizedImage;
            const size = type === 'thumbnails' ? 220 : 1920;
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

exports.handler = async (event, context) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    console.log(`CONTEXT: ${JSON.stringify(context)}`);

    if (event.Records && event.Records[0].eventName === 'ObjectCreated:Put') {
        const BUCKET = event.Records[0].s3.bucket.name;
        const KEY = event.Records[0].s3.object.key.split('/')[1];

        const folder = KEY.replace("public/", "").split('/')[0];

        // Fetching all images in the folder
        const imagesFetched = await s3.listObjectsV2({
            Bucket: BUCKET,
            Prefix: `public/${folder}/`
        }).promise();

        // Handling thumbnails
        await createResizedImages(imagesFetched, folder, BUCKET, 'thumbnails');

        // Handling slider images
        await createResizedImages(imagesFetched, folder, BUCKET, 'slider');
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
