// cloudfunctions/upload-file/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 文件上传云函数
exports.main = async (event, context) => {
  const { cloudPath, filePath } = event;

  try {
    if (!cloudPath || !filePath) {
      throw new Error('cloudPath和filePath参数不能为空');
    }

    // 直接使用wx-server-sdk的uploadFile方法
    const uploadResult = await cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath
    });

    return {
      success: true,
      fileID: uploadResult.fileID,
      statusCode: uploadResult.statusCode,
      errMsg: uploadResult.errMsg
    };

  } catch (error) {
    console.error('文件上传失败:', error);
    return {
      success: false,
      error: error.message || '文件上传失败'
    };
  }
};