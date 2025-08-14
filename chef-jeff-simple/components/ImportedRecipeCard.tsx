import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ScrollView, Linking, Modal, TextInput } from 'react-native';
import { SocialRecipeData } from '../lib/socialRecipeService';
import { SocialRecipeService } from '../lib/socialRecipeService';
import { FirebaseDatabaseService } from '../lib/firebaseDatabase';
import { FirebaseAuthService } from '../lib/firebaseAuth';

interface ImportedRecipeCardProps {
  recipe: SocialRecipeData;
  onSave?: (recipe: SocialRecipeData) => void;
  onDismiss?: () => void;
}

export const ImportedRecipeCard: React.FC<ImportedRecipeCardProps> = ({ 
  recipe, 
  onSave, 
  onDismiss 
}) => {
  const platform = SocialRecipeService.getPlatformFromURL(recipe.sourceURL);
  const [displayImage, setDisplayImage] = useState<string | undefined>(recipe.image);
  const [triedProxy, setTriedProxy] = useState(false);
  const [imageCandidates, setImageCandidates] = useState<string[]>(() => {
    const seed: string[] = []
    if (recipe.image) seed.push(recipe.image)
    return seed
  })
  const [showCoverPicker, setShowCoverPicker] = useState(false)
  const [manualCoverUrl, setManualCoverUrl] = useState('')

  const addCandidate = (url?: string | null) => {
    if (!url || !/^https?:\/\//i.test(url)) return
    setImageCandidates(prev => (prev.includes(url) ? prev : [...prev, url]))
  }
 
  // Upload the external image to Firebase Storage for stable rendering if available
  useEffect(() => {
    (async () => {
      try {
        const user = FirebaseAuthService.getCurrentUser();
        if (user && recipe.image && /^https?:\/\//i.test(recipe.image)) {
          // Try backend proxy upload first for reliability
          const proxied = await SocialRecipeService.proxyUploadImage(user.uid, recipe.image);
          if (proxied) {
            setDisplayImage(proxied);
            addCandidate(proxied)
            return;
          }
          // Fallback to client-side upload
          const url = await FirebaseDatabaseService.uploadExternalImage(user.uid, recipe.image);
          if (url) { setDisplayImage(url); addCandidate(url) }
        }
 
        // If no image was provided (common for some X/Twitter cases), try to resolve it client-side
        if (!recipe.image && recipe.sourceURL && /(?:x\.com|twitter\.com)/i.test(recipe.sourceURL)) {
          const idMatch = recipe.sourceURL.match(/status\/(\d+)/);
          const tweetId = idMatch ? idMatch[1] : null;
          if (tweetId) {
            try {
              // Try syndication first
              const res = await fetch(`https://cdn.syndication.twimg.com/widgets/tweet?id=${tweetId}`);
              if (res.ok) {
                const json = await res.json();
                const photo = Array.isArray(json.photos) && json.photos.length > 0 ? json.photos[0].url : undefined;
                if (photo) {
                  setDisplayImage(photo);
                  addCandidate(photo)
                  return;
                }
              }
            } catch {}
            try {
              // Try vxtwitter API
              const res2 = await fetch(`https://api.vxtwitter.com/Tweet/${tweetId}`);
              if (res2.ok) {
                const j2 = await res2.json();
                const mediaUrl = j2?.mediaURLs?.[0] || j2?.tweet?.mediaURLs?.[0] || j2?.tweet?.media?.all?.[0]?.url;
                if (mediaUrl) {
                  setDisplayImage(mediaUrl);
                  addCandidate(mediaUrl)
                  return;
                }
              }
            } catch {}
          }
        }
      } catch (e) {
        // keep original image
      }
    })();
  }, [recipe.image, recipe.sourceURL]);

  const getProxyUrl = (url: string) => {
    try {
      const stripped = url.replace(/^https?:\/\//i, '');
      return `https://images.weserv.nl/?url=${encodeURIComponent(stripped)}`;
    } catch {
      return url;
    }
  };

  const handleImageError = () => {
    if (!recipe.image) return;
    if (!triedProxy) {
      setTriedProxy(true);
      setDisplayImage(getProxyUrl(recipe.image));
      addCandidate(getProxyUrl(recipe.image))
    } else {
      // final fallback
      const fallback = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&fit=crop'
      setDisplayImage(fallback);
      addCandidate(fallback)
    }
  };

  const handleSelectCover = async (url: string) => {
    try {
      setShowCoverPicker(false)
      addCandidate(url)
      const user = FirebaseAuthService.getCurrentUser();
      if (user) {
        const uploaded = await FirebaseDatabaseService.uploadExternalImage(user.uid, url)
        if (uploaded) {
          setDisplayImage(uploaded)
          addCandidate(uploaded)
          return
        }
      }
      setDisplayImage(url)
    } catch {
      setDisplayImage(url)
    }
  }

  const handleSave = () => {
    Alert.alert(
      'Save Recipe',
      'Would you like to save this recipe to your cookbook?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save', 
          onPress: () => {
            onSave?.({ ...recipe, image: displayImage || recipe.image });
            Alert.alert('Success', 'Recipe saved to your cookbook!');
          }
        }
      ]
    );
  };

  const handleEnhance = () => {
    Alert.alert(
      'Enhance Recipe',
      'Would you like Chef Jeff to enhance this recipe with AI?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Enhance', 
          onPress: () => {
            Alert.alert('Coming Soon', 'AI enhancement will be available soon!');
          }
        }
      ]
    );
  };

  const handleWatchVideo = async () => {
    try {
      const canOpen = await Linking.canOpenURL(recipe.sourceURL);
      if (canOpen) {
        await Linking.openURL(recipe.sourceURL);
      } else {
        Alert.alert(
          'Cannot Open Video',
          'Please make sure you have the Instagram app installed to watch this video.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Unable to open the video. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.platformInfo}>
          <Text style={styles.platformText}>{platform}</Text>
          {recipe.author && (
            <Text style={styles.authorText}>by {recipe.author}</Text>
          )}
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {displayImage && (
          <Image 
            source={{ uri: displayImage }} 
            style={styles.image}
            resizeMode="cover"
            onError={handleImageError}
          />
        )}

        <View style={styles.content}>
          {/* Show AI-generated meal title */}
          {recipe.title && (
            <Text style={styles.title}>{recipe.title}</Text>
          )}

          {/* Only show ingredients if they're AI-generated (not from original post) */}
          {recipe.ingredients && recipe.ingredients.length > 0 && 
           recipe.ingredients.some(ing => ing.includes('•') || ing.includes('-') || ing.includes('tbsp') || ing.includes('cup') || ing.includes('tsp')) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients:</Text>
              {recipe.ingredients.map((ingredient: string, index: number) => (
                <Text key={index} style={styles.ingredient}>
                  • {ingredient}
                </Text>
              ))}
            </View>
          )}

          {/* Only show instructions if they're AI-generated (not from original post) */}
          {recipe.instructions && recipe.instructions.length > 0 && 
           recipe.instructions.some(step => step.includes('1.') || step.includes('2.') || step.includes('3.') || step.includes('Step') || step.includes('minutes')) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instructions:</Text>
              {recipe.instructions.map((step: string, index: number) => (
                <Text key={index} style={styles.instruction}>
                  {index + 1}. {step}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Recipe</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.coverButton} onPress={() => setShowCoverPicker(true)}>
              <Text style={styles.coverButtonText}>Change Cover</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.watchButton} onPress={handleWatchVideo}>
              <Text style={styles.watchButtonText}>Watch Video</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Cover Picker Modal */}
      <Modal visible={showCoverPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose Cover</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {imageCandidates.map((u, idx) => (
                <TouchableOpacity key={idx} onPress={() => handleSelectCover(u)} style={styles.thumbWrap}>
                  <Image source={{ uri: u }} style={styles.thumb} resizeMode="cover" />
                </TouchableOpacity>
              ))}
              {imageCandidates.length === 0 && (
                <View style={[styles.thumbWrap, styles.thumbEmpty]}>
                  <Text style={{ color: '#6B7280' }}>No images found</Text>
                </View>
              )}
            </ScrollView>
            <View style={styles.manualRow}>
              <TextInput
                style={styles.manualInput}
                placeholder="Paste image URL"
                autoCapitalize="none"
                autoCorrect={false}
                value={manualCoverUrl}
                onChangeText={setManualCoverUrl}
              />
              <TouchableOpacity style={styles.useButton} onPress={() => manualCoverUrl.trim() && handleSelectCover(manualCoverUrl.trim())}>
                <Text style={styles.useButtonText}>Use</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.closePicker} onPress={() => setShowCoverPicker(false)}>
              <Text style={styles.closePickerText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  platformInfo: {
    flex: 1,
  },
  platformText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  authorText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  ingredient: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  instruction: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  moreText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  hashtags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  hashtag: {
    fontSize: 12,
    color: '#FF6B35',
    backgroundColor: '#FFF3F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: '#EA580C',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  coverButton: {
    backgroundColor: '#6B7280',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  watchButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  coverButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  watchButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  enhanceButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  enhanceButtonText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: 'white',
    width: '90%',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  thumbWrap: {
    width: 100,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 8,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: { width: '100%', height: '100%' },
  thumbEmpty: { paddingHorizontal: 12 },
  manualRow: { flexDirection: 'row', marginTop: 12 },
  manualInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginRight: 8,
  },
  useButton: {
    backgroundColor: '#EA580C',
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useButtonText: { color: 'white', fontWeight: 'bold' },
  closePicker: { marginTop: 12, alignSelf: 'flex-end' },
  closePickerText: { color: '#6B7280', fontWeight: '600' },
}); 