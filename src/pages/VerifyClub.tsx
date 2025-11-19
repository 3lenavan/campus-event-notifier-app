import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuthUser } from '../hooks/useAuthUser';
import { listClubs } from '../services/clubsService';
import { verifyClubMembership } from '../services/profileService';
import { Club } from '../types';

interface VerifyClubProps {
  onSuccess?: (club: Club) => void;
}

export const VerifyClub: React.FC<VerifyClubProps> = ({ onSuccess }) => {
  const { user, profile, refreshProfile } = useAuthUser();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubInput, setClubInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showClubList, setShowClubList] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      const clubsData = await listClubs();
      setClubs(clubsData || []);
      console.log('[VerifyClub] Loaded clubs:', clubsData?.length || 0);
      if (clubsData && clubsData.length > 0) {
        console.log('[VerifyClub] Sample club names:', clubsData.slice(0, 5).map(c => c.name));
        // Check if Computer Science club exists
        const computerClub = clubsData.find(c => 
          c.name.toLowerCase().includes('computer')
        );
        if (computerClub) {
          console.log('[VerifyClub] Found Computer Science club:', computerClub.name);
        } else {
          console.log('[VerifyClub] WARNING: Computer Science club not found in loaded clubs');
        }
      } else {
        console.warn('[VerifyClub] WARNING: No clubs loaded! Database might be empty.');
      }
    } catch (error) {
      console.error('Error loading clubs:', error);
      Alert.alert('Error', 'Failed to load clubs');
    }
  };

  const handleVerify = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in first');
      return;
    }

    if (!clubInput.trim() || !codeInput.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyClubMembership(user.uid, clubInput.trim(), codeInput.trim());
      
      if (result.success) {
        // Refresh profile to get updated memberships immediately
        // Wait for refresh to complete before showing success message
        console.log('[VerifyClub] Verification successful, refreshing profile...');
        await refreshProfile();
        console.log('[VerifyClub] Profile refreshed after verification');
        
        // Give a small delay to ensure profile state is updated across all components
        await new Promise(resolve => setTimeout(resolve, 100));
        
        Alert.alert(
          '✅ Membership Confirmed!', 
          `You have been successfully added to ${result.club?.name}. You can now create events for this club!`, 
          [
            {
              text: 'Verify Another Club',
              onPress: () => {
                setClubInput('');
                setCodeInput('');
              }
            },
            {
              text: 'Done',
              onPress: () => {
                setClubInput('');
                setCodeInput('');
                onSuccess?.(result.club!);
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  const filteredClubs = clubs.filter(club => {
    const searchText = clubInput.toLowerCase().trim();
    if (!searchText) return false;
    const nameMatch = club.name.toLowerCase().includes(searchText);
    const idMatch = club.id.toLowerCase().includes(searchText);
    const categoryMatch = club.category?.toLowerCase().includes(searchText);
    return nameMatch || idMatch || categoryMatch;
  });

  const renderClubItem = ({ item }: { item: Club }) => (
    <TouchableOpacity
      style={styles.clubItem}
      onPress={() => {
        setClubInput(item.name);
        setShowClubList(false);
      }}
    >
      <View style={styles.clubInfo}>
        <Text style={styles.clubName}>{item.name}</Text>
        <Text style={styles.clubCategory}>{item.category}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6B7280" />
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="lock-closed" size={48} color="#6B7280" />
          <Text style={styles.centeredText}>Please sign in to verify club membership</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="shield-checkmark" size={48} color="#1D4ED8" />
          <Text style={styles.title}>Verify Club Membership</Text>
          <Text style={styles.subtitle}>
            Join clubs by entering the club name and verification code. You can verify multiple club memberships.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="school-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { borderRadius: 999, borderColor: '#D6E4FF' }]}
              placeholder="Club name or ID"
              value={clubInput}
              onChangeText={(text) => {
                setClubInput(text);
                setShowClubList(text.length > 0);
                // Debug log
                if (text.length > 0) {
                  const searchText = text.toLowerCase().trim();
                  const filtered = clubs.filter(club => {
                    const nameMatch = club.name.toLowerCase().includes(searchText);
                    const idMatch = club.id.toLowerCase().includes(searchText);
                    const categoryMatch = club.category?.toLowerCase().includes(searchText);
                    return nameMatch || idMatch || categoryMatch;
                  });
                  console.log('[VerifyClub] Search:', text);
                  console.log('[VerifyClub] Total clubs available:', clubs.length);
                  console.log('[VerifyClub] Filtered results:', filtered.length);
                  if (filtered.length > 0) {
                    console.log('[VerifyClub] First match:', filtered[0].name);
                  } else if (clubs.length > 0) {
                    console.log('[VerifyClub] Sample club names:', clubs.slice(0, 3).map(c => c.name));
                  }
                }
              }}
              autoCapitalize="words"
            />
            {clubInput.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setClubInput('');
                  setShowClubList(false);
                }}
              >
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {showClubList && clubInput.length > 0 && (
            <View style={styles.clubList}>
              {filteredClubs.length > 0 ? (
                <FlatList
                  data={filteredClubs.slice(0, 5)}
                  renderItem={renderClubItem}
                  keyExtractor={(item) => item.id}
                  style={styles.clubListContent}
                  keyboardShouldPersistTaps="handled"
                />
              ) : (
                <View style={styles.clubListEmpty}>
                  <Text style={styles.clubListEmptyText}>
                    No clubs found matching "{clubInput}"
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="key-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { borderRadius: 999, borderColor: '#D6E4FF' }]}
              placeholder="Verification code"
              value={codeInput}
              onChangeText={setCodeInput}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color="#6B7280" 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.verifyButton, { backgroundColor: '#1D4ED8', borderRadius: 999 }, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.verifyButtonText}>Verify Membership</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {profile && profile.memberships.length > 0 && (
          <View style={styles.currentMemberships}>
            <Text style={styles.membershipsTitle}>Your Memberships:</Text>
            {profile.memberships.map((clubId) => {
              const club = clubs.find(c => c.id === clubId);
              return club ? (
                <View key={clubId} style={styles.membershipItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.membershipText}>{club.name}</Text>
                </View>
              ) : null;
            })}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  centeredText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  clubList: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: -16,
    marginBottom: 16,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  clubListContent: {
    maxHeight: 200,
  },
  clubListEmpty: {
    padding: 16,
    alignItems: 'center',
  },
  clubListEmptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  clubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  currentMemberships: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  membershipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  membershipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  membershipText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  eyeButton: {
    padding: 4,
  },
});
