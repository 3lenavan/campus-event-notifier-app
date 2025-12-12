import { useRouter } from 'expo-router';
import { VerifyClub } from '../src/pages/VerifyClub';

export default function VerifyClubPage() {
  const router = useRouter();

  return (
    <VerifyClub 
      onSuccess={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)/profile');
        }
      }}
    />
  );
}
