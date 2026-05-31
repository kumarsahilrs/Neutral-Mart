import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/splash" />;
  }

  if (user?.role === 'seller') {
    return <Redirect href="/(seller)" />;
  }

  return <Redirect href="/(buyer)" />;
}
