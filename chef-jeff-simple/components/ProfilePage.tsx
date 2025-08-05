import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert, TextInput } from 'react-native';

interface ProfilePageProps {
  userId: string;
  userName: string;
  visible: boolean;
  onClose: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ userId, userName, visible, onClose }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editedName, setEditedName] = useState(userName);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: () => {
            // Simulate account deletion
            Alert.alert(
              'Account Deleted',
              'Your account has been successfully deleted.',
              [{ text: 'OK', onPress: onClose }]
            );
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    console.log('[ProfilePage] Edit Profile button pressed');
    console.log('[ProfilePage] Current showEditProfile state:', showEditProfile);
    setShowEditProfile(true);
    console.log('[ProfilePage] Set showEditProfile to true');
  };

  const handleSaveProfile = () => {
    if (editedName.trim().length === 0) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    
    Alert.alert('Success', 'Profile updated successfully!');
    setShowEditProfile(false);
  };



  return (
    <>
      {console.log('[ProfilePage] Rendering with showEditProfile:', showEditProfile)}
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{showEditProfile ? 'Edit Profile' : 'Profile'}</Text>
            <TouchableOpacity 
              onPress={showEditProfile ? () => {
                console.log('[ProfilePage] Back button pressed');
                setShowEditProfile(false);
                setEditedName(userName); // Reset to original
              } : onClose} 
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>{showEditProfile ? '←' : '✕'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {!showEditProfile ? (
              <>
                <View style={styles.profileSection}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{editedName.charAt(0)}</Text>
                  </View>
                  <Text style={styles.userName}>{editedName}</Text>
                  <Text style={styles.userId}>User ID: {userId}</Text>
                </View>

                <View style={styles.settingsSection}>
                  <Text style={styles.sectionTitle}>Account Settings</Text>
                  
                  <TouchableOpacity 
                    style={styles.settingItem} 
                    onPress={handleEditProfile}
                    onPressIn={() => console.log('[ProfilePage] Edit Profile button pressed in')}
                  >
                    <Text style={styles.settingText}>Edit Profile</Text>
                    <Text style={styles.settingArrow}>›</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.dangerSection}>
                  <Text style={styles.sectionTitle}>Danger Zone</Text>
                  
                  <TouchableOpacity 
                    style={styles.deleteButton} 
                    onPress={handleDeleteAccount}
                  >
                    <Text style={styles.deleteButtonText}>Delete Account</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.deleteWarning}>
                    This will permanently delete your account and all associated data.
                  </Text>
                </View>
              </>
            ) : (
              // Edit Profile View
              <>
                <View style={styles.editSection}>
                  <Text style={styles.sectionTitle}>Personal Information</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Name</Text>
                    <TextInput
                      style={styles.input}
                      value={editedName}
                      onChangeText={setEditedName}
                      placeholder="Enter your name"
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
                </View>

                <View style={styles.buttonSection}>
                  <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={handleSaveProfile}
                  >
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => {
                      console.log('[ProfilePage] Cancel button pressed');
                      setEditedName(userName); // Reset to original
                      setShowEditProfile(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>


    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#EA580C',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    color: 'white',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  userId: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingsSection: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EA580C',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  settingArrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  dangerSection: {
    marginTop: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteWarning: {
    fontSize: 12,
    color: '#991B1B',
    textAlign: 'center',
  },
  editSection: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#374151',
  },
  buttonSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#EA580C',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
 
 