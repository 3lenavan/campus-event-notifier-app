import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getEventPolicy, setEventPolicy, EventPolicy } from '../lib/eventPolicy';
import { listClubs } from '../services/clubsService';
import { Club } from '../types';

interface EventCreationSettingsProps {
  onClose: () => void;
}

export const EventCreationSettings: React.FC<EventCreationSettingsProps> = ({ onClose }) => {
  const [policy, setPolicy] = useState<EventPolicy | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [policyData, clubsData] = await Promise.all([
        getEventPolicy(),
        listClubs()
      ]);
      setPolicy(policyData);
      setClubs(clubsData || []);
    } catch (error) {
      console.error('Error loading settings data:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const savePolicy = async (newPolicy: EventPolicy) => {
    try {
      await setEventPolicy(newPolicy);
      setPolicy(newPolicy);
    } catch (error) {
      console.error('Error saving policy:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const updateGlobalToggle = (enabled: boolean) => {
    if (!policy) return;
    const newPolicy = { ...policy, enabledGlobal: enabled };
    savePolicy(newPolicy);
  };

  const updateClubToggle = (clubId: string, enabled: boolean) => {
    if (!policy) return;
    const newPolicy = {
      ...policy,
      enabledByClub: {
        ...policy.enabledByClub,
        [clubId]: enabled,
      },
    };
    savePolicy(newPolicy);
  };

  const updateModerationMode = (mode: "off" | "clubModerator") => {
    if (!policy) return;
    const newPolicy = { ...policy, moderationMode: mode };
    savePolicy(newPolicy);
  };

  const updateLimit = (key: keyof EventPolicy['limits'], value: number | boolean) => {
    if (!policy) return;
    const newPolicy = {
      ...policy,
      limits: {
        ...policy.limits,
        [key]: value,
      },
    };
    savePolicy(newPolicy);
  };

  const filteredClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || !policy) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Event Creation Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Event Creation Settings</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Global Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Global Settings</Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Enable Event Creation</Text>
              <Text style={styles.toggleDescription}>
                Master toggle for all event creation
              </Text>
            </View>
            <Switch
              value={policy.enabledGlobal}
              onValueChange={updateGlobalToggle}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor={policy.enabledGlobal ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Club-Specific Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Club-Specific Settings</Text>
          
          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search clubs..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Club List */}
          <View style={styles.clubList}>
            {filteredClubs.map((club) => (
              <View key={club.id} style={styles.clubRow}>
                <View style={styles.clubInfo}>
                  <Text style={styles.clubName}>{club.name}</Text>
                  <Text style={styles.clubCategory}>{club.category}</Text>
                </View>
                <Switch
                  value={policy.enabledByClub[club.id] ?? true}
                  onValueChange={(enabled) => updateClubToggle(club.id, enabled)}
                  trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </View>
        </View>

        {/* Moderation Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Moderation</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => updateModerationMode('off')}
            >
              <View style={styles.radioButton}>
                {policy.moderationMode === 'off' && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.radioLabel}>No Moderation</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => updateModerationMode('clubModerator')}
            >
              <View style={styles.radioButton}>
                {policy.moderationMode === 'clubModerator' && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.radioLabel}>Club Moderator Review</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Limits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Limits</Text>
          
          <View style={styles.limitRow}>
            <Text style={styles.limitLabel}>Max Events per Club per Day</Text>
            <TextInput
              style={styles.numberInput}
              value={policy.limits.maxPerClubPerDay.toString()}
              onChangeText={(text) => updateLimit('maxPerClubPerDay', parseInt(text) || 0)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.limitRow}>
            <Text style={styles.limitLabel}>User Cooldown (minutes)</Text>
            <TextInput
              style={styles.numberInput}
              value={policy.limits.userCooldownMinutes.toString()}
              onChangeText={(text) => updateLimit('userCooldownMinutes', parseInt(text) || 0)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.limitRow}>
            <Text style={styles.limitLabel}>Max Title Length</Text>
            <TextInput
              style={styles.numberInput}
              value={policy.limits.maxTitleLen.toString()}
              onChangeText={(text) => updateLimit('maxTitleLen', parseInt(text) || 0)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.limitRow}>
            <Text style={styles.limitLabel}>Max Description Length</Text>
            <TextInput
              style={styles.numberInput}
              value={policy.limits.maxDescLen.toString()}
              onChangeText={(text) => updateLimit('maxDescLen', parseInt(text) || 0)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.limitRow}>
            <Text style={styles.limitLabel}>Allow Images</Text>
            <Switch
              value={policy.limits.allowImages}
              onValueChange={(value) => updateLimit('allowImages', value)}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {policy.limits.allowImages && (
            <View style={styles.limitRow}>
              <Text style={styles.limitLabel}>Max Image Size (MB)</Text>
              <TextInput
                style={styles.numberInput}
                value={policy.limits.maxImageMB.toString()}
                onChangeText={(text) => updateLimit('maxImageMB', parseInt(text) || 0)}
                keyboardType="numeric"
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  toggleDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  clubList: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  clubCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  radioGroup: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  radioLabel: {
    fontSize: 16,
    color: '#111827',
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  limitLabel: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  numberInput: {
    width: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 14,
    color: '#111827',
  },
});
