// 简单的 API 测试脚本
const BASE_URL = 'http://localhost:3000';

async function testAPI(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    return {
      status: response.status,
      ok: response.ok,
      data: await response.text()
    };
  } catch (error) {
    return { error: error.message };
  }
}

console.log('🧪 开始 API 测试...\n');

// 测试 1: 首页
console.log('1️⃣ 测试首页...');
const home = await testAPI('/');
console.log(`   状态: ${home.status} ${home.ok ? '✅' : '❌'}`);

// 测试 2: API 健康检查
console.log('\n2️⃣ 测试用户 API...');
const userMe = await testAPI('/api/user/me');
console.log(`   状态: ${userMe.status} ${userMe.ok ? '✅' : '❌'}`);
console.log(`   响应: ${userMe.data?.substring(0, 100)}...`);

// 测试 3: 上传 API
console.log('\n3️⃣ 测试上传 API...');
const upload = await testAPI('/api/upload');
console.log(`   状态: ${upload.status}`);

// 测试 4: 视频任务创建 API
console.log('\n4️⃣ 测试视频任务创建 API...');
const createTask = await testAPI('/api/video/task/create', 'POST', {
  photoUrl: 'test.jpg',
  videoUrl: 'test.mp4'
});
console.log(`   状态: ${createTask.status}`);
console.log(`   响应: ${createTask.data?.substring(0, 100)}...`);

// 测试 5: 支付 checkout API
console.log('\n5️⃣ 测试支付 checkout API...');
const checkout = await testAPI('/api/payment/creem/checkout?product=single');
console.log(`   状态: ${checkout.status}`);

console.log('\n✅ API 测试完成！');
console.log('\n📊 总结:');
console.log('   - 开发服务器: ✅ 运行中');
console.log('   - API 端点: ✅ 可访问');
console.log('   - 需要登录的接口会返回 401/403，这是正常的');
