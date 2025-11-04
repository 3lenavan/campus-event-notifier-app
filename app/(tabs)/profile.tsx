import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useAuthUser } from "../../src/hooks/useAuthUser";
import { auth } from "../../src/lib/firebase";
import { getLS, LS_KEYS } from "../../src/lib/localStorage";
import { Club } from "../../src/types";

const Profile = () => {
  const { user, profile, loading } = useAuthUser();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    const loadClubs = async () => {
      try {
        const clubsData = await getLS<Club[]>(LS_KEYS.CLUBS, []);
        setClubs(clubsData);
      } catch (error) {
        console.error('Error loading clubs:', error);
      }
    };

    loadClubs();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      Alert.alert('Success', 'Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.header}>Profile</Text>
        <Text style={styles.subheader}>Manage your account and preferences</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileBox}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.name ? profile.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "?"}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{profile?.name || user?.displayName || "Unknown User"}</Text>
          <Text style={styles.email}>{profile?.email || user?.email}</Text>
          {profile && (
            <View style={styles.roleContainer}>
              <View style={[
                styles.roleBadge,
                { backgroundColor: profile.isAdmin ? '#2563EB' : (profile.role === 'member' ? '#10B981' : '#6B7280') }
              ]}>
                <Text style={styles.roleText}>
                  {profile.isAdmin ? 'Admin' : (profile.role === 'member' ? 'Club Member' : 'Student')}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Settings Section */}
      <View style={styles.settingsBox}>
        {/* Notifications toggle */}
        <View style={styles.row}>
          <Text style={styles.rowTitle}>Push Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
        </View>

        {/* Verify Club Membership */}
        <TouchableOpacity 
          style={styles.row}
          onPress={() => router.push('/verify-club')}
        >
          <View style={styles.rowContent}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Verify Club Membership</Text>
              <Text style={styles.rowSubtitle}>Join clubs with verification codes</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* My Club Memberships */}
        {profile?.memberships && profile.memberships.length > 0 && (
          <View style={styles.membershipsSection}>
            <Text style={styles.sectionTitle}>My Club Memberships</Text>
            <View style={styles.clubTagsContainer}>
              {profile.memberships.map((clubId) => {
                const club = clubs.find(c => c.id === clubId);
                return club ? (
                  <View key={clubId} style={styles.clubTag}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={styles.clubTagText}>{club.name}</Text>
                  </View>
                ) : null;
              })}
            </View>
          </View>
        )}

        {/* Settings */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/settings")}
        >
          <Text style={styles.rowTitle}>Settings</Text>
          <Text style={styles.rowSubtitle}>App preferences</Text>
        </TouchableOpacity>
      </View>

      {/* Log Out button */}
      <TouchableOpacity onPress={handleSignOut} style={styles.button}>
        <Ionicons name="log-out-outline" size={20} color="white" />
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  headerSection: { marginBottom: 20 },
  header: { fontSize: 22, fontWeight: "700" },
  subheader: { fontSize: 14, color: "#666" },
  profileBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#D6E4FF",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: { fontSize: 22, fontWeight: "600", color: "#374151" },
  info: { flexDirection: "column" },
  name: { fontSize: 18, fontWeight: "600" },
  email: { fontSize: 14, color: "#6b7280" },
  settingsBox: {
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 20,
  },
  row: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  rowTitle: { fontSize: 16, fontWeight: "500" },
  rowSubtitle: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  button: {
    marginTop: "auto",
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600", marginLeft: 8 },
  roleContainer: {
    marginTop: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  roleText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowText: {
    marginLeft: 12,
    flex: 1,
  },
  membershipsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  clubTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  clubTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#10B981",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clubTagText: {
    fontSize: 12,
    color: "#065F46",
    fontWeight: "500",
    marginLeft: 4,
  },
});

export default Profile;
