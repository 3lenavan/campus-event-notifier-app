import { useLocalSearchParams } from 'expo-router';
import { CreateEvent } from '../../src/pages/CreateEvent';

export default function CreateEventTab() {
  const { clubId } = useLocalSearchParams<{ clubId?: string }>();

  return (
    <CreateEvent clubId={clubId} />
  );
}
