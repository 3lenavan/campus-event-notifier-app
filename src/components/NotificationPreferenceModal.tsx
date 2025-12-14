import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, LightThemeColors } from '../ThemeContext';

export type NotificationTiming =
  | '15min'
  | '30min'
  | '1hour'
  | '2hours'
  | '1day'
  | '1week'
  | 'custom'
  | 'none';

export interface NotificationPreference {
  timing: NotificationTiming;
  customTime?: string; // ISO string for custom time
  emailEnabled: boolean;
}

interface NotificationPreferenceModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (preference: NotificationPreference) => void;
  eventDate: Date; // Event date to calculate custom time options
}

const NOTIFICATION_OPTIONS: { value: NotificationTiming; label: string; description: string }[] = [
  { value: '15min', label: '15 minutes before', description: 'Get reminded 15 minutes before the event starts' },
  { value: '30min', label: '30 minutes before', description: 'Get reminded 30 minutes before the event starts' },
  { value: '1hour', label: '1 hour before', description: 'Get reminded 1 hour before the event starts' },
  { value: '2hours', label: '2 hours before', description: 'Get reminded 2 hours before the event starts' },
  { value: '1day', label: '1 day before', description: 'Get reminded 1 day before the event starts' },
  { value: '1week', label: '1 week before', description: 'Get reminded 1 week before the event starts' },
  { value: 'custom', label: 'Custom time', description: 'Choose your own reminder time' },
  { value: 'none', label: 'No reminder', description: "Don't send me any reminders" },
];

export const NotificationPreferenceModal: React.FC<NotificationPreferenceModalProps> = ({
  visible,
  onClose,
  onConfirm,
  eventDate,
}) => {
  const themeContext = useAppTheme();
  const colors = themeContext?.colors || LightThemeColors;
  const [selectedTiming, setSelectedTiming] = useState<NotificationTiming>('1hour');
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [customTime, setCustomTime] = useState<string>('');

  const handleConfirm = () => {
    let finalTiming = selectedTiming;
    let customTimeValue: string | undefined;

    if (selectedTiming === 'custom') {
      if (!customDate || !customTime) {
        alert('Please select both date and time for custom reminder');
        return;
      }
      // Combine custom date and time
      const [hours, minutes] = customTime.split(':');
      const reminderDateTime = new Date(customDate);
      reminderDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      customTimeValue = reminderDateTime.toISOString();
    }

    onConfirm({
      timing: finalTiming,
      customTime: customTimeValue,
      emailEnabled,
    });
    onClose();
  };

  const handleTimingSelect = (timing: NotificationTiming) => {
    setSelectedTiming(timing);
    if (timing !== 'custom') {
      setCustomDate(null);
      setCustomTime('');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Email Reminder Preferences
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: colors.subtitle }]}>
            When would you like to receive an email reminder?
          </Text>

          <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
            {NOTIFICATION_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  selectedTiming === option.value && [styles.selectedOption, { backgroundColor: colors.primary + '20', borderColor: colors.primary }],
                  { borderColor: colors.border },
                ]}
                onPress={() => handleTimingSelect(option.value)}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionHeader}>
                    <Ionicons
                      name={selectedTiming === option.value ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={selectedTiming === option.value ? colors.primary : colors.subtitle}
                    />
                    <Text style={[styles.optionLabel, { color: colors.text }]}>
                      {option.label}
                    </Text>
                  </View>
                  <Text style={[styles.optionDescription, { color: colors.subtitle }]}>
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Custom Time Picker (shown when custom is selected) */}
          {selectedTiming === 'custom' && (
            <View style={[styles.customTimeContainer, { borderColor: colors.border }]}>
              <Text style={[styles.customTimeLabel, { color: colors.text }]}>
                Select reminder date and time:
              </Text>
              <Text style={[styles.customTimeHint, { color: colors.subtitle }]}>
                Choose a date and time before the event ({eventDate.toLocaleDateString()})
              </Text>
              {/* Note: For a full implementation, you'd want to use a proper date/time picker component */}
              <Text style={[styles.customTimeNote, { color: colors.subtitle }]}>
                Custom time picker implementation needed (use @react-native-community/datetimepicker)
              </Text>
            </View>
          )}

          {/* Email Toggle */}
          <View style={[styles.emailSection, { borderTopColor: colors.border }]}>
            <View style={styles.emailHeader}>
              <Ionicons name="mail-outline" size={20} color={colors.text} />
              <Text style={[styles.emailLabel, { color: colors.text }]}>Enable Email Reminder</Text>
            </View>
            <Text style={[styles.emailDescription, { color: colors.subtitle }]}>
              {emailEnabled
                ? 'You will receive an email reminder at the selected time'
                : 'Email reminders are disabled'}
            </Text>
            <TouchableOpacity
              style={[
                styles.toggleContainer,
                { backgroundColor: emailEnabled ? colors.primary : colors.inputBackground },
              ]}
              onPress={() => setEmailEnabled(!emailEnabled)}
              activeOpacity={0.7}
            >
              <View style={[styles.toggle, emailEnabled && styles.toggleActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.primary }]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  optionsContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  option: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  selectedOption: {
    borderWidth: 2,
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 13,
    marginLeft: 32,
  },
  customTimeContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  customTimeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  customTimeHint: {
    fontSize: 13,
    marginBottom: 12,
  },
  customTimeNote: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  emailSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  emailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  emailLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  emailDescription: {
    fontSize: 13,
    marginBottom: 12,
  },
  toggleContainer: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  toggleActive: {
    alignSelf: 'flex-end',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

