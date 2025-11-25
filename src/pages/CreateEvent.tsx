import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuthUser } from '../hooks/useAuthUser';
import { getDefaultDenylist, validateEventInput } from '../lib/eventValidators';
import { listClubs } from '../services/clubsService';
import { notifyNow } from '../lib/notifications';
import { createEvent } from '../services/eventsService';
import { supabase } from "../../data/supabaseClient";
import { Club } from '../types';

interface CreateEventProps {
  clubId?: string;
}

export const CreateEvent: React.FC<CreateEventProps> = ({ clubId }) => {
  const router = useRouter();
  const { user, profile } = useAuthUser();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [userClubIds, setUserClubIds] = useState<string[]>([]);
  const [selectedClubId, setSelectedClubId] = useState(clubId || '');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [location, setLocation] = useState('');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Load clubs
  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    const data = await listClubs();
    setClubs(data || []);
  };

  // Load user’s verified clubs from clubs_users
  const loadUserClubs = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('clubs_users')
      .select('club_id')
      .eq('user_id', user.uid);

    if (!data || error) {
      setUserClubIds([]);
      return;
    }

    setUserClubIds(data.map((row: any) => String(row.club_id)));
  };

  // Refresh user clubs when screen is opened
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadUserClubs();
      }
    }, [user])
  );

  // Preselect club if none selected
  useEffect(() => {
  if (userClubIds.length > 0 && !selectedClubId) {
    setSelectedClubId(String(userClubIds[0]));   // <-- FIX
  }
}, [userClubIds]);

  const pickerColor = '#000000';

  const toTitleCase = (value: string) =>
    value.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());

  const LOCATION_REGEX = /^.+\s-\sRoom\s\d+$/;

  const handleLocationChange = (value: string) => {
    const formatted = toTitleCase(value);
    setLocation(formatted);

    if (formatted.length === 0) {
      setLocationError(null);
    } else if (!LOCATION_REGEX.test(formatted)) {
      setLocationError("Use format: Building - Room 123");
    } else {
      setLocationError(null);
    }
  };

  const handleCreateEvent = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in first');
      return;
    }

    const errors: string[] = [];
    if (!selectedClubId) errors.push('Please select a club');
    if (!title.trim()) errors.push('Please enter a title');
    if (!description.trim()) errors.push('Please enter a description');
    if (!location.trim() || !LOCATION_REGEX.test(location.trim()))
      errors.push("Location must match 'Building - Room 123'");

    if (!userClubIds.includes(String(selectedClubId))) {
      errors.push('You must be a verified member of this club to create events');
    }

    if (errors.length) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const newEvent = await createEvent(
        {
          title: title.trim(),
          description: description.trim(),
          clubId: selectedClubId,
          dateISO: eventDate.toISOString(),
          location: location.trim(),
        },
        user.uid
      );

      Alert.alert('Success', 'Event created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error creating event:', error);
      setValidationErrors([error.message || 'Failed to create event']);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="lock-closed" size={48} color="#6B7280" />
          <Text style={styles.centeredText}>Please sign in to create events</Text>
        </View>
      </View>
    );
  }

  const userClubs = clubs.filter((c) => userClubIds.includes(String(c.id)));

  if (userClubs.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={48} color="#6B7280" />
          <Text style={styles.centeredText}>You need to join a club first</Text>
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() => router.push('/verify-club')}
          >
            <Text style={styles.verifyButtonText}>Verify Club Membership</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Event</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Select Club *</Text>
            <View style={styles.clubSelector}>
              {userClubs.map((club) => (
                <TouchableOpacity
                  key={club.id}
                  style={[
                    styles.clubOption,
                    selectedClubId === club.id && styles.clubOptionSelected,
                  ]}
                  onPress={() => setSelectedClubId(club.id)}
                >
                  <Text
                    style={[
                      styles.clubOptionText,
                      selectedClubId === club.id && styles.clubOptionTextSelected,
                    ]}
                  >
                    {club.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Event Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter event title"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your event..."
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="Building - Room 123"
              value={location}
              onChangeText={handleLocationChange}
            />
            {locationError && (
              <Text style={styles.errorTextSmall}>{locationError}</Text>
            )}
          </View>

          {validationErrors.length > 0 && (
            <View style={styles.errorContainer}>
              {validationErrors.map((error, idx) => (
                <Text key={idx} style={styles.errorText}>
                  • {error}
                </Text>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.createButton, loading && styles.buttonDisabled]}
            onPress={handleCreateEvent}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.createButtonText}>Create Event</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 20 },
  content: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centeredText: { fontSize: 16, marginTop: 16 },
  verifyButton: {
    backgroundColor: '#1D4ED8',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  verifyButtonText: { color: 'white', fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderColor: '#D6E4FF',
    borderWidth: 1,
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  clubSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  clubOption: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  clubOptionSelected: { backgroundColor: '#1D4ED8' },
  clubOptionTextSelected: { color: 'white' },
  clubOptionText: { color: '#111827' },
  createButton: {
    padding: 14,
    backgroundColor: '#1D4ED8',
    borderRadius: 999,
    alignItems: 'center',
  },
  createButtonText: { color: 'white', fontWeight: '600', marginLeft: 8 },
  buttonDisabled: { opacity: 0.6 },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  errorText: { color: '#DC2626' },
  errorTextSmall: { color: 'red', fontSize: 12 },
});
