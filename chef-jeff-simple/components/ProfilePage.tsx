import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, TextInput } from 'react-native'
import { UserPreferencesService } from '../lib/userPreferences'
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

interface ProfilePageProps {
  userId: string
  userName: string
  visible: boolean
  onClose: () => void
  onProfileUpdate?: (newName: string) => void
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ 
  userId, 
  userName, 
  visible, 
  onClose,
  onProfileUpdate
}) => {
  const [stats, setStats] = useState({
    totalLikes: 0,
    totalDislikes: 0,
    topCuisine: undefined as string | undefined,
    favoriteIngredients: [] as string[],
    averageCookingTime: 30
  })
  const [preferences, setPreferences] = useState({
    preferredIngredients: [] as string[],
    dislikedIngredients: [] as string[],
    preferredCuisines: [] as string[],
    dislikedCuisines: [] as string[]
  })
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFirstName, setEditFirstName] = useState(userName.split(' ')[0] || '')
  const [editLastName, setEditLastName] = useState(userName.split(' ').slice(1).join(' ') || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (visible && userId) {
      loadUserData()
    }
  }, [visible, userId])

  // Update edit fields when userName changes
  useEffect(() => {
    setEditFirstName(userName.split(' ')[0] || '')
    setEditLastName(userName.split(' ').slice(1).join(' ') || '')
  }, [userName])

  const loadUserData = async () => {
    try {
      console.log('🔍 ProfilePage: Loading data for userId:', userId)
      console.log('🔍 ProfilePage: userId type:', typeof userId)
      console.log('🔍 ProfilePage: userId length:', userId?.length)
      
      if (!userId || userId.trim() === '') {
        console.error('❌ ProfilePage: Invalid userId:', userId)
        return
      }
      
      // Try cloud aggregates first
      const aggRef = doc(db, 'users', userId, 'preferences', 'aggregates')
      console.log('🔍 ProfilePage: Document path:', aggRef.path)
      const aggSnap = await getDoc(aggRef)

      if (aggSnap.exists()) {
        const agg = aggSnap.data() as any
        console.log('📊 ProfilePage: Firebase aggregates found:', agg)
        setStats(prev => ({
          ...prev,
          totalLikes: agg.totalLikes || 0,
          totalDislikes: agg.totalDislikes || 0,
        }))
      } else {
        console.log('❌ ProfilePage: No Firebase aggregates document found')
      }

      // Local learned preferences (until we compute cloud-side)
      const userStats = await UserPreferencesService.getUserStats(userId)
      const userPrefs = await UserPreferencesService.getUserPreferences(userId)
      console.log('📊 ProfilePage: Local stats:', userStats)
      console.log('📊 ProfilePage: Local prefs:', userPrefs)
      
      setStats(prev => ({
        ...prev,
        topCuisine: userStats.topCuisine,
        favoriteIngredients: userStats.favoriteIngredients,
        averageCookingTime: userStats.averageCookingTime,
      }))
      setPreferences({
        preferredIngredients: userPrefs.preferredIngredients,
        dislikedIngredients: userPrefs.dislikedIngredients,
        preferredCuisines: userPrefs.preferredCuisines,
        dislikedCuisines: userPrefs.dislikedCuisines
      })
    } catch (error) {
      console.error('Failed to load user data:', error)
    }
  }

  const hasLearningData = stats.totalLikes > 0 || stats.totalDislikes > 0

  // Debug: Log stats state changes
  useEffect(() => {
    console.log('🔍 ProfilePage: Stats state updated:', stats)
    console.log('🔍 ProfilePage: hasLearningData:', hasLearningData)
  }, [stats, hasLearningData])

  const handleEditProfile = () => {
    setEditFirstName(userName.split(' ')[0] || '')
    setEditLastName(userName.split(' ').slice(1).join(' ') || '')
    setShowEditModal(true)
  }

  const handleSaveProfile = async () => {
    try {
      // Update profile in Firebase
      const profileRef = doc(db, 'users', userId)
      await updateDoc(profileRef, {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        updatedAt: serverTimestamp()
      })
      
      console.log('✅ Profile updated successfully')
      
      // Update local state
      const newFullName = `${editFirstName.trim()} ${editLastName.trim()}`.trim()
      
      // Notify parent component
      if (onProfileUpdate) {
        onProfileUpdate(newFullName)
      }
      
      setShowEditModal(false)
      
      // Refresh the profile data
      loadUserData()
    } catch (error) {
      console.error('❌ Failed to update profile:', error)
      Alert.alert('Error', 'Failed to update profile. Please try again.')
    }
  }

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true)
  }

  const handleCookbook = () => {
    console.log('Cookbook button pressed')
    // TODO: Navigate to cookbook view showing all liked recipes
    Alert.alert('Cookbook', 'Coming soon! This will show all your liked recipes.')
  }

  const confirmDeleteAccount = async () => {
    try {
      // Delete user data from Firebase
      const userRef = doc(db, 'users', userId)
      await deleteDoc(userRef)
      
      console.log('✅ Account deleted successfully')
      setShowDeleteConfirm(false)
      onClose() // Close profile modal
      
      // You might want to sign out the user here
      // FirebaseAuthService.signOut()
      
      Alert.alert('Account Deleted', 'Your account has been permanently deleted.')
    } catch (error) {
      console.error('❌ Failed to delete account:', error)
      Alert.alert('Error', 'Failed to delete account. Please try again.')
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{userName}'s Kitchen Profile</Text>
          <Text style={styles.subtitle}>Chef Jeff's insights about your tastes</Text>
          <TouchableOpacity onPress={loadUserData} style={styles.refreshButton}>
            <Text style={styles.refreshButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Recipe Activity Stats - Always show */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.totalLikes}</Text>
                <Text style={styles.statLabel}>👍 Liked Recipes</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.totalDislikes}</Text>
                <Text style={styles.statLabel}>👎 Passed Recipes</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.averageCookingTime}m</Text>
                <Text style={styles.statLabel}>⏱️ Avg Cook Time</Text>
              </View>
            </View>
          </View>

          {/* Profile Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Profile</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
                <Text style={styles.actionButtonText}>✏️ Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cookbookButton} onPress={handleCookbook}>
                <Text style={styles.cookbookButtonText}>📚 Cookbook</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                <Text style={styles.deleteButtonText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>

          {hasLearningData ? (
            <>
              {/* Learned Preferences */}
              {preferences.preferredIngredients.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>💚 Favorite Ingredients</Text>
                  <Text style={styles.sectionSubtitle}>
                    Chef Jeff learned you love these from your recipe ratings
                  </Text>
                  <View style={styles.tagContainer}>
                    {preferences.preferredIngredients.slice(0, 8).map((ingredient, index) => (
                      <View key={index} style={[styles.tag, styles.preferredTag]}>
                        <Text style={styles.preferredTagText}>✨ {ingredient}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Cuisine Preferences */}
              {preferences.preferredCuisines.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🌍 Favorite Cuisines</Text>
                  <Text style={styles.sectionSubtitle}>
                    Cuisine styles you consistently enjoy
                  </Text>
                  <View style={styles.cuisineGrid}>
                    {preferences.preferredCuisines.map((cuisine, index) => (
                      <View key={index} style={styles.cuisineCard}>
                        <Text style={styles.cuisineEmoji}>
                          {getCuisineEmoji(cuisine)}
                        </Text>
                        <Text style={styles.cuisineName}>{cuisine}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Dislikes (if any) */}
              {preferences.dislikedIngredients.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🚫 Ingredients to Avoid</Text>
                  <Text style={styles.sectionSubtitle}>
                    Chef Jeff will avoid these in future recipes
                  </Text>
                  <View style={styles.tagContainer}>
                    {preferences.dislikedIngredients.map((ingredient, index) => (
                      <View key={index} style={[styles.tag, styles.dislikedTag]}>
                        <Text style={styles.dislikedTagText}>❌ {ingredient}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          ) : (
            /* No Learning Data Yet */
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🤖</Text>
              <Text style={styles.emptyTitle}>Chef Jeff is Ready to Learn!</Text>
              <Text style={styles.emptySubtitle}>
                Start rating recipes with 👍 and 👎 to help Chef Jeff understand your taste preferences. The more you rate, the better your personalized recommendations will become!
              </Text>
              
              <View style={styles.proTips}>
                <Text style={styles.proTipsTitle}>💡 Pro Tips:</Text>
                <Text style={styles.proTip}>• Rate recipes honestly to get better suggestions</Text>
                <Text style={styles.proTip}>• Like recipes even if you haven't cooked them yet</Text>
                <Text style={styles.proTip}>• Your preferences will improve with each rating</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Edit Profile Modal */}
        <Modal visible={showEditModal} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              
              <TextInput
                style={styles.input}
                placeholder="First Name"
                value={editFirstName}
                onChangeText={setEditFirstName}
                autoCapitalize="words"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={editLastName}
                onChangeText={setEditLastName}
                autoCapitalize="words"
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]} 
                  onPress={handleSaveProfile}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Account Confirmation Modal */}
        <Modal visible={showDeleteConfirm} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Delete Account</Text>
              <Text style={styles.deleteWarning}>
                ⚠️ This action cannot be undone. All your data, recipes, and preferences will be permanently deleted.
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.deleteConfirmButton]} 
                  onPress={confirmDeleteAccount}
                >
                  <Text style={styles.deleteConfirmButtonText}>Delete Forever</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  )
}

const getCuisineEmoji = (cuisine: string): string => {
  const emojiMap: { [key: string]: string } = {
    'Italian': '🍝',
    'Mexican': '🌮',
    'Asian': '🥢',
    'Indian': '🍛',
    'Mediterranean': '🫒',
    'French': '🥖',
    'American': '🍔',
    'Thai': '🍜',
    'Japanese': '🍣',
    'Middle Eastern': '🥙',
    'Fusion': '🌟'
  }
  return emojiMap[cuisine] || '🍽️'
}

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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  refreshButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EA580C',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EA580C',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 2,
  },
  preferredTag: {
    backgroundColor: '#DCFCE7',
    borderColor: '#10B981',
    borderWidth: 1,
  },
  preferredTagText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '500',
  },
  dislikedTag: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  dislikedTagText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '500',
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cuisineCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cuisineEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  cuisineName: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EA580C',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'column', // Changed from 'row' to 'column'
    justifyContent: 'space-around',
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#EA580C',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    marginBottom: 10,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cookbookButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    marginBottom: 10,
  },
  cookbookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    marginBottom: 10,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  proTips: {
    alignSelf: 'stretch',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
  },
  proTipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  proTip: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EA580C',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#EA580C',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteWarning: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  deleteConfirmButton: {
    backgroundColor: '#EF4444',
  },
  deleteConfirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}) 
 
 