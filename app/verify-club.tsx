import { useRouter } from 'expo-router';
import { VerifyClub } from '../src/pages/VerifyClub';

export default function VerifyClubPage() {
  const router = useRouter();

  return (
    <VerifyClub 
      onSuccess={() => {
        router.back();
      }}
    />
  );
}
