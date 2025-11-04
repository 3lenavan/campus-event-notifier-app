import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { getLS, LS_KEYS } from '../lib/localStorage';
import { notifyNow } from '../lib/notifications';
import { createEvent } from '../services/eventsService';
import { Club } from '../types';

interface CreateEventProps {
  clubId?: string;
}

export const CreateEvent: React.FC<CreateEventProps> = ({ clubId }) => {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuthUser();
  const [clubs, setClubs] = useState<Club[]>([]);
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

  useEffect(() => {
    loadClubs();
    // Refresh profile on mount to ensure we have latest memberships
    if (user) {
      refreshProfile();
    }
  }, [user, refreshProfile]);

  // If clubs load and user has memberships, preselect first club
  useEffect(() => {
    if (!profile) return;
    const eligible = clubs.filter(c => profile.memberships.includes(c.id));
    if (eligible.length > 0 && !selectedClubId) {
      setSelectedClubId(eligible[0].id);
    }
  }, [clubs, profile]);

  const loadClubs = async () => {
    try {
      const clubsData = await getLS<Club[]>(LS_KEYS.CLUBS, []);
      setClubs(clubsData || []);
    } catch (error) {
      console.error('Error loading clubs:', error);
      Alert.alert('Error', 'Failed to load clubs');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEventDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      setEventDate(selectedDate);
    }
  };

  const pickerColor = '#000000';

  const toTitleCase = (value: string) =>
    value.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());

  // Enforce location format: "Building - Room 123"
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

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCreateEvent = async () => {
    if (!user || !profile) {
      Alert.alert('Error', 'Please sign in first');
      return;
    }

    // Clear previous validation errors
    const errors: string[] = [];

    if (!selectedClubId) errors.push('Please select a club');
    if (!title.trim()) errors.push('Please enter a title');
    if (!description.trim()) errors.push('Please enter a description');
    if (!location.trim()) errors.push('Please enter a location');
    if (location.trim() && !LOCATION_REGEX.test(location.trim())) {
      errors.push("Location must match 'Building - Room 123'");
    }

    if (errors.length) {
      setValidationErrors(errors);
      return;
    }

    // Check if user is a member of the selected club
    if (!profile.memberships.includes(selectedClubId)) {
      setValidationErrors(['You must be a member of this club to create events']);
      return;
    }

    setLoading(true);
    try {
      // Run comprehensive validation
      const denylist = getDefaultDenylist();
      const validation = await validateEventInput(
        {
          title: title.trim(),
          description: description.trim(),
          clubId: selectedClubId,
          dateISO: eventDate.toISOString(),
          location: location.trim(),
        },
        user.uid,
        denylist
      );

      if (!validation.ok) {
        setValidationErrors(validation.errors);
        setLoading(false);
        return;
      }

      // If validation passes, create the event
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

      // If auto-approved, notify that a new event is available
      if (newEvent.status === 'approved') {
        try { 
          await notifyNow('New Event Available', `${newEvent.title} is now available to RSVP`);
        } catch {}
      }

      Alert.alert('Success', 'Event created successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error creating event:', error);
      setValidationErrors(['Failed to create event']);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="lock-closed" size={48} color="#6B7280" />
          <Text style={styles.centeredText}>Please sign in to create events</Text>
        </View>
      </View>
    );
  }

  // Filter clubs to only show ones the user is a member of
  const userClubs = clubs.filter(club => profile.memberships.includes(club.id));

  if (userClubs.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={48} color="#6B7280" />
          <Text style={styles.centeredText}>You need to join a club first</Text>
          <Text style={styles.centeredSubText}>
            Verify your club membership to create events
          </Text>
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
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.title}>Create Event</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Club *</Text>
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
                    <Text style={[
                      styles.clubOptionText,
                      selectedClubId === club.id && styles.clubOptionTextSelected,
                    ]}>
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
                maxLength={100}
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
                numberOfLines={4}
                maxLength={500}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date & Time *</Text>
              <View style={styles.dateTimeContainer}>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={pickerColor} />
                  <Text style={styles.dateTimeText}>
                    {eventDate.toLocaleDateString()}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={pickerColor} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dateTimeButton, styles.timeButton]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color={pickerColor} />
                  <Text style={styles.dateTimeText}>
                    {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={pickerColor} />
                </TouchableOpacity>
              </View>
              <Text style={styles.helpText}>
                Tap to select date and time
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="Building - Room 123"
                value={location}
                onChangeText={handleLocationChange}
                maxLength={100}
              />
              {locationError && (
                <Text style={[styles.helpText, { color: '#DC2626' }]}>{locationError}</Text>
              )}
            </View>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <View style={styles.errorContainer}>
                {validationErrors.map((error, index) => (
                  <Text key={index} style={styles.errorText}>
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
        </View>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={eventDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
          themeVariant="light"
          {...(Platform.OS === 'ios' ? { textColor: '#000000' as any } : {})}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={eventDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          themeVariant="light"
          {...(Platform.OS === 'ios' ? { textColor: '#000000' as any } : {})}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  centeredText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginTop: 16,
  },
  centeredSubText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  verifyButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  form: {
    paddingTop: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D6E4FF',
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  clubSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  clubOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D6E4FF',
  },
  clubOptionSelected: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  clubOptionText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  clubOptionTextSelected: {
    color: 'white',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D4ED8',
    borderRadius: 999,
    paddingVertical: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 4,
  },
  dateTimeContainer: {
    marginBottom: 4,
    gap: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeButton: {
    marginTop: 8,
  },
  dateTimeText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
});
