import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native'

interface GoogleSignInButtonProps {
  onPress: () => void
  loading?: boolean
  disabled?: boolean
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ 
  onPress, 
  loading = false, 
  disabled = false 
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, (disabled || loading) && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color="#EA580C" style={styles.icon} />
        ) : (
          <GoogleIcon style={styles.icon} />
        )}
        <Text style={styles.text}>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const GoogleIcon: React.FC<{ style?: any }> = ({ style }) => (
  <View style={[styles.googleIcon, style]}>
    <Text style={styles.googleIconText}>G</Text>
  </View>
)

const styles = StyleSheet.create({
  button: {
    width: '100%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 12,
  },
  text: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
}) 
 
 