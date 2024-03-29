import  cloudinary from  'cloudinary' ;

export const Cloudinary = {
     upload : async (image: string) => {
        // return new Promise((resolve, reject) => {
    const res =  await  cloudinary.v2.uploader.upload(image, {
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        cloud_name: process.env.CLOUDINARY_NAME,
        folder: 'Senguka/',
    });
        return res.secure_url;
     }
}