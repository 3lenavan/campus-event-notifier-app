import { Ionicons } from '@expo/vector-icons';
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
import { getLS, LS_KEYS } from '../lib/localStorage';
import { validateEventInput, getDefaultDenylist } from '../lib/eventValidators';
import { createEvent } from '../services/eventsService';
import { Club } from '../types';

interface CreateEventProps {
  clubId?: string;
}

export const CreateEvent: React.FC<CreateEventProps> = ({ clubId }) => {
  const router = useRouter();
  const { user, profile } = useAuthUser();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState(clubId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      const clubsData = await getLS<Club[]>(LS_KEYS.CLUBS, []);
      setClubs(clubsData);
    } catch (error) {
      console.error('Error loading clubs:', error);
      Alert.alert('Error', 'Failed to load clubs');
    }
  };

  const handleCreateEvent = async () => {
    if (!user || !profile) {
      Alert.alert('Error', 'Please sign in first');
      return;
    }

    // Clear previous validation errors
    setValidationErrors([]);

    // Basic field validation
    if (!selectedClubId || !title.trim() || !description.trim() || !date.trim() || !location.trim()) {
      setValidationErrors(['Please fill in all fields']);
      return;
    }

    // Check if user is a member of the selected club
    if (!profile.memberships.includes(selectedClubId)) {
      setValidationErrors(['You must be a member of this club to create events']);
      return;
    }

    setLoading(true);
    try {
      // Convert date to ISO format
      const eventDate = new Date(date);
      if (isNaN(eventDate.getTime())) {
        setValidationErrors(['Please enter a valid date']);
        setLoading(false);
        return;
      }

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
      await createEvent(
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
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD HH:MM (e.g., 2024-12-25 14:30)"
                value={date}
                onChangeText={setDate}
              />
              <Text style={styles.helpText}>
                Format: YYYY-MM-DD HH:MM (24-hour format)
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="Event location"
                value={location}
                onChangeText={setLocation}
                maxLength={100}
              />
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clubOptionSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
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
    backgroundColor: '#3B82F6',
    borderRadius: 12,
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
});
