import { useRouter } from 'expo-router';
import { SplashScreen } from '../src/screens/shared/SplashScreen';

export default function SplashRoute() {
  const router = useRouter();

  function handleSelectPanel(panel: 'buyer' | 'seller') {
    router.push(`/login?panel=${panel}`);
  }

  return <SplashScreen onSelectPanel={handleSelectPanel} />;
}
