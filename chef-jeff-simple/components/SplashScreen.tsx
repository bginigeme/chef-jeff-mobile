import React, { useEffect, useRef, useCallback, useState } from 'react'
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native'
import { ChefHatIcon } from './ChefHatIcon'

const { width, height } = Dimensions.get('window')

interface SplashScreenProps {
  onAnimationFinish: () => void
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationFinish }) => {
  const [isReady, setIsReady] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const animatedValues = useRef<{
    fadeAnim: Animated.Value
    scaleAnim: Animated.Value
    slideAnim: Animated.Value
    logoOpacity: Animated.Value
    textOpacity: Animated.Value
  } | null>(null)
  const hasAnimated = useRef(false)

  // Stabilize the animation finish callback
  const handleAnimationFinish = useCallback(() => {
    if (!hasAnimated.current) {
      hasAnimated.current = true
      onAnimationFinish()
    }
  }, [onAnimationFinish])

  useEffect(() => {
    // Initialize all animated values inside useEffect
    animatedValues.current = {
      fadeAnim: new Animated.Value(0),
      scaleAnim: new Animated.Value(0.3),
      slideAnim: new Animated.Value(50),
      logoOpacity: new Animated.Value(0),
      textOpacity: new Animated.Value(0),
    }
    
    // Reset the animation flag
    hasAnimated.current = false
    setIsReady(true)
    
    const { fadeAnim, scaleAnim, slideAnim, logoOpacity, textOpacity } = animatedValues.current
    
    console.log('[SplashScreen] Starting animation sequence...');
    
    // Simplified animation sequence that's more reliable
    const animationSequence = Animated.sequence([
      // Fade in background
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Show logo and text together
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // Hold for a moment
      Animated.delay(1000),
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ])

    console.log('[SplashScreen] Animation sequence starting');
    
    // Start the animation with error handling
    try {
      animationSequence.start((result) => {
        console.log('[SplashScreen] Animation finished with result:', result);
        handleAnimationFinish();
      });
    } catch (error) {
      console.log('[SplashScreen] Animation failed to start:', error);
      // If animation fails, call finish immediately
      handleAnimationFinish();
    }

    // Hard timeout: always call handleAnimationFinish after 3 seconds (reduced from 5)
    const failSafe = setTimeout(() => {
      console.log('[SplashScreen] Hard timeout reached, forcing finish');
      handleAnimationFinish();
    }, 3000);

    // Cleanup function to stop animation if component unmounts
    return () => {
      console.log('[SplashScreen] Cleanup: stopping animation');
      try {
        animationSequence.stop();
      } catch (error) {
        console.log('[SplashScreen] Error stopping animation:', error);
      }
      clearTimeout(failSafe);
    }
  }, [handleAnimationFinish])

  // Add a timeout for the initial render path as well
  useEffect(() => {
    const initialTimeout = setTimeout(() => {
      console.log('[SplashScreen] Initial render timeout reached, forcing ready state');
      setIsReady(true);
    }, 3000);

    return () => clearTimeout(initialTimeout);
  }, []);

  // Don't render until animated values are ready
  if (!isReady || !animatedValues.current) {
    return (
      <View style={styles.container}>
        <View style={styles.debugLogoContainer}>
          <Image 
            source={require('../assets/images/chef-jeff-transparent.png')} 
            style={styles.logoImage}
            resizeMode="contain"
            onLoad={() => {
              console.log('✅ Splash logo loaded successfully')
              setImageLoaded(true)
            }}
            onError={(error) => {
              console.log('❌ Splash logo failed to load:', error.nativeEvent.error)
              setImageError(true)
            }}
          />
          {imageError && (
            <View style={styles.errorFallback}>
              <ChefHatIcon />
              <Text style={styles.errorSubtext}>Chef Jeff</Text>
            </View>
          )}
        </View>
        <Text style={styles.taglineText}>Your Personal Cooking Assistant</Text>
      </View>
    )
  }

  const { fadeAnim, scaleAnim, slideAnim, logoOpacity, textOpacity } = animatedValues.current

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Chef Jeff Logo */}
      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Image 
          source={require('../assets/images/chef-jeff-transparent.png')} 
          style={styles.logoImage}
          resizeMode="contain"
          onLoad={() => {
            console.log('✅ Animated splash logo loaded successfully')
            setImageLoaded(true)
          }}
          onError={(error) => {
            console.log('❌ Animated splash logo failed to load:', error.nativeEvent.error)
            setImageError(true)
          }}
        />
        {imageError && (
          <View style={styles.errorFallback}>
            <ChefHatIcon />
            <Text style={styles.errorSubtext}>Chef Jeff</Text>
          </View>
        )}
      </Animated.View>

      {/* Tagline Text */}
      <Animated.View 
        style={[
          styles.textContainer,
          {
            opacity: textOpacity,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Text style={styles.taglineText}>Your Personal Cooking Assistant</Text>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  logoContainer: {
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
  },
  logoImage: {
    width: 150,
    height: 150,
  },
  textContainer: {
    alignItems: 'center',
  },
  taglineText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  debugLogoContainer: {
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
  },
  errorFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 48,
    color: 'white',
    fontWeight: 'bold',
  },
  errorSubtext: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
}) 
 
 