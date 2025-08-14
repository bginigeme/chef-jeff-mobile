import { auth } from './firebase';

export const testFirebaseConnection = () => {
  console.log('🧪 Testing Firebase connection...');
  console.log('🔐 Auth object:', auth);
  console.log('🔐 Auth app:', auth.app);
  console.log('🔐 Auth config:', auth.app.options);

  // Test if we can access Firebase
  try {
    console.log('✅ Firebase connection successful');
    console.log('📊 Project ID:', auth.app.options.projectId);
    console.log('🌐 Auth Domain:', auth.app.options.authDomain);
    console.log('🔑 API Key (first 10 chars):', auth.app.options.apiKey?.substring(0, 10) + '...');
    console.log('📱 App ID:', auth.app.options.appId);
    return true;
  } catch (error) {
    console.log('❌ Firebase connection failed:', error);
    return false;
  }
}; 