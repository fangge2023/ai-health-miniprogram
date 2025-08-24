// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const usersCollection = db.collection('users')

// 云函数入口函数
exports.main = async (event, context) => {
  const { userInfo, action = 'login' } = event
  const wxContext = cloud.getWXContext()
  
  try {
    // 检查用户是否存在
    const userRecord = await usersCollection.where({
      openid: wxContext.OPENID
    }).get()
    
    const currentTime = new Date()
    const userData = {
      openid: wxContext.OPENID,
      unionid: wxContext.UNIONID,
      lastLoginTime: currentTime,
      userInfo: userInfo,
      updateTime: currentTime
    }
    
    if (userRecord.data.length === 0) {
      // 新用户注册
      userData.createTime = currentTime
      userData.loginCount = 1
      userData.isActive = true
      
      const result = await usersCollection.add({
        data: userData
      })
      
      return {
        success: true,
        action: 'register',
        userId: result._id,
        userInfo: userInfo,
        message: '用户注册成功'
      }
    } else {
      // 老用户登录
      const existingUser = userRecord.data[0]
      const loginCount = (existingUser.loginCount || 0) + 1
      
      await usersCollection.doc(existingUser._id).update({
        data: {
          lastLoginTime: currentTime,
          updateTime: currentTime,
          loginCount: loginCount,
          userInfo: userInfo,
          isActive: true
        }
      })
      
      return {
        success: true,
        action: 'login',
        userId: existingUser._id,
        userInfo: userInfo,
        loginCount: loginCount,
        message: '用户登录成功'
      }
    }
  } catch (error) {
    console.error('用户登录处理失败:', error)
    return {
      success: false,
      error: error.message,
      message: '用户登录处理失败'
    }
  }
}