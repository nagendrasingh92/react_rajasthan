export default ({ env }) => ({
  graphql: {
    config: {
      endpoint: '/graphql',
      shadowCRUD: true,
      playgroundAlways: true,
      apolloServer: {
        introspection: true,
      },
    },
  },
  upload: {
    config: {
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: env('CLOUDINARY_NAME'),
        api_key: env('CLOUDINARY_KEY'),
        api_secret: env('CLOUDINARY_SECRET'),
      },
      actionOptions: {
        upload: {
          use_filename: true,
          unique_filename: false,
          overwrite: true,
          resource_type: 'auto',
          folder: async (file) => {
            console.log('Upload file data:', JSON.stringify(file, null, 2));
            
            // Get folder ID from fileInfo
            const folderId = file?.data?.fileInfo?.folder;
            console.log('Folder ID:', folderId);
            
            let folderPath = 'uploads';
            
            if (folderId && folderId !== 0) {
              try {
                // Get folder information from Strapi database
                const folder = await strapi.query('plugin::upload.folder').findOne({
                  where: { id: folderId }
                });
                
                if (folder && folder.path) {
                  folderPath = folder.path.replace(/^\//, ''); // Remove leading slash
                }
              } catch (error) {
                console.log('Error getting folder info:', error);
              }
            }
            
            console.log('Final folder path:', folderPath);
            return folderPath;
          },
        },
      },
      security: {
        allowedMimeTypes: [
          'image/jpeg',
          'image/png', 
          'image/webp',
          'image/gif',
          'image/svg+xml',
          'image/bmp',
          'image/tiff',
          'image/x-icon'
        ],
        sizeLimit: 10 * 1024 * 1024, // 10 MB
        enableEnvironmentCheck: false,
      },
    },
  },
});
