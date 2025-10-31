import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuthUser } from '../src/hooks/useAuthUser';
import { listClubs, updateClubCodes } from '../src/services/clubsService';
import { approveEvent, listEvents, rejectEvent } from '../src/services/eventsService';
import { Club, Event } from '../src/types';

export default function AdminSettings() {
  const { profile } = useAuthUser();

  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [newMemberCode, setNewMemberCode] = useState('');
  const [newModeratorCode, setNewModeratorCode] = useState('');
  const [savingCodes, setSavingCodes] = useState(false);

  useEffect(() => {
    if (!profile?.isAdmin) return;
    reload();
  }, [profile?.isAdmin]);

  const reload = async () => {
    setEventsLoading(true);
    setClubsLoading(true);
    try {
      const [events, clubsList] = await Promise.all([listEvents(), listClubs()]);
      setAllEvents(events || []);
      setClubs(clubsList || []);
      if (clubsList && clubsList.length > 0) {
        setSelectedClubId(clubsList[0].id);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load admin data');
    } finally {
      setEventsLoading(false);
      setClubsLoading(false);
    }
  };

  const pendingEvents = useMemo(() => allEvents.filter(e => e.status === 'pending'), [allEvents]);

  const handleApprove = async (eventId: string) => {
    try {
      await approveEvent(eventId);
      setAllEvents(prev => prev.map(e => (e.id === eventId ? { ...e, status: 'approved' } : e)));
    } catch (e) {
      Alert.alert('Error', 'Failed to approve event');
    }
  };

  const handleReject = async (eventId: string) => {
    try {
      await rejectEvent(eventId, 'Rejected by admin');
      setAllEvents(prev => prev.map(e => (e.id === eventId ? { ...e, status: 'rejected', moderationNote: 'Rejected by admin' } : e)));
    } catch (e) {
      Alert.alert('Error', 'Failed to reject event');
    }
  };

  const handleRotateCodes = async () => {
    if (!selectedClubId) {
      Alert.alert('Validation', 'Please select a club');
      return;
    }
    if (!newMemberCode && !newModeratorCode) {
      Alert.alert('Validation', 'Enter at least one new code');
      return;
    }
    setSavingCodes(true);
    try {
      await updateClubCodes(selectedClubId, {
        newMemberCode: newMemberCode || undefined,
        newModeratorCode: newModeratorCode || undefined,
      });
      setNewMemberCode('');
      setNewModeratorCode('');
      Alert.alert('Success', 'Codes updated');
    } catch (e) {
      Alert.alert('Error', 'Failed to update codes');
    } finally {
      setSavingCodes(false);
    }
  };

  if (!profile?.isAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.8} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.header}>Admin Settings</Text>
        <Text>You do not have access to this page.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.backButton} activeOpacity={0.8} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color="#111827" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.header}>Admin Settings</Text>

      <View style={[styles.card, styles.cardSpacing]}>
        <Text style={styles.title}>Pending Events</Text>
        {eventsLoading ? (
          <ActivityIndicator />
        ) : (
          <FlatList
            data={pendingEvents}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.subtitle}>No pending events</Text>}
            renderItem={({ item }) => (
              <View style={styles.eventRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <Text style={styles.eventMeta}>{item.clubId} • {new Date(item.dateISO).toLocaleString()}</Text>
                </View>
                <TouchableOpacity style={[styles.button, styles.approve]} onPress={() => handleApprove(item.id)}>
                  <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.reject]} onPress={() => handleReject(item.id)}>
                  <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      <View style={[styles.card, styles.cardSpacing]}>
        <Text style={styles.title}>Rotate Club Codes</Text>
        {clubsLoading ? (
          <ActivityIndicator />
        ) : (
          <>
            <View style={styles.pillRow}>
              {clubs.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.pill, selectedClubId === c.id && styles.pillSelected]}
                  onPress={() => setSelectedClubId(c.id)}
                >
                  <Text style={[styles.pillText, selectedClubId === c.id && styles.pillTextSelected]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              placeholder="New member code (optional)"
              value={newMemberCode}
              onChangeText={setNewMemberCode}
              style={styles.input}
              autoCapitalize="none"
            />
            <TextInput
              placeholder="New moderator code (optional)"
              value={newModeratorCode}
              onChangeText={setNewModeratorCode}
              style={styles.input}
              autoCapitalize="none"
            />
            <TouchableOpacity style={[styles.primaryButton, savingCodes && { opacity: 0.7 }]} onPress={handleRotateCodes} disabled={savingCodes}>
              <Text style={styles.primaryButtonText}>{savingCodes ? 'Saving...' : 'Update Codes'}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, padding: 16 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { marginLeft: 8, fontSize: 16, color: '#111827' },
  header: { fontSize: 24, fontWeight: '700', marginVertical: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  cardSpacing: { marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  subtitle: { color: '#6b7280' },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  eventTitle: { fontSize: 16, fontWeight: '600' },
  eventMeta: { color: '#6b7280', fontSize: 12 },
  button: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  approve: { backgroundColor: '#10b981' },
  reject: { backgroundColor: '#ef4444' },
  buttonText: { color: '#fff', fontWeight: '600' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  pill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 9999, borderWidth: 1, borderColor: '#d1d5db' },
  pillSelected: { backgroundColor: '#111827', borderColor: '#111827' },
  pillText: { color: '#111827' },
  pillTextSelected: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 10 },
  primaryButton: { backgroundColor: '#111827', borderRadius: 10, padding: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
});


