import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native'
import { UserPreferencesService } from '../lib/userPreferences'

interface ProfilePageProps {
  userId: string
  userName: string
  visible: boolean
  onClose: () => void
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ 
  userId, 
  userName, 
  visible, 
  onClose 
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

  useEffect(() => {
    if (visible && userId) {
      loadUserData()
    }
  }, [visible, userId])

  const loadUserData = async () => {
    try {
      const userStats = await UserPreferencesService.getUserStats(userId)
      const userPrefs = await UserPreferencesService.getUserPreferences(userId)
      
      setStats({
        totalLikes: userStats.totalLikes,
        totalDislikes: userStats.totalDislikes,
        topCuisine: userStats.topCuisine,
        favoriteIngredients: userStats.favoriteIngredients,
        averageCookingTime: userStats.averageCookingTime
      })
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
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {hasLearningData ? (
            <>
              {/* Recipe Activity Stats */}
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
              <Text style={styles.emptyText}>
                Start rating recipes with 👍 and 👎 to help Chef Jeff understand your taste preferences. 
                The more you rate, the better your personalized recommendations will become!
              </Text>
              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>💡 Pro Tips:</Text>
                <Text style={styles.tipText}>• Rate recipes honestly to get better suggestions</Text>
                <Text style={styles.tipText}>• Like recipes even if you haven't cooked them yet</Text>
                <Text style={styles.tipText}>• Your preferences will improve with each rating</Text>
              </View>
            </View>
          )}
        </ScrollView>
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
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  tipsContainer: {
    alignSelf: 'stretch',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 16,
  },
}) 
 
 