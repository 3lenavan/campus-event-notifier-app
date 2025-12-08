import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from "../../data/supabaseClient";
import { useAuthUser } from '../hooks/useAuthUser';
import { listClubs } from '../services/clubsService';
import { createEvent } from '../services/eventsService';
import { Club } from '../types';
import { useAppTheme, LightThemeColors } from '../ThemeContext';

// Updated import to use rewritten image picker and uploader
import { pickImage, uploadEventImage } from '../services/imageUploadService';

interface CreateEventProps {
  clubId?: string;
}

export const CreateEvent: React.FC<CreateEventProps> = ({ clubId }) => {
  const router = useRouter();
  const { user } = useAuthUser();
  const themeContext = useAppTheme();
  const colors = themeContext?.colors || LightThemeColors;
  const isDark = themeContext?.isDark || false;

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

  // Updated image states: store both URI and Base64
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    const data = await listClubs();
    setClubs(data || []);
  };

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

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadUserClubs();
      }
    }, [user])
  );

  useEffect(() => {
    if (userClubIds.length > 0 && !selectedClubId) {
      setSelectedClubId(String(userClubIds[0]));
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

  // Updated: Pick image using new picker that returns { uri, base64 }
  const handlePickImage = async () => {
    const result = await pickImage();
    if (result) {
      setSelectedImageUri(result.uri);
      setSelectedImageBase64(result.base64);
    }
  };

  // Updated: Remove image clears both values
  const handleRemoveImage = () => {
    setSelectedImageUri(null);
    setSelectedImageBase64(null);
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
    let imageUrl: string | undefined = undefined;

    // Updated image upload logic using new uploadEventImage
    if (selectedImageUri && selectedImageBase64) {
      setUploadingImage(true);

      const uploadedUrl = await uploadEventImage(
        selectedImageUri,
        selectedImageBase64,
        user.uid
      );

      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        Alert.alert("Warning", "Failed to upload image. Event will be created without image.");
      }

      setUploadingImage(false);
    }

    try {
      await createEvent(
        {
          title: title.trim(),
          description: description.trim(),
          clubId: selectedClubId,
          dateISO: eventDate.toISOString(),
          location: location.trim(),
          imageUrl: imageUrl,
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
      setUploadingImage(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Ionicons name="lock-closed" size={48} color={colors.subtitle} />
          <Text style={[styles.centeredText, { color: colors.text }]}>Please sign in to create events</Text>
        </View>
      </View>
    );
  }

  const userClubs = clubs.filter((c) => userClubIds.includes(String(c.id)));

  if (userClubs.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={48} color={colors.subtitle} />
          <Text style={[styles.centeredText, { color: colors.text }]}>You need to join a club first</Text>
          <TouchableOpacity
            style={[styles.verifyButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/verify-club')}
          >
            <Text style={styles.verifyButtonText}>Verify Club Membership</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Create Event</Text>

          {/* Club selection */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Select Club *</Text>
            <View style={styles.clubSelector}>
              {userClubs.map((club) => (
                <TouchableOpacity
                  key={club.id}
                  style={[
                    styles.clubOption,
                    { backgroundColor: isDark ? colors.border : '#E5E7EB' },
                    selectedClubId === club.id && [styles.clubOptionSelected, { backgroundColor: colors.primary }],
                  ]}
                  onPress={() => setSelectedClubId(club.id)}
                >
                  <Text
                    style={[
                      styles.clubOptionText,
                      { color: colors.text },
                      selectedClubId === club.id && styles.clubOptionTextSelected,
                    ]}
                  >
                    {club.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Event Title */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Event Title *</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
              placeholder="Enter event title"
              placeholderTextColor={colors.placeholderText}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
              placeholder="Describe your event..."
              placeholderTextColor={colors.placeholderText}
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {/* Date and time pickers */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Date & Time *</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={[styles.dateTimeButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <Text style={[styles.dateTimeText, { color: colors.text }]}>
                  {eventDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateTimeButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color={colors.primary} />
                <Text style={[styles.dateTimeText, { color: colors.text }]}>
                  {eventDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={eventDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') {
                    setShowDatePicker(false);
                  }
                  if (selectedDate) {
                    const newDate = new Date(selectedDate);
                    newDate.setHours(eventDate.getHours());
                    newDate.setMinutes(eventDate.getMinutes());
                    setEventDate(newDate);
                  } else if (Platform.OS === 'android') {
                    setShowDatePicker(false);
                  }
                }}
                minimumDate={new Date()}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={eventDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedTime) => {
                  if (Platform.OS === 'android') {
                    setShowTimePicker(false);
                  }
                  if (selectedTime) {
                    const newDate = new Date(eventDate);
                    newDate.setHours(selectedTime.getHours());
                    newDate.setMinutes(selectedTime.getMinutes());
                    setEventDate(newDate);
                  } else if (Platform.OS === 'android') {
                    setShowTimePicker(false);
                  }
                }}
              />
            )}

            {Platform.OS === 'ios' && (showDatePicker || showTimePicker) && (
              <View style={styles.iosPickerActions}>
                <TouchableOpacity
                  style={styles.iosPickerButton}
                  onPress={() => {
                    setShowDatePicker(false);
                    setShowTimePicker(false);
                  }}
                >
                  <Text style={styles.iosPickerButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Location */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Location *</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
              placeholder="Building - Room 123"
              placeholderTextColor={colors.placeholderText}
              value={location}
              onChangeText={handleLocationChange}
            />
            {locationError && (
              <Text style={[styles.errorTextSmall, { color: '#DC2626' }]}>{locationError}</Text>
            )}
          </View>

          {/* Image Picker Section (Updated) */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Event Image (Optional)</Text>

            {selectedImageUri ? (
              <View style={[styles.imagePreviewContainer, { borderColor: colors.border }]}>
                <Image
                  source={{ uri: selectedImageUri }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={handleRemoveImage}
                >
                  <Ionicons name="close-circle" size={24} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.imagePickerButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                onPress={handlePickImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="image-outline" size={20} color={colors.primary} />
                    <Text style={[styles.imagePickerText, { color: colors.primary }]}>Select Image</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <View style={[styles.errorContainer, { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2' }]}>
              {validationErrors.map((error, idx) => (
                <Text key={idx} style={styles.errorText}>
                  • {error}
                </Text>
              ))}
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  content: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centeredText: { fontSize: 16, marginTop: 16 },
  verifyButton: {
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  verifyButtonText: { color: 'white', fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  dateTimeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  iosPickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
  },
  iosPickerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iosPickerButtonText: {
    color: '#1D4ED8',
    fontSize: 16,
    fontWeight: '600',
  },
  clubSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  clubOption: {
    padding: 10,
    borderRadius: 20,
  },
  clubOptionSelected: { },
  clubOptionTextSelected: { color: 'white' },
  clubOptionText: { },
  createButton: {
    padding: 14,
    borderRadius: 999,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  createButtonText: { color: 'white', fontWeight: '600', marginLeft: 8 },
  buttonDisabled: { opacity: 0.6 },
  errorContainer: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  errorText: { color: '#DC2626' },
  errorTextSmall: { fontSize: 12 },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  imagePickerText: {
    fontWeight: '500',
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  imagePreview: {
    width: '100%',
    height: 200,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 4,
  },
});
