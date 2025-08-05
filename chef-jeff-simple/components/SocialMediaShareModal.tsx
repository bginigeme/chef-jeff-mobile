import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  Clipboard,
  Share,
} from 'react-native';
import { SocialMediaRecipeService, SocialMediaRecipe } from '../lib/socialMediaRecipeService';
import * as Linking from 'expo-linking';

interface SocialMediaShareModalProps {
  visible: boolean;
  onClose: () => void;
  onRecipeExtracted: (recipe: SocialMediaRecipe) => void;
}

export const SocialMediaShareModal: React.FC<SocialMediaShareModalProps> = ({
  visible,
  onClose,
  onRecipeExtracted,
}) => {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedRecipe, setExtractedRecipe] = useState<SocialMediaRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clipboardContent, setClipboardContent] = useState<string>('');

  const socialMediaService = new SocialMediaRecipeService();

  // Check clipboard for URLs when modal opens
  useEffect(() => {
    if (visible) {
      checkClipboard();
    }
  }, [visible]);

  const checkClipboard = async () => {
    try {
      const content = await Clipboard.getString();
      if (content && SocialMediaRecipeService.isValidSocialMediaUrl(content)) {
        setClipboardContent(content);
      }
    } catch (error) {
      console.log('Could not read clipboard');
    }
  };

  const handleExtractRecipe = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a social media link');
      return;
    }

    if (!SocialMediaRecipeService.isValidSocialMediaUrl(url)) {
      Alert.alert(
        'Invalid Link',
        'Please enter a valid link from Instagram, TikTok, or X (Twitter)'
      );
      return;
    }

    setIsProcessing(true);
    setError(null);
    setExtractedRecipe(null);

    try {
      console.log('🔗 [SOCIAL] Starting recipe extraction for URL:', url);
      const recipe = await socialMediaService.extractRecipeFromLink(url);
      
      console.log('✅ [SOCIAL] Recipe extracted successfully:', recipe.title);
      setExtractedRecipe(recipe);
      
      // Save the recipe
      await socialMediaService.saveSocialMediaRecipe(recipe);
      
    } catch (error: any) {
      console.error('❌ [SOCIAL] Error extracting recipe:', error);
      setError(error.message || 'Failed to extract recipe from the link');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseClipboardUrl = () => {
    setUrl(clipboardContent);
    setClipboardContent('');
  };

  const handleShareFromOtherApps = async () => {
    try {
      const result = await Share.share({
        message: 'Share a recipe link with Chef Jeff!',
        url: 'chefjeff://share',
      });
      
      if (result.action === Share.sharedAction) {
        console.log('Shared successfully');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSaveRecipe = () => {
    if (extractedRecipe) {
      onRecipeExtracted(extractedRecipe);
      handleClose();
    }
  };

  const handleShareRecipe = async () => {
    if (extractedRecipe) {
      try {
        await socialMediaService.shareRecipe(extractedRecipe);
      } catch (error) {
        console.error('Error sharing recipe:', error);
        Alert.alert('Error', 'Failed to share recipe');
      }
    }
  };

  const handleClose = () => {
    setUrl('');
    setExtractedRecipe(null);
    setError(null);
    setIsProcessing(false);
    setClipboardContent('');
    onClose();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return '📷';
      case 'tiktok':
        return '🎵';
      case 'twitter':
      case 'x':
        return '🐦';
      case 'shared':
        return '📱';
      default:
        return '🔗';
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return 'Instagram';
      case 'tiktok':
        return 'TikTok';
      case 'twitter':
      case 'x':
        return 'X (Twitter)';
      case 'shared':
        return 'Shared Content';
      default:
        return 'Social Media';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Share Recipe from Social Media</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {!extractedRecipe ? (
              <>
                <Text style={styles.instructionText}>
                  Share a link from Instagram, TikTok, or X (Twitter) and Chef Jeff will extract the recipe information for you!
                </Text>

                {/* Clipboard URL Detection */}
                {clipboardContent && (
                  <View style={styles.clipboardContainer}>
                    <Text style={styles.clipboardTitle}>📋 Link found in clipboard:</Text>
                    <Text style={styles.clipboardUrl} numberOfLines={2}>
                      {clipboardContent}
                    </Text>
                    <TouchableOpacity
                      style={styles.useClipboardButton}
                      onPress={handleUseClipboardUrl}
                    >
                      <Text style={styles.useClipboardButtonText}>Use This Link</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Share from Other Apps */}
                <View style={styles.shareFromAppsContainer}>
                  <Text style={styles.shareFromAppsTitle}>📱 Share from Other Apps:</Text>
                  <TouchableOpacity
                    style={styles.shareFromAppsButton}
                    onPress={handleShareFromOtherApps}
                  >
                    <Text style={styles.shareFromAppsButtonText}>Share Recipe Link</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.urlInputContainer}>
                  <Text style={styles.inputLabel}>Or paste social media link:</Text>
                  <TextInput
                    style={styles.urlInput}
                    placeholder="https://instagram.com/p/..."
                    value={url}
                    onChangeText={setUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    multiline
                  />
                </View>

                <View style={styles.supportedPlatforms}>
                  <Text style={styles.supportedPlatformsTitle}>Supported Platforms:</Text>
                  <View style={styles.platformList}>
                    <View style={styles.platformItem}>
                      <Text style={styles.platformIcon}>📷</Text>
                      <Text style={styles.platformName}>Instagram</Text>
                    </View>
                    <View style={styles.platformItem}>
                      <Text style={styles.platformIcon}>🎵</Text>
                      <Text style={styles.platformName}>TikTok</Text>
                    </View>
                    <View style={styles.platformItem}>
                      <Text style={styles.platformIcon}>🐦</Text>
                      <Text style={styles.platformName}>X (Twitter)</Text>
                    </View>
                  </View>
                </View>

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.extractButton, isProcessing && styles.extractButtonDisabled]}
                  onPress={handleExtractRecipe}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.extractButtonText}>🔗 Extract Recipe</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.recipePreview}>
                <View style={styles.recipeHeader}>
                  <Text style={styles.platformBadge}>
                    {getPlatformIcon(extractedRecipe.sourcePlatform)} {getPlatformName(extractedRecipe.sourcePlatform)}
                  </Text>
                  {extractedRecipe.username && (
                    <Text style={styles.usernameText}>by @{extractedRecipe.username}</Text>
                  )}
                  <Text style={styles.recipeTitle}>{extractedRecipe.title}</Text>
                </View>

                {extractedRecipe.mediaUrl && (
                  <Image
                    source={{ uri: extractedRecipe.mediaUrl }}
                    style={styles.recipeImage}
                    resizeMode="contain"
                  />
                )}

                <Text style={styles.recipeDescription}>{extractedRecipe.description}</Text>

                <View style={styles.recipeStats}>
                  <Text style={styles.recipeStat}>⏱️ {extractedRecipe.cookingTime} min</Text>
                  <Text style={styles.recipeStat}>👥 Serves {extractedRecipe.servings}</Text>
                  <Text style={styles.recipeStat}>📊 {extractedRecipe.difficulty}</Text>
                </View>

                <View style={styles.ingredientsSection}>
                  <Text style={styles.sectionTitle}>Ingredients:</Text>
                  {extractedRecipe.ingredients.map((ingredient, index) => (
                    <Text key={index} style={styles.ingredient}>
                      • {ingredient.amount ? `${ingredient.amount} ${ingredient.unit || ''} ` : ''}{ingredient.name}
                    </Text>
                  ))}
                </View>

                <View style={styles.instructionsSection}>
                  <Text style={styles.sectionTitle}>Instructions:</Text>
                  {extractedRecipe.instructions.map((instruction, index) => (
                    <Text key={index} style={styles.instruction}>
                      {index + 1}. {instruction}
                    </Text>
                  ))}
                </View>

                {/* Original Text Preview */}
                {extractedRecipe.originalText && (
                  <View style={styles.originalTextSection}>
                    <Text style={styles.sectionTitle}>Original Post:</Text>
                    <Text style={styles.originalText} numberOfLines={3}>
                      {extractedRecipe.originalText}
                    </Text>
                  </View>
                )}

                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveRecipe}>
                    <Text style={styles.saveButtonText}>💾 Save Recipe</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.shareButton} onPress={handleShareRecipe}>
                    <Text style={styles.shareButtonText}>📤 Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 20,
    lineHeight: 24,
  },
  clipboardContainer: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  clipboardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C4A6E',
    marginBottom: 8,
  },
  clipboardUrl: {
    fontSize: 12,
    color: '#0369A1',
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  useClipboardButton: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  useClipboardButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  shareFromAppsContainer: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  shareFromAppsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  shareFromAppsButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  shareFromAppsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  urlInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  supportedPlatforms: {
    marginBottom: 20,
  },
  supportedPlatformsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  platformList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  platformItem: {
    alignItems: 'center',
  },
  platformIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  platformName: {
    fontSize: 12,
    color: '#6B7280',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  extractButton: {
    backgroundColor: '#EA580C',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  extractButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  extractButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recipePreview: {
    marginTop: 10,
  },
  recipeHeader: {
    marginBottom: 16,
  },
  platformBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: '#374151',
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  usernameText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  recipeImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
  },
  recipeDescription: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 16,
    lineHeight: 24,
  },
  recipeStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  recipeStat: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  ingredientsSection: {
    marginBottom: 20,
  },
  instructionsSection: {
    marginBottom: 20,
  },
  originalTextSection: {
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  ingredient: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 20,
  },
  instruction: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  originalText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#EA580C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  shareButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
}); 