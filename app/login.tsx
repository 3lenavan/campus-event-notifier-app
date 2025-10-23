import { useRouter } from 'expo-router';
import { Login } from '../src/pages/Login';

export default function LoginPage() {
  const router = useRouter();

  return (
    <Login 
      onSuccess={() => {
        router.back();
      }}
    />
  );
}
